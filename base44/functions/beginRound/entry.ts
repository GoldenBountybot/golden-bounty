import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { findOrCreateWallet } from '../../shared/wallet.ts';
import { readRtp, decideOutcome } from '../../shared/roundLogic.ts';

// Begins a secure game round. The server DEDUCTS THE BET IMMEDIATELY and
// pre-decides the outcome (win/loss + win amount) based on RTP, storing it
// in a PendingRound record.
//
// Deducting the bet at begin time (not settle time) closes the "avoid loss
// by not settling" hack — a user who closes the page mid-round has already
// lost the bet. The pre-decided win is forfeited if the round is never
// settled (expires after 1h).
//
// settle_mode:
//   'fixed' — the stored win_amount is the EXACT win (slot-style games
//            where the server decides the full outcome). settleBet credits
//            this amount, ignoring the client's win.
//   'cap'   — the stored win_amount is a MAXIMUM CAP. The client sends the
//            actual game win; settleBet credits min(client_win, cap). Used
//            by games where the player chooses when to cash out (Mines,
//            HiLo, Crash, Argonauts, CrownCoins) so the real game outcome
//            is honored but can never exceed the server's cap.
const ROUND_TTL_MS = 60 * 60 * 1000; // 1 hour to settle
const MAX_WIN_MULT = 5000;
const FREE_SPIN_MAX_WIN = 5000;

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
    const curWager = Number(wallet.wager_remaining ?? 0);

    // Deduct the bet immediately (non-free-spin). This prevents the user
    // from avoiding a loss by closing the page before settleBet.
    let newBal = curBal;
    let newWager = curWager;
    if (!isFreeSpin && betAmount > 0) {
      if (betAmount > curBal) {
        return Response.json({ error: 'insufficient-balance', balance: curBal }, { status: 400 });
      }
      newBal = curBal - betAmount;
      newWager = Math.max(0, curWager - Math.min(betAmount, curWager));
      await base44.asServiceRole.entities.Wallet.update(wallet.id, {
        balance: newBal,
        wager_remaining: newWager,
      });
    }

    // Decide the outcome entirely server-side.
    const rtp = await readRtp(base44, user.id, gameId);
    let outcome;
    if (settleMode === 'cap') {
      // Cap mode: store a generous max-win cap. The actual win is the
      // client's (the game's real outcome), capped at this amount.
      const cap = isFreeSpin
        ? FREE_SPIN_MAX_WIN
        : Math.min(betAmount * MAX_WIN_MULT, FREE_SPIN_MAX_WIN);
      outcome = { isWin: true, winAmount: cap, multiplier: MAX_WIN_MULT };
    } else {
      outcome = decideOutcome(rtp, betAmount, isFreeSpin);
    }

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
      balance: newBal,
      wager_remaining: newWager,
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}