import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

// Pending round / state recovery.
//
// When a player starts a spin, the bet is deducted immediately and persisted to
// the backend (useCasinoBalance), but the win is only credited later via a
// setTimeout after the reel/tumble animation finishes. If the player leaves the
// game mid-spin (refresh, close, navigate away), that timer is cancelled on
// unmount and the win is never paid — the player silently loses the bet.
//
// To fix this, each spin-based game saves a snapshot the instant the spin
// starts: the already-determined win plus any in-progress round state (free
// spins remaining, running multiplier, etc.). On the next mount, the snapshot
// is replayed — the win is credited and, if the player was inside a multi-spin
// round (free spins / bonus), that round is restored so they continue from
// exactly where they left off. A normally completed spin clears its pending
// record at settle time, so recovery never double-pays.
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

// Save a round snapshot. `payload` should include at least { win, bet } and may
// include any extra `state` field needed to resume the round (freeSpins, etc.).
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

// On mount, if an interrupted round's snapshot was persisted, replay it:
// 1. credit the pending win to the balance
// 2. hand the saved `state` (if any) to onRestoreState so the game can resume
//    its in-progress round (free spins, bonus, etc.)
// `setBalance` is required; `onRestoreState` is optional.
export function usePendingRoundRecovery(gameId, setBalance, onRestoreState) {
  const { toast } = useToast();
  useEffect(() => {
    const r = getPendingRound(gameId);
    if (!r) return;
    clearPendingRound(gameId);
    // When resuming an in-progress free-spins round, re-save a "round-only"
    // snapshot (win already credited) so a second refresh during the 750ms
    // gap before the auto-spin fires still recovers the remaining spins. The
    // resumed spin's own savePendingRound overwrites this once it starts.
    const resumingRound = !!(r.state && r.state.freeSpinsActive && r.state.freeSpins > 0);
    if (resumingRound) {
      savePendingRound(gameId, { win: 0, bet: r.bet || 0, state: r.state });
    }
    const win = Number(r.win) || 0;
    const hasState = !!(r.state && r.state.freeSpinsActive && r.state.freeSpins > 0);
    // Win credit is handled by useCasinoBalance's pending-round recovery
    // (settleBet with the stored round_token) — not here, to avoid
    // double-crediting. We only restore the visual state below.
    if (onRestoreState && r.state) {
      onRestoreState(r.state);
    }
    // Always confirm to the player that the interrupted round was recovered —
    // crediting the win and/or resuming an in-progress free-spins round.
    if (hasState) {
      toast({
        title: 'Round resumed',
        description: `Restored your free spins round — ${r.state.freeSpins} spin(s) left${win > 0 ? ` · $${win.toFixed(2)} credited` : ''}.`,
      });
    } else if (win > 0) {
      toast({
        title: 'Round restored',
        description: `Your previous spin won $${win.toFixed(2)} — credited to your balance.`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);
}