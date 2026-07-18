import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';

// Stack Balance: lock part of your balance to earn 3% daily profit.
// The staked amount is locked for 15 days (cannot be used or withdrawn).
// After 15 days it auto-unlocks and returns to your balance. Profit can be
// claimed any time. All stack state is persisted on the user's record.
const DAY = 24 * 60 * 60 * 1000;
export const LOCK_DAYS = 15;
export const DAILY_RATE = 0.03;

// Profit accrues continuously per second at DAILY_RATE per 24h.
// Total earning window is capped at LOCK_DAYS; after that it stops growing.
export function computeProfit(staked, stakedAt, lastClaim) {
  if (!staked || !stakedAt) return 0;
  const start = new Date(stakedAt).getTime();
  if (isNaN(start)) return 0;
  const lc = lastClaim ? new Date(lastClaim).getTime() : start;
  const capMs = LOCK_DAYS * DAY;
  const elapsedMs = Math.min(Math.max(0, Date.now() - start), capMs);
  const claimedMs = Math.min(Math.max(0, lc - start), capMs);
  const pendingMs = Math.max(0, elapsedMs - claimedMs);
  const profit = staked * DAILY_RATE * (pendingMs / DAY);
  return Math.floor(profit * 100) / 100;
}

export function useStake() {
  const { balance, setBalance } = useCasinoBalance();
  const [staked, setStaked] = useState(0);
  const [stakedAt, setStakedAt] = useState(null);
  const [lastClaim, setLastClaim] = useState(null);
  const [loaded, setLoaded] = useState(false);
  // Re-render every second so the live, per-second profit ticks visibly.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      let sa = Number(me?.staked_amount ?? 0) || 0;
      let sat = me?.staked_at ?? null;
      let lc = me?.last_profit_claim ?? null;
      // auto-unlock after the lock period: return staked + remaining profit
      if (sa > 0 && sat) {
        const elapsed = (Date.now() - new Date(sat).getTime()) / DAY;
        if (elapsed >= LOCK_DAYS) {
          const profit = computeProfit(sa, sat, lc);
          setBalance((b) => b + sa + profit);
          await base44.auth.updateMe({ staked_amount: 0, staked_at: null, last_profit_claim: null });
          sa = 0; sat = null; lc = null;
        }
      }
      setStaked(sa);
      setStakedAt(sat);
      setLastClaim(lc);
    } catch {
      // not logged in
    }
    setLoaded(true);
  }, [setBalance]);

  useEffect(() => { load(); }, [load]);

  // lock more balance into the stack (restarts the 15-day timer on the total)
  const stake = useCallback(async (amount) => {
    const n = Number(amount);
    if (!n || n <= 0 || n > balance) return false;
    setBalance((b) => b - n);
    const now = new Date().toISOString();
    const newStaked = staked + n;
    setStaked(newStaked);
    setStakedAt(now);
    setLastClaim(now);
    try {
      await base44.auth.updateMe({ staked_amount: newStaked, staked_at: now, last_profit_claim: now });
    } catch { /* persisted on next retry */ }
    return true;
  }, [balance, staked, setBalance]);

  // claim accrued profit into the playable balance
  const claimProfit = useCallback(async () => {
    const p = computeProfit(staked, stakedAt, lastClaim);
    if (p <= 0) return 0;
    setBalance((b) => b + p);
    const now = new Date().toISOString();
    setLastClaim(now);
    try {
      await base44.auth.updateMe({ last_profit_claim: now });
    } catch { /* persisted on next retry */ }
    return p;
  }, [staked, stakedAt, lastClaim, setBalance]);

  // manual unlock once the 15 days have passed
  const unlockNow = useCallback(async () => {
    if (!staked || !stakedAt) return false;
    const elapsed = (Date.now() - new Date(stakedAt).getTime()) / DAY;
    if (elapsed < LOCK_DAYS) return false;
    const p = computeProfit(staked, stakedAt, lastClaim);
    setBalance((b) => b + staked + p);
    setStaked(0); setStakedAt(null); setLastClaim(null);
    try {
      await base44.auth.updateMe({ staked_amount: 0, staked_at: null, last_profit_claim: null });
    } catch { /* persisted on next retry */ }
    return true;
  }, [staked, stakedAt, lastClaim, setBalance]);

  const elapsedDays = stakedAt ? (Date.now() - new Date(stakedAt).getTime()) / DAY : 0;
  const daysLocked = Math.floor(elapsedDays);
  const daysRemaining = Math.max(0, LOCK_DAYS - daysLocked);
  const pendingProfit = computeProfit(staked, stakedAt, lastClaim);
  const unlocked = staked > 0 && daysRemaining === 0;

  return {
    balance, staked, pendingProfit, daysLocked, daysRemaining,
    unlocked, loaded, stake, claimProfit, unlockNow,
  };
}