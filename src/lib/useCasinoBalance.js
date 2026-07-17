import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Backend-backed, per-user casino balance.
// Source of truth = the user's `balance` field on the server (updated by
// admin approvals + persisted gameplay). A module-level singleton keeps every
// component in sync, survives refresh, and reflects admin-approved deposits
// after reload/focus — so the balance never randomly changes and is identical
// everywhere.
const CACHE_KEY = 'casino_balance_cache';

let balance = 0;
let committedBalance = 0;   // last backend-confirmed balance
let uncommittedDelta = 0;   // local gameplay delta not yet pushed to backend
let userId = null;
let loaded = false;
let loadingPromise = null;
let persistTimer = null;
let persisting = false;
const listeners = new Set();

const notify = () => listeners.forEach((l) => l());
const setCache = (v) => { try { localStorage.setItem(CACHE_KEY, String(v ?? 0)); } catch {} };

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

  return { balance, setBalance, reset };
}

export async function reloadBalance() { await loadBalance(); }