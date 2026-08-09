import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { findOrCreateWallet } from '../../shared/wallet.ts';
import { readRtp, decideOutcome } from '../../shared/roundLogic.ts';

// Secure game-round settlement. The bet was already DEDUCTED at beginRound
// time, so settleBet only CREDITS the win.
//
// SECURITY LAYERS:
//   1. ATOMIC CLAIM (anti double-credit): Before crediting, we atomically
//      claim the PendingRound via updateMany({status:'pending'}, {$set:
//      {status:'settled', settle_claim: <uuid>}}). Then we re-read and verify
//      our claim token matches. If a concurrent call already claimed it, the
//      re-read shows a DIFFERENT token and we abort WITHOUT crediting. This
//      closes the race condition where calling settleBet twice with the same
//      round_token credited the win twice.
//   2. ROUND TOKEN REQUIRED: No round_token = no settlement. The old fallback
//      path (no token, server generates win) trusted the client's bet_amount
//      and win direction — an attack surface. Now ALL settlements must go
//      through beginRound first, which pre-decides the outcome server-side.
//   3. WIN CAP: Even the server-decided win is capped at MAX_WIN_PER_ROUND
//      ($50,000) as defense in depth.
//   4. BAN CHECK: Banned wallets can't settle rounds.
//   5. OWNERSHIP CHECK: The round's user_id must match the caller.
//   6. EXPIRY CHECK: Expired rounds can't be settled (win forfeited).
//
// The client's win_amount is NEVER trusted:
//   - 'fixed' mode: the stored server win is credited (client win ignored).
//   - 'cap' mode: min(client's win, stored cap) is credited — the player can
//     cash out for LESS than the cap but never MORE.

const MAX_WIN_PER_ROUND = 50000; // Defense in depth: absolute cap per round

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const roundToken = String(body.round_token || '');

    // ── REQUIRE round_token — no fallback path ──
    // The old fallback (no token) trusted the client's bet_amount and win
    // direction. Now ALL settlements must come from a beginRound-created
    // PendingRound with a server-pre-decided outcome.
    if (!roundToken) {
      return Response.json({
        error: 'round-token-required',
        detail: 'A valid round token from beginRound is required to settle.',
      }, { status: 400 });
    }

    // ── Read the pending round ──
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

    // ── ATOMIC CLAIM: prevent double-credit race condition ──
    // Atomically set status='settled' + settle_claim=ourToken ONLY IF the
    // round is still 'pending'. If a concurrent call already claimed it,
    // our updateMany affects 0 rows and the re-read shows a different token.
    const claimToken = crypto.randomUUID();
    await base44.asServiceRole.entities.PendingRound.updateMany(
      { round_token: roundToken, status: 'pending' },
      { $set: { status: 'settled', settle_claim: claimToken } }
    );

    // Re-read to verify WE won the race (our claim token is set).
    const recheck = await base44.asServiceRole.entities.PendingRound.filter(
      { round_token: roundToken }, '-created_date', 1
    );
    const claimedRound = recheck && recheck[0];
    if (!claimedRound || claimedRound.settle_claim !== claimToken) {
      // Another concurrent call already claimed and credited this round.
      // Abort WITHOUT crediting — the other call handles the credit.
      return Response.json({ error: 'round-already-settled' }, { status: 400 });
    }

    // ── We won the race — safe to credit ──
    const storedWin = Math.min(Number(round.win_amount ?? 0), MAX_WIN_PER_ROUND);
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
      const clientWin = Math.min(Number(body.win_amount ?? 0), MAX_WIN_PER_ROUND);
      winAmount = Math.max(0, Math.min(clientWin, storedWin));
    } else {
      winAmount = storedWin;
    }

    // The bet was already deducted at beginRound time. Only credit the win.
    const wallet = await findOrCreateWallet(base44, user.id);
    if (wallet.banned) return Response.json({ error: 'Account banned' }, { status: 403 });
    const curBal = Number(wallet.balance ?? 0);
    const curWager = Number(wallet.wager_remaining ?? 0);

    const newBal = curBal + winAmount;
    // This should never go negative (we're only crediting), but guard anyway.
    if (newBal < 0) {
      return Response.json({ error: 'insufficient-balance', balance: curBal, wager_remaining: curWager }, { status: 400 });
    }

    await base44.asServiceRole.entities.Wallet.update(wallet.id, {
      balance: newBal,
    });

    try {
      await base44.entities.PlayerActivity.create({
        user_id: user.id, user_email: user.email || '', game_id: gameId,
        bet: betAmount, win: winAmount,
        outcome: winAmount > 0 ? 'win' : (betAmount > 0 ? 'loss' : 'push'),
        multiplier: betAmount > 0 ? +(winAmount / betAmount).toFixed(2) : 0,
      });
    } catch { /* logging is best-effort */ }

    return Response.json({ balance: newBal, win_amount: winAmount, wager_remaining: curWager });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}