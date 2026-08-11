import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Backend-backed, per-user casino balance.
// Source of truth = the user's `balance` field on the server (updated by
// admin approvals + persisted gameplay). A module-level singleton keeps every
// component in sync, survives refresh, and reflects admin-approved deposits
// after reload/focus — so the balance never randomly changes and is identical
// everywhere.
const CACHE_KEY = 'casino_balance_cache';

// Initialise synchronously from cache so the balance is available the instant a
// game mounts (no 0 flash, no false "insufficient balance" before me() resolves).
let balance = (() => { try { return parseFloat(localStorage.getItem(CACHE_KEY)) || 0; } catch { return 0; } })();
let committedBalance = balance;   // last backend-confirmed balance
let uncommittedDelta = 0;   // local gameplay delta not yet pushed to backend
// Wagering requirement: deposited funds that must be played through (bet in
// games) or stacked before they can be withdrawn. Decremented by game bets and
// stacking (any balance decrease counts as wagering); incremented when a
// deposit is credited. Tracked the same delta-commit way as balance so it
// persists to the user record and survives refresh.
let committedWager = 0;
let uncommittedWagerDelta = 0;
let wagerRemaining = 0;
let userId = null;
let loaded = false;
let loadingPromise = null;
let persistTimer = null;
let persisting = false;
let roundActive = false; // when true, setBalance is local-display-only (no backend commit). Gameplay settles atomically via settleBet().
let roundDisplayWin = 0; // accumulated display-only win added incrementally during cascades (adjusted at settle)
const listeners = new Set();
let pendingRoundToken = null;   // round_token from beginRound (server-side outcome)
let pendingServerWin = 0;       // server-decided win amount for the current round
const ROUND_TOKEN_KEY = 'casino_pending_round_token';

// Demo mode: a local-only balance used to try every game without touching the
// real wallet. Starts at $1000 each time demo is turned on; gameplay mutates it
// in memory (no backend persist). Turning demo off restores the real balance.
const DEMO_KEY = 'casino_demo_mode';
const DEMO_BAL_KEY = 'casino_demo_balance';
const DEMO_START = 1000;
let demoMode = (() => { try { return localStorage.getItem(DEMO_KEY) === '1'; } catch { return false; } })();
let demoBalance = (() => { try { const v = parseFloat(localStorage.getItem(DEMO_BAL_KEY)); return isFinite(v) && v > 0 ? v : DEMO_START; } catch { return DEMO_START; } })();
const setDemoCache = (v) => { try { localStorage.setItem(DEMO_BAL_KEY, String(v ?? 0)); } catch {} };

const notify = () => listeners.forEach((l) => l());
const setCache = (v) => { try { localStorage.setItem(CACHE_KEY, String(v ?? 0)); } catch {} };

function setDemoMode(on) {
  demoMode = !!on;
  try { localStorage.setItem(DEMO_KEY, demoMode ? '1' : '0'); } catch {}
  if (demoMode) { demoBalance = DEMO_START; setDemoCache(DEMO_START); }
  notify();
}

