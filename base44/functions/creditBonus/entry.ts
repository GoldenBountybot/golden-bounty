import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { findOrCreateWallet, mirrorToUser } from '../../shared/wallet.ts';

// Credits a legitimate non-gameplay bonus to the user's wallet. Used for:
//   - cashback (3% loss rebate)
//   - free-spin wins from the daily FreeSpin mini-game
//   - task / airdrop reward claims
//
// Security: the amount is capped at MAX_BONUS to prevent large hacks, and
// every credit is logged as a Transaction record (audit trail). The Wallet
// entity's RLS blocks users from updating it directly, so this function
// (running as the service role) is the only path for positive credits outside
// of settleBet / adminAdjustWallet / deposit functions.
//
// commitBalanceDelta is locked to reject positive deltas, so this function
// is the verified pathway for all legitimate bonus credits.
const MAX_BONUS = 2000; // single-credit cap — large enough for all legit bonuses

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount ?? 0);
    const type = String(body.type || 'bonus');
    const note = String(body.note || '');

    if (!isFinite(amount) || amount <= 0 || amount > MAX_BONUS) {
      return Response.json({ error: 'invalid-amount', max: MAX_BONUS }, { status: 400 });
    }

    // ── Rate limiting: prevent repeated creditBonus abuse from the console ──
    // A hacker could call creditBonus({amount:2000}) in a loop. These two
    // guards bound the damage:
    //   1. Min 2s between calls (slows rapid exploitation).
    //   2. Daily aggregate cap: max $10,000 bonus credits per user per 24h.
    const DAILY_BONUS_CAP = 10000;
    const MIN_INTERVAL_MS = 2000;
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

    const wallet = await findOrCreateWallet(base44, user.id);
    const curBal = Number(wallet.balance ?? 0);
    const curWager = Number(wallet.wager_remaining ?? 0);
    const newBal = curBal + amount;

    const walletUpdate = {
      balance: newBal,
      wager_remaining: curWager,
    };
    // For cashback claims: atomically update cashback_claimed_loss so the
    // same loss can't be double-claimed. This field is now on the Wallet
    // entity (RLS-protected), so users can't reset it to 0 via updateMe.
    const claimedLossDelta = Number(body.claimed_loss ?? 0);
    if (type === 'cashback' && isFinite(claimedLossDelta) && claimedLossDelta > 0) {
      walletUpdate.cashback_claimed_loss = (Number(wallet.cashback_claimed_loss ?? 0) || 0) + claimedLossDelta;
    }
    await base44.asServiceRole.entities.Wallet.update(wallet.id, walletUpdate);

    // Mirror to User entity for display compatibility.
    try { await mirrorToUser(base44, user.id, newBal, curWager); } catch {}

    // Log as a bonus Transaction (audit trail).
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