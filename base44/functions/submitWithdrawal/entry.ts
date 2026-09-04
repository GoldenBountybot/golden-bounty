import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { findOrCreateWallet } from '../../shared/wallet.ts';

// Server-side withdrawal submission. Replaces the old client-side flow where
// the frontend called Transaction.create() directly — which let any user
// submit withdrawal requests with $0 balance by bypassing the client-side
// maxWithdrawable check (e.g. from the browser console).
//
// This function validates EVERYTHING server-side before creating the
// pending withdrawal Transaction:
//   1. User is not banned
//   2. Amount >= $5 minimum
//   3. User's actual wallet balance >= amount (server-side, can't be faked)
//   4. Wagering requirement met (wager_remaining == 0, or amount fits in
//      the withdrawable portion above the locked deposit)
//   5. No more than 3 pending withdrawals already exist (anti-spam)
//
// Only after all checks pass does it create the Transaction (service role,
// bypasses RLS) and return success.

const MIN_WITHDRAWAL = 2;
const MAX_WITHDRAWAL = 10000;           // Defense in depth: cap per-request
const DAILY_WITHDRAWAL_LIMIT = 25000;    // Total withdrawals per day
const MAX_PENDING_WITHDRAWALS = 3;
const NEW_ACCOUNT_COOLDOWN_HOURS = 24;  // New accounts can't withdraw for 24h
const AUTO_BAN_REJECTED_THRESHOLD = 5; // 5+ rejected tx in 24h → auto-ban

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch (_e) {}
    const amount = Number(body.amount || 0);
    // Only allow "usdt" — the sole supported withdrawal method. Prevents
    // method injection (the old hack used "stripe" / "ton" to disguise entries).
    const method = 'usdt';
    const reference = String(body.reference || '').trim();   // wallet address
    const note = String(body.note || '');

    if (!amount || amount < MIN_WITHDRAWAL) {
      return Response.json({ error: `Minimum withdrawal is $${MIN_WITHDRAWAL.toFixed(2)}` }, { status: 400 });
    }
    if (amount > MAX_WITHDRAWAL) {
      return Response.json({
        error: `Maximum withdrawal is $${MAX_WITHDRAWAL.toFixed(2)} per request`,
      }, { status: 400 });
    }
    if (!reference) {
      return Response.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // ── Server-side wallet & security checks ──
    const wallet = await findOrCreateWallet(base44, user.id);
    if (wallet.banned) {
      return Response.json({ error: 'Account banned' }, { status: 403 });
    }

    // ── New account cooldown: accounts < 24h old can't withdraw ──
    const accountAgeHours = (Date.now() - new Date(user.created_date).getTime()) / 3600000;
    if (accountAgeHours < NEW_ACCOUNT_COOLDOWN_HOURS) {
      return Response.json({
        error: 'New account cooldown',
        detail: `Withdrawals are available ${NEW_ACCOUNT_COOLDOWN_HOURS}h after registration. Your account is ${accountAgeHours.toFixed(1)}h old.`,
      }, { status: 403 });
    }

    // ── Auto-ban: 5+ rejected transactions in 24h = abuse pattern ──
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const recentRejected = await base44.asServiceRole.entities.Transaction.filter({
      user_id: user.id, status: 'rejected',
    }, '-created_date', 50);
    const rejectedIn24h = recentRejected.filter(t => new Date(t.created_date) > new Date(oneDayAgo));
    if (rejectedIn24h.length >= AUTO_BAN_REJECTED_THRESHOLD) {
      // Auto-ban the wallet — stops the abuse immediately.
      await base44.asServiceRole.entities.Wallet.update(wallet.id, { banned: true });
      return Response.json({
        error: 'Account auto-banned',
        detail: 'Suspicious activity detected. Too many rejected transactions. Your account has been flagged for review.',
      }, { status: 403 });
    }

    // ── Daily withdrawal limit: max $25,000 total per day ──
    const todayStart = new Date(Date.now() - 86400000).toISOString();
    const recentWithdrawals = await base44.asServiceRole.entities.Transaction.filter({
      user_id: user.id, type: 'withdraw',
    }, '-created_date', 50);
    const withdrawnToday = recentWithdrawals
      .filter(t => new Date(t.created_date) > new Date(todayStart) && t.status !== 'rejected')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    if (withdrawnToday + amount > DAILY_WITHDRAWAL_LIMIT) {
      return Response.json({
        error: 'Daily limit exceeded',
        detail: `You've requested $${withdrawnToday.toFixed(2)} in withdrawals today. Daily limit is $${DAILY_WITHDRAWAL_LIMIT.toFixed(2)}.`,
      }, { status: 400 });
    }

    const balance = Number(wallet.balance ?? 0);
    const wagerRemaining = Number(wallet.wager_remaining ?? 0);

    // Available = balance minus unplayed-through deposit.
    // NOTE: staked_amount is already deducted from `balance` at stake time
    // (stakeOperation does $inc: { balance: -amount, staked_amount: +amount }),
    // so it must NOT be subtracted again here — doing so double-counts the lock
    // and makes the user's real withdrawable balance appear as $0.
    const available = Math.max(0, balance - wagerRemaining);

    // Compare in whole cents to avoid floating-point false negatives
    // (e.g. balance 2.6499999 vs requested 2.65).
    if (Math.round(amount * 100) > Math.round(balance * 100)) {
      return Response.json({
        error: 'Insufficient balance',
        detail: `Your balance is $${balance.toFixed(2)} but you requested $${amount.toFixed(2)}.`,
      }, { status: 400 });
    }

    if (Math.round(amount * 100) > Math.round(available * 100)) {
      return Response.json({
        error: 'Wagering requirement not met',
        detail: wagerRemaining > 0
          ? `Play through or stack $${wagerRemaining.toFixed(2)} of your deposit before withdrawing.`
          : 'Only winnings above your locked deposit can be withdrawn.',
      }, { status: 400 });
    }

    // ── Anti-spam: limit pending withdrawals ──
    const pending = await base44.asServiceRole.entities.Transaction.filter({
      user_id: user.id, type: 'withdraw', status: 'pending',
    }, '-created_date', 100);
    if (pending.length >= MAX_PENDING_WITHDRAWALS) {
      return Response.json({
        error: 'Too many pending withdrawals',
        detail: `You already have ${pending.length} withdrawal request(s) awaiting approval. Please wait for them to be processed.`,
      }, { status: 400 });
    }

    // ── All checks passed — HOLD the funds immediately ──
    // The amount leaves the wallet the moment the request is made, so the same
    // balance can't be withdrawn again while the request awaits approval.
    // Admin approval only marks it completed (no second deduction); rejection
    // refunds the held amount.
    await base44.asServiceRole.entities.Wallet.updateMany(
      { user_id: user.id },
      { $inc: { balance: -amount } }
    );
    const heldWallet = await findOrCreateWallet(base44, user.id);
    const balanceAfter = Math.max(0, Number(heldWallet.balance ?? 0));
    const wagerAfter = Math.max(0, Number(heldWallet.wager_remaining ?? 0));

    // ── Create the withdrawal transaction ──
    const tx = await base44.asServiceRole.entities.Transaction.create({
      user_id: user.id,
      user_email: user.email || '',
      type: 'withdraw',
      amount,
      status: 'pending',
      method,
      reference,
      note,
    });

    // ── Notify every admin in-app (notification bell) about the new request ──
    try {
      const admins = await base44.asServiceRole.entities.User.list(100);
      const adminList = (admins || []).filter((u: any) => u.role === 'admin');
      const walletPreview = reference ? reference.slice(0, 10) + '…' : '—';
      const title = `Withdraw Request · $${amount.toFixed(2)}`;
      const body = `Player: ${user.email || user.id}\nAmount: $${amount.toFixed(2)}\nWallet: ${walletPreview}`;
      // Create one notification per admin so each sees it in their bell.
      if (adminList.length > 0) {
        await base44.asServiceRole.entities.UserNotification.bulkCreate(
          adminList.map((a: any) => ({
            user_id: a.id,
            type: 'withdraw_requested',
            title,
            body,
            amount,
            link: '/admin',
          }))
        );
      }
    } catch (_e) {
      // notification creation must never block the withdrawal flow
    }

    return Response.json({
      ok: true,
      transaction_id: tx.id,
      balance: balanceAfter,
      wager_remaining: wagerAfter,
      available: Math.max(0, balanceAfter - wagerAfter),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}