async function loadBalance() {
  try {
    const me = await base44.auth.me();
    userId = me?.id ?? null;
    // Read the authoritative balance from the secure Wallet entity via the
    // getWallet backend function (service role). The Wallet entity's RLS
    // blocks users from modifying it, so this balance can't be hacked.
    const res = await base44.functions.invoke('getWallet', {});
    const b = Number(res?.data?.balance ?? 0);
    committedBalance = isFinite(b) ? b : 0;
    // During an active round, the server balance already reflects the bet
    // deduction (beginRound deducted it atomically). The local uncommittedDelta
    // (-bet) is just a display mirror of that server-side deduction. Adding it
    // again here would double-count the bet — the balance briefly drops by 2×
    // the bet, then "increases" back when settleBet corrects it. During a round,
    // trust the server balance directly and clear the local deltas (settleBet
    // will set the authoritative balance at round end anyway).
    if (roundActive) {
      uncommittedDelta = 0;
      uncommittedWagerDelta = 0;
      balance = committedBalance;
      setCache(balance);
      const w = Number(res?.data?.wager_remaining ?? 0);
      committedWager = isFinite(w) ? w : 0;
      wagerRemaining = committedWager;
    } else {
      // No active round — the server balance is authoritative. Clear any
      // stale uncommittedDelta (e.g., from a failed beginRound refund) so it
      // can't inflate the displayed balance above the real server balance.
      uncommittedDelta = 0;
      uncommittedWagerDelta = 0;
      balance = committedBalance;
      setCache(balance);
      const w = Number(res?.data?.wager_remaining ?? 0);
      committedWager = isFinite(w) ? w : 0;
      wagerRemaining = committedWager;
    }
  } catch {
    // not logged in: fall back to cached value
    let s = 0;
    try { s = parseFloat(localStorage.getItem(CACHE_KEY)) || 0; } catch {}
    committedBalance = s;
    balance = s + uncommittedDelta;
    committedWager = 0;
    wagerRemaining = uncommittedWagerDelta;
    userId = null;
  }
  loaded = true;
  notify();
}

// Push the local gameplay delta to the backend. We re-read the latest server
// balance first (which may include an admin-approved deposit) and add our delta
// on top — so admin credits are never overwritten by gameplay.
async function flushPersist() {
  // During an active round, uncommittedDelta is just a display mirror of the
  // server-side bet deduction (beginRound already deducted it). Pushing it via
  // commitBalanceDelta would double-deduct on the server. Skip — settleBet
  // handles the authoritative balance at round end.
  if (!userId || persisting || roundActive || (uncommittedDelta === 0 && uncommittedWagerDelta === 0)) return;
  persisting = true;
  const d = uncommittedDelta;
  const wd = uncommittedWagerDelta;
  uncommittedDelta = 0;
  uncommittedWagerDelta = 0;
  const committedBefore = committedBalance;
  const wagerBefore = committedWager;
  // Positive deltas are rejected by commitBalanceDelta (anti-hack). Don't
  // try to push them — they'd be rejected (403) and the catch block would
  // restore them forever, inflating the displayed balance above the server.
  // Instead, reload the authoritative balance from the server.
  if (d > 0) {
    try {
      await loadBalance();
    } catch {
      uncommittedDelta += d;
      uncommittedWagerDelta += wd;
    }
    persisting = false;
    return;
  }
  try {
    // Push the delta through the secure commitBalanceDelta backend function
    // (service role). It re-reads the authoritative Wallet balance, applies
    // the delta, and rejects negative results — so gameplay can't overwrite
    // admin credits or drive the balance negative. The Wallet entity's RLS
    // blocks users from updating it directly.
    // wager_delta is no longer accepted by commitBalanceDelta (server ignores
    // it to prevent console hacks). Wager reductions happen server-side in
    // beginRound (gameplay) and stakeOperation (staking). We only send the
    // balance delta here; the server returns the authoritative wager_remaining.
    const res = await base44.functions.invoke('commitBalanceDelta', { delta: d, wager_delta: 0 });
    const newBackend = Number(res?.data?.balance ?? committedBefore);
    const newWager = Number(res?.data?.wager_remaining ?? wagerBefore);
    committedBalance = newBackend;
    committedWager = newWager;
    balance = newBackend + uncommittedDelta;
    wagerRemaining = newWager;
    setCache(balance);
    notify();
  } catch {
    // restore deltas to retry later
    uncommittedDelta += d;
    uncommittedWagerDelta += wd;
  }
  persisting = false;
}

function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(flushPersist, 250);
}

// Add a cascade win to the display balance DURING an active round — gives
// the user instant feedback as each cascade wins, instead of waiting for
// settleBet at chain end. The actual server credit happens via settleBet;
// the difference between the accumulated display win and the server's win
// is adjusted at settle time so the final balance is always authoritative.
function addRoundWin(amount) {
  const n = Number(amount);
  if (!isFinite(n) || n === 0) return;
  roundDisplayWin += n;
  if (demoMode) {
    demoBalance += n;
    setDemoCache(demoBalance);
  } else {
    balance += n;
    setCache(balance);
  }
  notify();
}

