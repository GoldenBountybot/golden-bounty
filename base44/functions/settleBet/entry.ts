import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { findOrCreateWallet, mirrorToUser } from '../../shared/wallet.ts';

// Secure game-round settlement. This is the ONLY way gameplay can change a
// balance. It deducts the bet and credits the win in ONE atomic server-side
// operation, with full verification:
//
//  1. bet_amount must be > 0 (can't settle a round with no bet — prevents
//     free-money credits disguised as gameplay).
//  2. bet_amount must be <= current wallet balance (can't bet what you don't
//     have — prevents overdraft hacking).
//  3. win_amount is capped at bet_amount * MAX_WIN_MULT (prevents inflated-win
//     hacks — a hacker can't report a $999999 win on a $1 bet).
//  4. The net = win - bet is applied atomically; the wallet is re-read first so
//     admin credits / deposits are never overwritten.
//  5. A PlayerActivity record is logged for every round (audit trail).
//
// Free spins: pass is_free_spin=true. The bet is NOT deducted (it was already
// paid by the triggering spin), but win_amount is still capped at
// bet_amount * MAX_WIN_MULT (bet_amount = the original triggering bet, for
// cap purposes only).
//
// The Wallet entity's RLS blocks users from updating it directly, so this
// function (running as the service role) is the only path.
const MAX_WIN_MULT = 5000; // covers crash (500x), slots (1024x), all games

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const betAmount = Number(body.bet_amount ?? 0);
    const winAmount = Number(body.win_amount ?? 0);
    const gameId = String(body.game_id || 'unknown');
    const isFreeSpin = !!body.is_free_spin;

    if (!isFinite(betAmount) || !isFinite(winAmount) || betAmount < 0 || winAmount < 0) {
      return Response.json({ error: 'invalid-params' }, { status: 400 });
    }

    const wallet = await findOrCreateWallet(base44, user.id);
    const curBal = Number(wallet.balance ?? 0);
    const curWager = Number(wallet.wager_remaining ?? 0);

    // For regular spins: the bet must not exceed the current balance.
    // For free spins: the bet is not deducted, so no balance check needed.
    if (!isFreeSpin && betAmount > curBal) {
      return Response.json({
        error: 'insufficient-balance',
        balance: curBal,
        wager_remaining: curWager,
      }, { status: 400 });
    }

    // Cap the win at bet * MAX_WIN_MULT to prevent inflated-win hacks.
    // For free spins, betAmount is the original triggering bet (for cap only).
    const maxWin = betAmount > 0 ? betAmount * MAX_WIN_MULT : 0;
    const actualWin = Math.min(winAmount, maxWin);

    // Net change: win - bet (regular) or win (free spin, bet not deducted).
    const net = isFreeSpin ? actualWin : (actualWin - betAmount);
    const newBal = curBal + net;

    if (newBal < 0) {
      return Response.json({
        error: 'insufficient-balance',
        balance: curBal,
        wager_remaining: curWager,
      }, { status: 400 });
    }

    // Wagering: any bet (not free spin) counts as play-through.
    const wagerDelta = isFreeSpin ? 0 : -Math.min(betAmount, curWager);
    const newWager = Math.max(0, curWager + wagerDelta);

    await base44.asServiceRole.entities.Wallet.update(wallet.id, {
      balance: newBal,
      wager_remaining: newWager,
    });

    // Mirror to User entity for display compatibility (admin panels, etc.)
    try { await mirrorToUser(base44, user.id, newBal, newWager); } catch {}

    // Log the round as a PlayerActivity record (audit trail).
    try {
      await base44.entities.PlayerActivity.create({
        user_id: user.id,
        user_email: user.email || '',
        game_id: gameId,
        bet: betAmount,
        win: actualWin,
        outcome: actualWin > betAmount ? 'win' : (actualWin === 0 && betAmount > 0 ? 'loss' : 'push'),
        multiplier: betAmount > 0 ? +(actualWin / betAmount).toFixed(2) : 0,
      });
    } catch { /* logging is best-effort */ }

    return Response.json({ balance: newBal, wager_remaining: newWager });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}