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
    balance = committedBalance + uncommittedDelta;
    setCache(balance);
    const w = Number(res?.data?.wager_remaining ?? 0);
    committedWager = isFinite(w) ? w : 0;
    wagerRemaining = committedWager + uncommittedWagerDelta;
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
  if (!userId || persisting || (uncommittedDelta === 0 && uncommittedWagerDelta === 0)) return;
  persisting = true;
  const d = uncommittedDelta;
  const wd = uncommittedWagerDelta;
  uncommittedDelta = 0;
  uncommittedWagerDelta = 0;
  const committedBefore = committedBalance;
  const wagerBefore = committedWager;
  try {
    // Push the delta through the secure commitBalanceDelta backend function
    // (service role). It re-reads the authoritative Wallet balance, applies
    // the delta, and rejects negative results — so gameplay can't overwrite
    // admin credits or drive the balance negative. The Wallet entity's RLS
    // blocks users from updating it directly.
    const res = await base44.functions.invoke('commitBalanceDelta', { delta: d, wager_delta: wd });
    const newBackend = Number(res?.data?.balance ?? committedBefore);
    const newWager = Number(res?.data?.wager_remaining ?? wagerBefore);
    committedBalance = newBackend;
    committedWager = newWager;
    balance = newBackend + uncommittedDelta;
    wagerRemaining = newWager + uncommittedWagerDelta;
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

// Credit the REAL wallet directly — used by cashback, free-spin wins, and
// task/airdrop rewards. Routes through the secure creditBonus backend function
// (which caps the amount and logs a Transaction) instead of commitBalanceDelta
// (which now rejects positive deltas to prevent free-money hacks).
async function addRealBalance(amount, type = 'bonus', note = '', claimedLoss = 0) {
  const n = Number(amount);
  if (!isFinite(n) || n === 0) return;
  if (demoMode) {
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
async function beginRound(bet, gameId, isFreeSpin = false, settleMode = 'fixed') {
  roundActive = true;
  if (demoMode) {
    // Demo mode: decide locally (no backend call).
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
    // NOTE: do NOT sync committedBalance here. The game's setBalance call
    // already reduces the local display by the bet (uncommittedDelta = -bet),
    // and committedBalance still holds the pre-deduction server balance — so
    // balance = committedBalance + (-bet) = correct. Syncing here would
    // double-deduct. settleBet syncs the authoritative balance at the end.
    try { if (pendingRoundToken) localStorage.setItem(ROUND_TOKEN_KEY, pendingRoundToken); } catch {}
    return { is_win: !!data.is_win, win_amount: pendingServerWin, round_token: pendingRoundToken };
  } catch {
    // If beginRound fails, settleBet will use the fallback path (which also
    // decides the win server-side). Continue without a server round.
    return { is_win: null, win_amount: null, round_token: null };
  }
}

// Settle a game round on the server. The bet was already deducted at
// beginRound time; settleBet only credits the server-decided win (round-token
// path) or a server-generated win (fallback path). Replaces the local balance
// with the server's authoritative response. The optional roundTokenOverride
// is used by CrashGame to settle a specific panel's round independently.
async function settleBet(betAmount, winAmount, gameId, isFreeSpin = false, preserveDelta = 0, roundTokenOverride = null) {
  if (demoMode) {
    // In demo mode, settle locally only (no backend commit).
    const net = isFreeSpin ? winAmount : (winAmount - betAmount);
    demoBalance = Math.max(0, demoBalance + net);
    setDemoCache(demoBalance);
    roundActive = false;
    notify();
    return;
  }
  roundActive = false;
  // Optimistic local update: the setBalance calls during the round already
  // adjusted the local display. Now flush any remaining non-round deltas and
  // sync with the server's authoritative balance.
  try {
    // Flush any pending non-round deltas first (e.g., wager changes).
    if (uncommittedDelta !== 0 || uncommittedWagerDelta !== 0) {
      // Clear local deltas — settleBet will give us the authoritative balance.
      uncommittedDelta = 0;
      uncommittedWagerDelta = 0;
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
    uncommittedDelta = preserveDelta;
    balance = newBackend + preserveDelta;
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
    // pick up admin-approved deposits when the user returns to the tab
    const onFocus = () => { if (mounted) loadBalance(); };
    const onHide = () => { flushPersist(); };
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
    // real wallet or push to the backend.
    if (demoMode) {
      const prev = demoBalance;
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const v = isFinite(next) ? Number(next) : 0;
      demoBalance = v;
      setDemoCache(v);
      notify();
      return;
    }
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
    // During a game round, setBalance is local-display-only — the round is
    // settled atomically via settleBet() at the end (server-verified).
    if (!roundActive) schedulePersist();
  }, []);

  const reset = useCallback(() => setBalance(0), [setBalance]);
  const toggleDemo = useCallback((on) => setDemoMode(on), []);

  const wRemaining = demoMode ? 0 : wagerRemaining;
  const maxWithdrawable = demoMode ? 0 : Math.max(0, balance - wagerRemaining);

  return {
    balance: demoMode ? demoBalance : balance,
    setBalance,
    addRealBalance,
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