// Credit the REAL wallet directly — used by cashback, free-spin wins, and
// task/airdrop rewards. Routes through the secure creditBonus backend function
// (which caps the amount and logs a Transaction) instead of commitBalanceDelta
// (which now rejects positive deltas to prevent free-money hacks).
async function addRealBalance(amount, type = 'bonus', note = '', claimedLoss = 0) {
  const n = Number(amount);
  if (!isFinite(n) || n === 0) return;
  // Free-spin wins are REAL rewards — always credit the real wallet even in
  // demo mode, so the daily bonus isn't wasted on the practice balance.
  if (demoMode && type !== 'free_spin') {
    // In demo mode, credit the in-memory demo balance only.
    demoBalance += n;
    setDemoCache(demoBalance);
    notify();
    return;
  }
  // Optimistic local update for instant visual feedback.
  uncommittedDelta += n;
  balance = committedBalance + uncommittedDelta;
  setCache(balance);
  notify();
  // Push through the secure creditBonus backend function. For cashback
  // claims, pass type + claimed_loss so creditBonus atomically updates
  // Wallet.cashback_claimed_loss (preventing double-claims).
  try {
    const res = await base44.functions.invoke('creditBonus', { amount: n, type, note, claimed_loss: claimedLoss });
    const newBackend = Number(res?.data?.balance ?? 0);
    // Revert the optimistic +n — the server balance now includes the credit,
    // so keeping it in uncommittedDelta would double-count the bonus and make
    // the displayed balance higher than the real server balance (causing
    // "Insufficient balance" on withdrawal).
    uncommittedDelta -= n;
    committedBalance = newBackend;
    balance = newBackend + uncommittedDelta;
    setCache(balance);
    notify();
  } catch {
    // revert optimistic update on failure
    uncommittedDelta -= n;
    balance = committedBalance + uncommittedDelta;
    setCache(balance);
    notify();
  }
}

