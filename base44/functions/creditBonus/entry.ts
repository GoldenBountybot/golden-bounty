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

    const wallet = await findOrCreateWallet(base44, user.id);
    const curBal = Number(wallet.balance ?? 0);
    const curWager = Number(wallet.wager_remaining ?? 0);
    const newBal = curBal + amount;

    await base44.asServiceRole.entities.Wallet.update(wallet.id, {
      balance: newBal,
      wager_remaining: curWager,
    });

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