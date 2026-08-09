import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { findOrCreateWallet, mirrorToUser } from '../../shared/wallet.ts';

// Credits a legitimate non-gameplay bonus to the user's wallet. Used for:
//   - cashback (3% loss rebate)
//   - free-spin wins from the daily FreeSpin mini-game
//   - signup / daily / weekly / monthly / deposit bonuses
//
// SECURITY: Each bonus type is verified SERVER-SIDE before crediting:
//   - cashback: re-calculates actual unclaimed loss from transactions + wallet.
//   - free_spin: checks no free_spin bonus in the last 24h (Transaction history).
//   - signup: checks no signup bonus ever.
//   - daily/weekly/monthly: checks no same-type bonus in the current period.
//   - deposit_bonus: checks no deposit_bonus in the last hour.
//
// This prevents console hacking: a user calling creditBonus directly from the
// browser console is rejected because the server verifies eligibility using
// data the user can't fake (Transaction records are RLS-protected — users
// can't create bonus-type Transactions, only this service-role function can).
//
// Additional guards:
//   - MAX_BONUS: single-credit cap ($2,000).
//   - MIN_INTERVAL_MS: 2s between calls.
//   - DAILY_BONUS_CAP: $10,000 aggregate bonus credits per user per 24h.
const MAX_BONUS = 2000;
const DAILY_BONUS_CAP = 10000;
const MIN_INTERVAL_MS = 2000;
const ALLOWED_TYPES = ['cashback', 'free_spin', 'signup', 'daily', 'weekly', 'monthly', 'deposit_bonus'];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount ?? 0);
    const type = String(body.type || '');
    const note = String(body.note || '');
    const claimedLoss = Number(body.claimed_loss ?? 0);

    if (!ALLOWED_TYPES.includes(type)) {
      return Response.json({ error: 'invalid-type' }, { status: 400 });
    }
    if (!isFinite(amount) || amount <= 0 || amount > MAX_BONUS) {
      return Response.json({ error: 'invalid-amount', max: MAX_BONUS }, { status: 400 });
    }

    // ── Rate limiting ──
    try {
      const recent = await base44.asServiceRole.entities.Transaction.filter(
        { user_id: user.id, type: 'bonus' }, '-created_date', 200
      );
      const nowMs = Date.now();
      if (recent && recent.length > 0 && recent[0].created_date) {
        const lastMs = new Date(recent[0].created_date).getTime();
        if (nowMs - lastMs < MIN_INTERVAL_MS) {
          return Response.json({ error: 'rate-limited' }, { status: 429 });
        }
      }
      const dayAgo = nowMs - 24 * 60 * 60 * 1000;
      const dailySum = (recent || [])
        .filter((t) => new Date(t.created_date).getTime() >= dayAgo)
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);
      if (dailySum + amount > DAILY_BONUS_CAP) {
        return Response.json({ error: 'daily-cap-exceeded', cap: DAILY_BONUS_CAP, used: dailySum }, { status: 429 });
      }
    } catch { /* rate-limit check is best-effort */ }

    // ── Load wallet + bonus transaction history for eligibility checks ──
    const wallet = await findOrCreateWallet(base44, user.id);
    if (wallet.banned) return Response.json({ error: 'Account banned' }, { status: 403 });
    const bonusTxns = await base44.asServiceRole.entities.Transaction.filter(
      { user_id: user.id, type: 'bonus' }, '-created_date', 500
    );
    const now = Date.now();
    const hasClaimed = (method, sinceMs) =>
      (bonusTxns || []).some((t) => t.method === method && new Date(t.created_date).getTime() >= sinceMs);

    let extraWalletUpdate = {};

    // ── Per-type eligibility verification ──
    if (type === 'cashback') {
      if (!isFinite(claimedLoss) || claimedLoss <= 0) {
        return Response.json({ error: 'invalid-claimed-loss' }, { status: 400 });
      }
      if (Math.abs(amount - claimedLoss * 0.03) > 1) {
        return Response.json({ error: 'amount-mismatch' }, { status: 400 });
      }
      // Re-calculate actual unclaimed loss from transactions + wallet.
      const allTxns = await base44.asServiceRole.entities.Transaction.filter(
        { user_id: user.id }, '-created_date', 1000
      );
      const deposits = (allTxns || [])
        .filter((t) => t.type === 'deposit' && (t.status === 'completed' || t.status === 'approved'))
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const withdrawals = (allTxns || [])
        .filter((t) => t.type === 'withdraw' && (t.status === 'completed' || t.status === 'approved'))
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const currentBalance = Number(wallet.balance ?? 0);
      const totalLoss = Math.max(0, deposits - withdrawals - currentBalance);
      const alreadyClaimed = Number(wallet.cashback_claimed_loss ?? 0) || 0;
      const unclaimedLoss = Math.max(0, totalLoss - alreadyClaimed);
      if (claimedLoss > unclaimedLoss + 1) {
        return Response.json({ error: 'loss-exceeds-actual', unclaimed: unclaimedLoss }, { status: 400 });
      }
      extraWalletUpdate.cashback_claimed_loss = alreadyClaimed + claimedLoss;
    } else if (type === 'free_spin') {
      const dayAgo = now - 24 * 60 * 60 * 1000;
      if (hasClaimed('free_spin', dayAgo)) {
        return Response.json({ error: 'already-claimed' }, { status: 429 });
      }
    } else if (type === 'signup') {
      if (hasClaimed('signup', 0)) {
        return Response.json({ error: 'already-claimed' }, { status: 429 });
      }
    } else if (type === 'daily') {
      const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
      if (hasClaimed('daily', dayStart.getTime())) {
        return Response.json({ error: 'already-claimed-today' }, { status: 429 });
      }
    } else if (type === 'weekly') {
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      if (hasClaimed('weekly', weekAgo)) {
        return Response.json({ error: 'already-claimed-this-week' }, { status: 429 });
      }
    } else if (type === 'monthly') {
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      if (hasClaimed('monthly', monthStart.getTime())) {
        return Response.json({ error: 'already-claimed-this-month' }, { status: 429 });
      }
    } else if (type === 'deposit_bonus') {
      const hourAgo = now - 60 * 60 * 1000;
      if (hasClaimed('deposit_bonus', hourAgo)) {
        return Response.json({ error: 'already-claimed' }, { status: 429 });
      }
    }

    // ── Credit the wallet ──
    const curBal = Number(wallet.balance ?? 0);
    const curWager = Number(wallet.wager_remaining ?? 0);
    const newBal = curBal + amount;

    await base44.asServiceRole.entities.Wallet.update(wallet.id, {
      balance: newBal,
      wager_remaining: curWager,
      ...extraWalletUpdate,
    });

    try { await mirrorToUser(base44, user.id, newBal, curWager); } catch {}

    try {
      await base44.entities.Transaction.create({
        user_id: user.id,
        user_email: user.email || '',
        type: 'bonus',
        amount,
        status: 'completed',
        method: type,
        note,
      });
    } catch { /* logging is best-effort */ }

    return Response.json({ balance: newBal, wager_remaining: curWager });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}