// Begin a game round: the server DEDUCTS THE BET IMMEDIATELY and pre-decides
// the outcome (win/loss + amount) based on RTP. This closes the "avoid loss by
// not settling" hack — the bet is gone the moment the round starts. The round
// is settled via settleBet() at the end, which credits the SERVER-DECIDED win
// (the client's win_amount is ignored or capped) — so users can't hack their
// balance by calling settleBet from the console.
//
// BALANCE FLOW (single deduction, real-casino style):
//   1. beginRound deducts the bet locally (instant visual feedback) AND on the
//      server (authoritative). After the server responds, committedBalance is
//      synced to the post-deduction balance.
//   2. setBalance is a NO-OP during a round (roundActive=true) — the game's
//      setBalance(b => b - bet) call is ignored because beginRound already
//      deducted. This prevents the double-deduction bug.
//   3. settleBet credits the server-decided win (total payout = multiplier ×
//      bet, which INCLUDES the bet). Final balance = preBet - bet + winAmount
//      = preBet + (multiplier - 1) × bet. This matches real slot games.
async function beginRound(bet, gameId, isFreeSpin = false, settleMode = 'fixed') {
  roundActive = true;
  roundDisplayWin = 0;
  // Instant visual feedback: deduct the bet locally right away. The server
  // will deduct it too, and we'll sync committedBalance to the post-deduction
  // balance when the server responds. This gives the user immediate feedback
  // that the bet was placed, without waiting for the server round-trip.
  if (!isFreeSpin && bet > 0) {
    if (demoMode) {
      demoBalance = Math.max(0, demoBalance - bet);
      setDemoCache(demoBalance);
    } else {
      balance = balance - bet;
      setCache(balance);
    }
    notify();
  }
  if (demoMode) {
    // Demo mode: decide locally (no backend call).
    // Plinko: use the server's exact bucket distribution (0.1x–100x) so the
    // ball lands on a real bucket with the correct frequency. The generic
    // fixed/cap branches below don't match Plinko's bucket model.
    if (gameId === 'plinko') {
      const BUCKETS = [0.1, 2, 5, 10, 25, 50, 100];
      const WEIGHTS = [65, 25, 5, 4, 0.8, 0.5, 0.1];
      const totalW = WEIGHTS.reduce((a, b) => a + b, 0);
      let r2 = Math.random() * totalW;
      let mult = BUCKETS[0];
      for (let i = 0; i < BUCKETS.length; i++) {
        r2 -= WEIGHTS[i];
        if (r2 <= 0) { mult = BUCKETS[i]; break; }
      }
      pendingServerWin = mult * (bet || 0.10);
      return { is_win: mult > 1, win_amount: pendingServerWin, round_token: null };
    }
    // Cap-mode games (HiLo, Mines, Crash, Thimbles): return a generous CAP so
    // the client-side game logic can decide wins/losses freely. Returning 0
    // here would force withinCap=false and make every guess a guaranteed loss.
    if (settleMode === 'cap') {
      pendingServerWin = Math.min((bet || 0.10) * 5000, 5000);
      return { is_win: true, win_amount: pendingServerWin, round_token: null };
    }
    // Fixed-mode games: decide win/loss locally with ~30% win chance.
    const isWin = Math.random() < 0.3;
    pendingServerWin = isWin ? (1 + Math.random() * 5) * (bet || 0.10) : 0;
    return { is_win: isWin, win_amount: pendingServerWin, round_token: null };
  }
  if (!bet || !gameId) {
    // Legacy call (no args) — no server round, just set roundActive.
    return { is_win: null, win_amount: null, round_token: null };
  }
  try {
    const res = await base44.functions.invoke('beginRound', {
      bet_amount: bet, game_id: gameId, is_free_spin: isFreeSpin, settle_mode: settleMode,
    });
    const data = res?.data || {};
    pendingRoundToken = data.round_token || null;
    pendingServerWin = Number(data.win_amount ?? 0);
    // Sync committedBalance to the post-deduction server balance. The server
    // already deducted the bet, and we deducted it locally at the top of this
    // function. Now we sync so committedBalance matches the server and
    // uncommittedDelta is cleared — the balance is authoritative.
    const newBal = Number(data.balance ?? 0);
    committedBalance = newBal;
    uncommittedDelta = 0;
    uncommittedWagerDelta = 0;
    balance = newBal;
    setCache(balance);
    notify();
    try { if (pendingRoundToken) localStorage.setItem(ROUND_TOKEN_KEY, pendingRoundToken); } catch {}
    return { is_win: !!data.is_win, win_amount: pendingServerWin, round_token: pendingRoundToken };
  } catch {
    // beginRound failed — the server did NOT deduct the bet. Revert the local
    // deduction we made at the top of beginRound and reset roundActive so the
    // game's refund setBalance(b => b + bet) is handled correctly.
    if (!isFreeSpin && bet > 0) {
      balance = balance + bet;
      setCache(balance);
      notify();
    }
    roundActive = false;
    return { is_win: null, win_amount: null, round_token: null, failed: true };
  }
}

