import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance, reloadBalance } from '@/lib/useCasinoBalance';
import { getRateForDeposits, getVipLevel, BASE_RATE } from '@/lib/vipLevels';

// Stack Balance: lock part of your balance to earn daily profit.
// The rate scales with the player's VIP level (based on total deposits).
// The staked amount is locked for 15 days (cannot be used or withdrawn).
// After 15 days it auto-unlocks and returns to your balance. Profit can be
// claimed any time. All stack state is persisted on the user's record.
const DAY = 24 * 60 * 60 * 1000;
export const LOCK_DAYS = 15;
export { BASE_RATE as DAILY_RATE };

// Profit accrues continuously per second at the given rate per 24h.
// Total earning window is capped at LOCK_DAYS; after that it stops growing.
export function computeProfit(staked, stakedAt, lastClaim, rate = BASE_RATE) {
  if (!staked || !stakedAt) return 0;
  const start = new Date(stakedAt).getTime();
  if (isNaN(start)) return 0;
  const lc = lastClaim ? new Date(lastClaim).getTime() : start;
  const capMs = LOCK_DAYS * DAY;
  const elapsedMs = Math.min(Math.max(0, Date.now() - start), capMs);
  const claimedMs = Math.min(Math.max(0, lc - start), capMs);
  const pendingMs = Math.max(0, elapsedMs - claimedMs);
  const profit = staked * rate * (pendingMs / DAY);
  return Math.floor(profit * 100) / 100;
}

export function useStake() {
  const { balance, demoMode } = useCasinoBalance();
  const [staked, setStaked] = useState(0);
  const [stakedAt, setStakedAt] = useState(null);
  const [lastClaim, setLastClaim] = useState(null);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [loaded, setLoaded] = useState(false);
  // Re-render every second so the live, per-second profit ticks visibly.
  const [, setTick] = useState(0);
  const autoUnlockRef = useRef(null);
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      // Auto-unlock the staked balance the moment the 15-day lock ends.
      autoUnlockRef.current?.();
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const rate = getRateForDeposits(totalDeposits);
  const vipLevel = getVipLevel(totalDeposits);

  const load = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      // Fetch total approved/completed deposits first to determine the VIP rate.
      let td = 0;
      try {
        const txs = await base44.entities.Transaction.filter({ user_id: me.id, type: 'deposit' }, '-created_date', 500);
        td = txs
          .filter(t => t.status === 'approved' || t.status === 'completed')
          .reduce((s, t) => s + (Number(t.amount) || 0), 0);
        setTotalDeposits(td);
      } catch { /* ignore */ }

      // Read staking fields from the secure Wallet entity via getWallet —
      // the Wallet RLS blocks users from modifying these directly.
      const res = await base44.functions.invoke('getWallet', {});
      let sa = Number(res?.data?.staked_amount ?? 0) || 0;
      let sat = res?.data?.staked_at ?? null;
      let lc = res?.data?.last_profit_claim ?? null;

      // Auto-unlock after the lock period: return staked + remaining profit.
      // Routed through the secure stakeOperation backend function so the
      // balance credit + staking reset happen atomically server-side.
      if (sa > 0 && sat) {
        const elapsed = (Date.now() - new Date(sat).getTime()) / DAY;
        if (elapsed >= LOCK_DAYS) {
          try {
            const unlockRes = await base44.functions.invoke('stakeOperation', { action: 'autoUnlock' });
            if (unlockRes?.data) {
              sa = Number(unlockRes.data.staked_amount ?? 0) || 0;
              sat = unlockRes.data.staked_at ?? null;
              lc = unlockRes.data.last_profit_claim ?? null;
              await reloadBalance();
            }
          } catch { /* still locked or nothing staked — ignore */ }
        }
      }
      setStaked(sa);
      setStakedAt(sat);
      setLastClaim(lc);
    } catch {
      // not logged in
    }
    setLoaded(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  // lock more balance into the stack (restarts the 15-day timer on the total)
  const stake = useCallback(async (amount) => {
    // Demo balance cannot be stacked — stacking is a real-wallet action that
    // locks funds for 15 days and earns real profit.
    if (demoMode) return false;
    const n = Number(amount);
    if (!n || n <= 0 || n > balance) return false;
    try {
      // Route through the secure stakeOperation backend function — the Wallet
      // RLS blocks users from updating staked_amount directly, so this is the
      // only way to lock funds. Balance decrease + staking reset are atomic.
      const res = await base44.functions.invoke('stakeOperation', { action: 'stake', amount: n });
      if (res?.data) {
        setStaked(Number(res.data.staked_amount ?? 0) || 0);
        setStakedAt(res.data.staked_at ?? null);
        setLastClaim(res.data.last_profit_claim ?? null);
        await reloadBalance();
      }
      return true;
    } catch {
      return false;
    }
  }, [balance, demoMode]);

  // claim accrued profit into the playable balance
  const claimProfit = useCallback(async () => {
    const p = computeProfit(staked, stakedAt, lastClaim, rate);
    if (p <= 0) return 0;
    try {
      // Route through the secure stakeOperation backend function — profit is
      // computed server-side from the VIP rate so a client can't fake it. The
      // balance credit + last_profit_claim update are atomic.
      const res = await base44.functions.invoke('stakeOperation', { action: 'claimProfit' });
      if (res?.data) {
        setLastClaim(res.data.last_profit_claim ?? null);
        await reloadBalance();
      }
      return Number(res?.data?.credited ?? p) || p;
    } catch {
      return 0;
    }
  }, [staked, stakedAt, lastClaim, rate]);

  // Auto-unlock once the 15 days have passed: staked + remaining profit
  // return to the playable balance so the user can withdraw or re-stack.
  const autoUnlock = useCallback(async () => {
    if (!staked || !stakedAt) return;
    const elapsed = (Date.now() - new Date(stakedAt).getTime()) / DAY;
    if (elapsed < LOCK_DAYS) return;
    try {
      // Route through the secure stakeOperation backend function — staked +
      // profit return to balance atomically server-side, staking fields reset.
      const res = await base44.functions.invoke('stakeOperation', { action: 'autoUnlock' });
      if (res?.data) {
        setStaked(Number(res.data.staked_amount ?? 0) || 0);
        setStakedAt(res.data.staked_at ?? null);
        setLastClaim(res.data.last_profit_claim ?? null);
        await reloadBalance();
      }
    } catch { /* still locked or nothing staked — ignore */ }
  }, [staked, stakedAt, lastClaim, rate]);
  autoUnlockRef.current = autoUnlock;

  const elapsedDays = stakedAt ? (Date.now() - new Date(stakedAt).getTime()) / DAY : 0;
  const daysLocked = Math.floor(elapsedDays);
  const daysRemaining = Math.max(0, LOCK_DAYS - daysLocked);
  const pendingProfit = computeProfit(staked, stakedAt, lastClaim, rate);
  const unlocked = staked > 0 && daysRemaining === 0;

  return {
    balance, staked, pendingProfit, daysLocked, daysRemaining,
    unlocked, loaded, stake, claimProfit,
    rate, vipLevel, totalDeposits,
  };
}