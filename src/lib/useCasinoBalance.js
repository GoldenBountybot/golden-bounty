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
let userId = null;
let loaded = false;
let loadingPromise = null;
let persistTimer = null;
let persisting = false;
const listeners = new Set();

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
    const b = Number(me?.balance ?? 0);
    committedBalance = isFinite(b) ? b : 0;
    balance = committedBalance + uncommittedDelta;
    setCache(balance);
  } catch {
    // not logged in: fall back to cached value
    let s = 0;
    try { s = parseFloat(localStorage.getItem(CACHE_KEY)) || 0; } catch {}
    committedBalance = s;
    balance = s + uncommittedDelta;
    userId = null;
  }
  loaded = true;
  notify();
}

// Push the local gameplay delta to the backend. We re-read the latest server
// balance first (which may include an admin-approved deposit) and add our delta
// on top — so admin credits are never overwritten by gameplay.
async function flushPersist() {
  if (!userId || persisting || uncommittedDelta === 0) return;
  persisting = true;
  const d = uncommittedDelta;
  uncommittedDelta = 0;
  const committedBefore = committedBalance;
  try {
    const me = await base44.auth.me();
    const B = Number(me?.balance ?? committedBefore);
    const newBackend = B + d;
    await base44.auth.updateMe({ balance: newBackend });
    committedBalance = newBackend;
    balance = newBackend + uncommittedDelta;
    setCache(balance);
    notify();
  } catch {
    // restore delta to retry later
    uncommittedDelta += d;
  }
  persisting = false;
}

function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(flushPersist, 250);
}

export function useCasinoBalance() {
  const [, force] = useState(0);
  useEffect(() => {
    let mounted = true;
    const l = () => { if (mounted) force((x) => x + 1); };
    listeners.add(l);
    if (!loaded && !loadingPromise) {
      loadingPromise = loadBalance().finally(() => { loadingPromise = null; });
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
    uncommittedDelta += v - prev;
    balance = v;
    setCache(v);
    notify();
    schedulePersist();
  }, []);

  const reset = useCallback(() => setBalance(0), [setBalance]);
  const toggleDemo = useCallback((on) => setDemoMode(on), []);

  return { balance: demoMode ? demoBalance : balance, setBalance, reset, demoMode, setDemoMode: toggleDemo };
}

export async function reloadBalance() { await loadBalance(); }