import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

// Pending round recovery.
//
// When a player starts a spin, the bet is deducted immediately and persisted to
// the backend (useCasinoBalance), but the win is only credited later via a
// setTimeout after the reel/tumble animation finishes. If the player leaves the
// game mid-spin, that timer is cancelled on unmount and the win is never paid —
// the player silently loses the bet.
//
// To fix this, each spin-based game saves the *already-determined* round outcome
// the instant the spin starts (the RNG runs upfront). If the game later mounts
// and finds an unsettled round, the stored win is credited to the balance (the
// bet was already deducted, so this makes the player whole). A normally
// completed spin clears its pending record at settle time, so recovery never
// double-pays.
//
// Crash/Aviator is excluded by design — its round is server-driven and live.

const KEY = 'casino_pending_rounds';
const MAX_AGE = 1000 * 60 * 60 * 24; // 24h — stale records are dropped

function readAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
function writeAll(obj) {
  try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch {}
}

export function savePendingRound(gameId, payload) {
  const all = readAll();
  all[gameId] = { ...payload, ts: Date.now() };
  writeAll(all);
}

export function clearPendingRound(gameId) {
  const all = readAll();
  if (all[gameId]) { delete all[gameId]; writeAll(all); }
}

export function getPendingRound(gameId) {
  const all = readAll();
  const r = all[gameId];
  if (!r) return null;
  if (Date.now() - (r.ts || 0) > MAX_AGE) { clearPendingRound(gameId); return null; }
  return r;
}

// On mount, if an interrupted round's outcome was persisted, credit its win to
// the balance and notify the player. Runs once per mount.
export function usePendingRoundRecovery(gameId, setBalance) {
  const { toast } = useToast();
  useEffect(() => {
    const r = getPendingRound(gameId);
    if (!r) return;
    clearPendingRound(gameId);
    const win = Number(r.win) || 0;
    if (win > 0) {
      setBalance((b) => b + win);
      toast({
        title: 'Round restored',
        description: `Your previous spin won $${win.toFixed(2)} — credited to your balance.`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);
}