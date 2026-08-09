import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { findOrCreateWallet } from '../../shared/wallet.ts';
import { readRtp, decideOutcome } from '../../shared/roundLogic.ts';

// Begins a secure game round. The server pre-decides the outcome (win/loss +
// win amount) based on RTP and stores it in a PendingRound record. The client
// receives the decision so it can display the correct visual, but the
// AUTHORITATIVE win is stored server-side — settleBet credits the stored
// amount, ignoring whatever the client sends.
//
// The bet is NOT deducted here; it is deducted atomically with the win at
// settleBet time (so a round that is never settled costs the user nothing).
//
// Security: a user calling settleBet from the console with a huge win_amount
// gets only the server-decided amount stored here — they can't inflate it.
const ROUND_TTL_MS = 60 * 60 * 1000; // 1 hour to settle

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const betAmount = Number(body.bet_amount ?? 0);
    const gameId = String(body.game_id || 'unknown');
    const isFreeSpin = !!body.is_free_spin;
    const settleMode = String(body.settle_mode || 'fixed');

    if (!isFinite(betAmount) || betAmount < 0) {
      return Response.json({ error: 'invalid-params' }, { status: 400 });
    }

    const wallet = await findOrCreateWallet(base44, user.id);
    if (wallet.banned) return Response.json({ error: 'Account banned' }, { status: 403 });
    const curBal = Number(wallet.balance ?? 0);

    // For regular spins: bet must not exceed balance (deducted later at settle).
    if (!isFreeSpin && betAmount > curBal) {
      return Response.json({ error: 'insufficient-balance', balance: curBal }, { status: 400 });
    }

    // Read RTP and decide the outcome entirely server-side.
    const rtp = await readRtp(base44, user.id, gameId);
    const outcome = decideOutcome(rtp, betAmount, isFreeSpin);

    // Generate an unguessable round token and store the pending round.
    const roundToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ROUND_TTL_MS).toISOString();
    await base44.asServiceRole.entities.PendingRound.create({
      user_id: user.id,
      round_token: roundToken,
      game_id: gameId,
      bet_amount: betAmount,
      win_amount: outcome.winAmount,
      is_free_spin: isFreeSpin,
      settle_mode: settleMode,
      status: 'pending',
      expires_at: expiresAt,
    });

    return Response.json({
      round_token: roundToken,
      win_amount: outcome.winAmount,
      is_win: outcome.isWin,
      multiplier: outcome.multiplier,
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}