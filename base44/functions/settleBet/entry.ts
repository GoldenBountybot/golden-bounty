import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { findOrCreateWallet } from '../../shared/wallet.ts';
import { readRtp, decideOutcome } from '../../shared/roundLogic.ts';

// Secure game-round settlement. The bet was already DEDUCTED at beginRound
// time, so settleBet only CREDITS the win. Two paths:
//
// 1. ROUND TOKEN PATH: The win was pre-decided at beginRound and stored in a
//    PendingRound record. settleBet looks it up by round_token and credits
//    the STORED win (fixed mode) or min(client's win, stored cap) (cap mode).
//    The client's win_amount cannot exceed the server's cap — a console hack
//    sending 999999 gets only the capped amount.
//
// 2. FALLBACK PATH (beginRound failed): No round_token. The server deducts
//    the bet and generates the win itself based on RTP — the client's
//    win_amount is IGNORED. This is the safety net for when beginRound fails.
//
// In BOTH paths, the server decides the win — the client can never credit
// more than the server allows, and the bet is always deducted (at beginRound
// or at settle if beginRound failed).
const MAX_WIN_MULT = 5000;
const FREE_SPIN_MAX_WIN = 5000;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const roundToken = String(body.round_token || '');

    // ── Path 1: round token from beginRound (secure, pre-decided win) ──
    if (roundToken) {
      const rounds = await base44.asServiceRole.entities.PendingRound.filter(
        { round_token: roundToken }, '-created_date', 5
      );
      const round = rounds && rounds[0];
      if (!round) return Response.json({ error: 'round-not-found' }, { status: 404 });
      if (round.user_id !== user.id) return Response.json({ error: 'round-not-owned' }, { status: 403 });
      if (round.status !== 'pending') return Response.json({ error: 'round-already-settled' }, { status: 400 });
      if (round.expires_at && new Date(round.expires_at).getTime() < Date.now()) {
        await base44.asServiceRole.entities.PendingRound.update(round.id, { status: 'expired' });
        return Response.json({ error: 'round-expired' }, { status: 400 });
      }

      const storedWin = Number(round.win_amount ?? 0);
      const betAmount = Number(round.bet_amount ?? 0);
      const isFreeSpin = !!round.is_free_spin;
      const gameId = String(round.game_id || 'unknown');
      const settleMode = String(round.settle_mode || 'fixed');

      // fixed mode: credit the stored win (ignore client's win_amount).
      // cap mode: credit min(client's win, stored win) — for games where the
      // player chooses when to cash out (Mines, HiLo). The server caps the max
      // win; the player can cash out for less.
      let winAmount;
      if (settleMode === 'cap') {
        const clientWin = Number(body.win_amount ?? 0);
        winAmount = Math.max(0, Math.min(clientWin, storedWin));
      } else {
        winAmount = storedWin;
      }

      // The bet was already deducted at beginRound time. Only credit the win.
      const wallet = await findOrCreateWallet(base44, user.id);
      if (wallet.banned) return Response.json({ error: 'Account banned' }, { status: 403 });
      const curBal = Number(wallet.balance ?? 0);
      const curWager = Number(wallet.wager_remaining ?? 0);

      const net = winAmount; // bet already deducted at beginRound
      const newBal = curBal + net;
      if (newBal < 0) {
        return Response.json({ error: 'insufficient-balance', balance: curBal, wager_remaining: curWager }, { status: 400 });
      }

      await base44.asServiceRole.entities.Wallet.update(wallet.id, {
        balance: newBal,
      });

      await base44.asServiceRole.entities.PendingRound.update(round.id, { status: 'settled' });

      try {
        await base44.entities.PlayerActivity.create({
          user_id: user.id, user_email: user.email || '', game_id: gameId,
          bet: betAmount, win: winAmount,
          outcome: winAmount > 0 ? 'win' : (betAmount > 0 ? 'loss' : 'push'),
          multiplier: betAmount > 0 ? +(winAmount / betAmount).toFixed(2) : 0,
        });
      } catch { /* logging is best-effort */ }

      return Response.json({ balance: newBal, win_amount: winAmount, wager_remaining: curWager });
    }

    // ── Path 2: fallback (no round token) — server decides win for wins,
    // honors the client's loss direction ──
    const betAmount = Number(body.bet_amount ?? 0);
    const clientWin = Number(body.win_amount ?? 0);
    const gameId = String(body.game_id || 'unknown');
    const isFreeSpin = !!body.is_free_spin;

    if (!isFinite(betAmount) || betAmount < 0 || !isFinite(clientWin) || clientWin < 0) {
      return Response.json({ error: 'invalid-params' }, { status: 400 });
    }

    const wallet = await findOrCreateWallet(base44, user.id);
    if (wallet.banned) return Response.json({ error: 'Account banned' }, { status: 403 });
    const curBal = Number(wallet.balance ?? 0);
    const curWager = Number(wallet.wager_remaining ?? 0);

    if (!isFreeSpin && betAmount > curBal) {
      return Response.json({ error: 'insufficient-balance', balance: curBal, wager_remaining: curWager }, { status: 400 });
    }

    // Honor the client's win/loss DIRECTION:
    // - Client says loss (win=0): credit 0 — the visual matches.
    // - Client says win (win>0): generate a server-side amount based on RTP.
    //   The server may decide it's actually a loss (win=0) — the visual won't
    //   match in that case, but the user can't inflate the win.
    let winAmount;
    if (clientWin === 0) {
      winAmount = 0;
    } else {
      const rtp = await readRtp(base44, user.id, gameId);
      const outcome = decideOutcome(rtp, betAmount, isFreeSpin);
      winAmount = outcome.winAmount;
    }

    const net = isFreeSpin ? winAmount : (winAmount - betAmount);
    const newBal = curBal + net;
    if (newBal < 0) {
      return Response.json({ error: 'insufficient-balance', balance: curBal, wager_remaining: curWager }, { status: 400 });
    }

    const wagerDelta = isFreeSpin ? 0 : -Math.min(betAmount, curWager);
    const newWager = Math.max(0, curWager + wagerDelta);

    await base44.asServiceRole.entities.Wallet.update(wallet.id, {
      balance: newBal,
      wager_remaining: newWager,
    });

    try {
      await base44.entities.PlayerActivity.create({
        user_id: user.id, user_email: user.email || '', game_id: gameId,
        bet: betAmount, win: winAmount,
        outcome: winAmount > 0 ? 'win' : (betAmount > 0 ? 'loss' : 'push'),
        multiplier: betAmount > 0 ? +(winAmount / betAmount).toFixed(2) : 0,
      });
    } catch { /* logging is best-effort */ }

    return Response.json({ balance: newBal, win_amount: winAmount, wager_remaining: newWager });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}