// Settle a game round on the server. The bet was already deducted at
// beginRound time; settleBet only credits the server-decided win (round-token
// path) or a server-generated win (fallback path). Replaces the local balance
// with the server's authoritative response. The optional roundTokenOverride
// is used by CrashGame to settle a specific panel's round independently.
async function settleBet(betAmount, winAmount, gameId, isFreeSpin = false, preserveDelta = 0, roundTokenOverride = null) {
  if (demoMode) {
    // In demo mode, settle locally only (no backend commit). The bet was
    // already deducted by beginRound from demoBalance, so just credit the
    // total win amount (which includes the bet, real-casino style). Net
    // result: demoBalance += (winAmount - bet) = profit/loss.
    // Subtract roundDisplayWin (already added incrementally during cascades)
    // so the win isn't double-counted.
    demoBalance = Math.max(0, demoBalance + winAmount - roundDisplayWin);
    roundDisplayWin = 0;
    setDemoCache(demoBalance);
    roundActive = false;
    notify();
    return;
  }
  roundActive = false;
  try {
    // Clear any stale local deltas — settleBet will give us the authoritative
    // balance from the server.
    uncommittedDelta = 0;
    uncommittedWagerDelta = 0;
    // Optimistic: show the server-decided win IMMEDIATELY in the local balance
    // (before the server confirms). pendingServerWin holds the server's pre-
    // decided win from beginRound — the server will credit this exact amount,
    // so the optimistic display matches the final balance. For cap-mode games
    // (Mines, HiLo) where the client's win may be below the cap, use the
    // smaller of the two so we never over-show. balance is currently
    // committedBalance (post-deduction, synced by beginRound); adding the win
    // gives the correct post-round display instantly.
    const optimisticWin = pendingServerWin > 0 ? Math.min(winAmount, pendingServerWin) : 0;
    // Adjust for incremental display updates during cascades: we already
    // added roundDisplayWin to the display balance. Now adjust by the
    // difference so the final balance = committedBalance + optimisticWin.
    const adjust = optimisticWin - roundDisplayWin;
    roundDisplayWin = 0;
    if (adjust !== 0) {
      balance += adjust;
      setCache(balance);
      notify();
    }
    // Send the round_token so the server credits the pre-decided win (from
    // beginRound). The client's win_amount is IGNORED by the server — it
    // uses the stored server-side decision. If no round_token (legacy call),
    // the server generates the win itself (also server-side).
    const res = await base44.functions.invoke('settleBet', {
      round_token: roundTokenOverride || pendingRoundToken,
      bet_amount: betAmount,
      win_amount: winAmount,
      game_id: gameId,
      is_free_spin: isFreeSpin,
    });
    if (!roundTokenOverride) {
      pendingRoundToken = null;
      pendingServerWin = 0;
      try { localStorage.removeItem(ROUND_TOKEN_KEY); } catch {}
    }
    const newBackend = Number(res?.data?.balance ?? 0);
    const newWager = Number(res?.data?.wager_remaining ?? 0);
    committedBalance = newBackend;
    committedWager = newWager;
    // Re-apply preserved delta from other active rounds (e.g., CrashGame's
    // second bet panel still in play when the first panel settles).
    // IMPORTANT: ADD preserveDelta to the CURRENT uncommittedDelta, don't
    // overwrite it. If a new round started during the server call (auto-spin
    // or free-spin chain), its setBalance(b => b - bet) already set
    // uncommittedDelta = -newBet. Overwriting with preserveDelta (0) would
    // lose the new bet deduction — the balance would jump back UP, making
    // it look like the bet was never placed.
    uncommittedDelta += preserveDelta;
    balance = newBackend + uncommittedDelta;
    wagerRemaining = newWager;
    setCache(balance);
    notify();
  } catch (e) {
    // If settlement fails, reload the authoritative balance from the server.
    await loadBalance();
  }
}

