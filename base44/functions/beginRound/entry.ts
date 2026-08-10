import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { findOrCreateWallet } from '../../shared/wallet.ts';
import { decideOutcome } from '../../shared/roundLogic.ts';
import { getGameConfig } from '../../shared/gameRegistry.ts';

// Begins a secure game round. The server DEDUCTS THE BET IMMEDIATELY and
// pre-decides the outcome (win/loss + win amount) based on RTP, storing it
// in a PendingRound record. (redeploy trigger v3 — force redeploy with fixed Plinko logic)
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
const MAX_WIN_PER_ROUND = 50000; // Absolute cap — defense in depth

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const betAmount = Number(body.bet_amount ?? 0);
    const gameId = String(body.game_id || 'unknown');
    const requestedFreeSpin = !!body.is_free_spin;

    // ── SECURITY: validate game_id against the server-side registry ──
    // A hacker cannot use a fake game_id to get a different RTP or game config.
    const gameConfig = getGameConfig(gameId);
    if (!gameConfig) {
      return Response.json({ error: 'invalid-game' }, { status: 400 });
    }

    // ── SECURITY: override settle_mode from the registry ──
    // The client cannot switch from 'fixed' (server-decided win) to 'cap'
    // (uncapped client win) to bypass the server's win decision.
    // HARD OVERRIDE for plinko: always 'fixed' — the server decides the exact
    // bucket multiplier win. This guards against a stale registry deployment
    // that still has plinko as 'cap' (which would give every round $5000).
    // v5: owner-specified bucket distribution (0.1x:65% · 2x:25% · 5x:5% ...).
    const settleMode = gameId === 'plinko' ? 'fixed' : gameConfig.settleMode;

    // ── SECURITY: validate is_free_spin ──
    // Only games that support free spins can have is_free_spin=true.
    // For games that don't support it, is_free_spin is forced to false
    // (the bet WILL be deducted).
    const isFreeSpin = requestedFreeSpin && gameConfig.supportsFreeSpins;

    if (!isFinite(betAmount) || betAmount < 0) {
      return Response.json({ error: 'invalid-params' }, { status: 400 });
    }

    // ── Read GameSetting + Wallet ONCE (used for bet validation AND RTP) ──
    // This avoids the duplicate DB calls that readRtp() would make (it
    // re-lists GameSetting and re-filters Wallet internally). Cutting these
    // redundant queries reduces the round-trip from ~800ms to ~400ms.
    let minBet = 0.01;
    let maxBet = 500;
    let gameRtp = 50;
    try {
      const settings = await base44.asServiceRole.entities.GameSetting.list();
      const per = settings.find(r => r.game_id === gameId);
      const global = settings.find(r => r.game_id === '*');
      const active = per && per.enabled !== false ? per : (global && global.enabled !== false ? global : null);
      if (active) {
        minBet = Number(active.min_bet ?? 0.01);
        maxBet = Number(active.max_bet ?? 500);
        gameRtp = Number(active.rtp ?? 50);
      }
    } catch { /* best-effort */ }
    if (betAmount < minBet || betAmount > maxBet) {
      return Response.json({ error: 'bet-out-of-range', min: minBet, max: maxBet }, { status: 400 });
    }

    const wallet = await findOrCreateWallet(base44, user.id);
    if (wallet.banned) return Response.json({ error: 'Account banned' }, { status: 403 });
    const curBal = Number(wallet.balance ?? 0);
    const curWager = Number(wallet.wager_remaining ?? 0);

    // ── Resolve RTP from the already-read data (no extra DB calls) ──
    // Per-player Wallet override > per-game setting > global > 50.
    let rtp = gameRtp;
    if (wallet.rtp !== undefined && wallet.rtp !== null) {
      const userRtp = Number(wallet.rtp);
      if (!Number.isNaN(userRtp)) rtp = userRtp;
    }
    rtp = Math.max(0, Math.min(100, rtp));

    // ── SECURITY: free spin rate limiting ──
    // Prevent is_free_spin abuse: a hacker sending is_free_spin=true every
    // time to avoid bet deduction. Count the user's recent free spin rounds
    // and reject if the count or ratio is too high. Legitimate users rarely
    // have more than 10 free spins per 100 rounds (from scatter triggers).
    if (isFreeSpin) {
      const recentRounds = await base44.asServiceRole.entities.PendingRound.filter(
        { user_id: user.id }, '-created_date', 100
      );
      const total = recentRounds.length;
      const freeCount = recentRounds.filter(r => r.is_free_spin).length;
      if (freeCount >= 15 || (total >= 20 && freeCount / total > 0.25)) {
        return Response.json({ error: 'free-spin-rate-limit' }, { status: 429 });
      }
    }

    // Deduct the bet immediately (non-free-spin). This prevents the user
    // from avoiding a loss by closing the page before settleBet.
    //
    // ATOMIC CHECK-AND-DEDUCT: The updateMany filter includes
    // `balance: { $gte: betAmount }`, so the deduction ONLY happens if the
    // current balance is sufficient. This prevents the double-spend race
    // condition where two concurrent operations (e.g., two beginRound calls,
    // or beginRound + stake) both read the same balance and both succeed —
    // with the old read-modify-write, both would pass the `betAmount > curBal`
    // check and both would deduct, overdrawing the balance. With the atomic
    // conditional update, only one can win; the other gets `updated: 0` and
    // is rejected.
    let newBal = curBal;
    let newWager = curWager;
    if (!isFreeSpin && betAmount > 0) {
      const wagerDec = Math.min(betAmount, curWager);
      const dedRes = await base44.asServiceRole.entities.Wallet.updateMany(
        { user_id: user.id, balance: { $gte: betAmount } },
        { $inc: { balance: -betAmount, wager_remaining: -wagerDec } }
      );
      if (!dedRes || Number(dedRes.updated || 0) === 0) {
        // Either insufficient balance or banned — re-read to distinguish.
        const recheck = await findOrCreateWallet(base44, user.id);
        return Response.json({ error: 'insufficient-balance', balance: Number(recheck.balance ?? 0) }, { status: 400 });
      }
      // Compute the post-deduction balance from the pre-deduction read (the
      // atomic updateMany guaranteed it succeeded). Skips a redundant DB
      // re-read that added ~100ms to every spin.
      newBal = curBal - betAmount;
      newWager = Math.max(0, curWager - wagerDec);
    }

    // Decide the outcome entirely server-side.
    // rtp was already resolved above from the single GameSetting + Wallet read.
    let outcome;
    if (settleMode === 'cap') {
      // Cap mode: store a generous max-win cap. The actual win is the
      // client's (the game's real outcome), capped at this amount.
      const cap = isFreeSpin
        ? FREE_SPIN_MAX_WIN
        : Math.min(betAmount * MAX_WIN_MULT, FREE_SPIN_MAX_WIN);
      outcome = { isWin: true, winAmount: cap, multiplier: MAX_WIN_MULT };
    } else {
      outcome = decideOutcome(rtp, betAmount, isFreeSpin, gameId);
    }

    // Defense in depth: cap the stored win at the absolute maximum.
    outcome.winAmount = Math.min(outcome.winAmount, MAX_WIN_PER_ROUND);

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