export function useCasinoBalance() {
  const [, force] = useState(0);
  useEffect(() => {
    let mounted = true;
    const l = () => { if (mounted) force((x) => x + 1); };
    listeners.add(l);
    if (!loaded && !loadingPromise) {
      loadingPromise = loadBalance().then(async () => {
        // Recover any interrupted round: settle it with the server to credit
        // the pre-decided win (from beginRound). The client's win is ignored
        // — the server uses the stored PendingRound outcome.
        try {
          const storedToken = localStorage.getItem(ROUND_TOKEN_KEY);
          if (storedToken) {
            localStorage.removeItem(ROUND_TOKEN_KEY);
            pendingRoundToken = storedToken;
            await settleBet(0, 0, 'recovery', false);
          }
        } catch { /* best-effort */ }
      }).finally(() => { loadingPromise = null; });
    } else {
      l();
    }
    // pick up admin-approved deposits when the user returns to the tab.
    // SKIP during an active round — loadBalance reads the server balance
    // which may not yet reflect the beginRound bet deduction (the server call
    // is still in flight). If we sync mid-round, committedBalance gets the
    // pre-deduction balance, uncommittedDelta is cleared, and the local
    // display jumps back UP to the original balance — making it look like
    // the bet was never placed. settleBet sets the authoritative balance
    // at round end, so skipping here is safe.
    const onFocus = () => { if (mounted && !roundActive) loadBalance(); };
    const onHide = () => { if (!roundActive) flushPersist(); };
    window.addEventListener('focus', onFocus);
    window.addEventListener('pagehide', onHide);
    return () => {
      listeners.delete(l);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pagehide', onHide);
      mounted = false;
    };
  }, []);

  const setBalance = useCallback((updater) => {
    // In demo mode, mutate the in-memory demo balance only — never touch the
    // real wallet or push to the backend. During an active round, setBalance
    // is a NO-OP (beginRound already deducted the bet from demoBalance).
    if (demoMode) {
      if (roundActive) return;
      const prev = demoBalance;
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const v = isFinite(next) ? Number(next) : 0;
      demoBalance = v;
      setDemoCache(v);
      notify();
      return;
    }
    // During an active round, setBalance is a NO-OP. beginRound already
    // deducted the bet locally and on the server. The game's setBalance(b =>
    // b - bet) call is ignored to prevent double-deduction. settleBet credits
    // the win at round end and syncs the authoritative balance.
    if (roundActive) return;
    const prev = balance;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    const v = isFinite(next) ? Number(next) : 0;
    // Any balance decrease is a wager (game bet or stacking) — reduce the
    // remaining play-through requirement accordingly (win or lose, the bet
    // volume counts). Free spins don't decrease the balance, so they don't
    // count, which is the intended behavior.
    if (v < prev) {
      const dec = Math.min(prev - v, wagerRemaining);
      if (dec > 0) {
        uncommittedWagerDelta -= dec;
        wagerRemaining = committedWager + uncommittedWagerDelta;
      }
    }
    uncommittedDelta += v - prev;
    balance = v;
    setCache(v);
    notify();
    schedulePersist();
  }, []);

  const reset = useCallback(() => setBalance(0), [setBalance]);
  const toggleDemo = useCallback((on) => setDemoMode(on), []);

  const wRemaining = demoMode ? 0 : wagerRemaining;
  const maxWithdrawable = demoMode ? 0 : Math.max(0, balance - wagerRemaining);

  return {
    balance: demoMode ? demoBalance : balance,
    setBalance,
    addRealBalance,
    addRoundWin,
    beginRound,
    settleBet,
    reset,
    demoMode,
    setDemoMode: toggleDemo,
    wagerRemaining: wRemaining,
    maxWithdrawable,
  };
}

export async function reloadBalance() { await loadBalance(); }

// Returns the current authoritative balance (module-level, always fresh after
// reloadBalance/loadBalance). Use this when you need the balance AFTER an
// await reloadBalance() — the React hook's closure still holds the pre-await
// value, so reading acct.balance would be stale.
export function getBalance() {
  return demoMode ? demoBalance : balance;
}
export function getMaxWithdrawable() {
  return demoMode ? 0 : Math.max(0, balance - wagerRemaining);
}

// Mark a freshly-credited deposit as needing play-through before withdrawal.
// Called by the wallet deposit flows when a deposit is confirmed & credited.
export function addWagerRequirement(amount) {
  if (demoMode) return;
  const n = Number(amount);
  if (!n || n <= 0) return;
  uncommittedWagerDelta += n;
  wagerRemaining = committedWager + uncommittedWagerDelta;
  notify();
  schedulePersist();
}