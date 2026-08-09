import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { pushNotification } from '@/lib/notify';

// Casino account: balance (shared, backend-backed) + admin-configured bonuses.
// Deposit now creates a pending request — the balance is only added after an
// admin approves it. Bonus claim state is stored PER USER.
const DEFAULTS = {
  signup: { amount: 500, active: true },
  daily: { amount: 100, active: true },
  weekly: { amount: 300, active: true },
  monthly: { amount: 1000, active: true },
  deposit: { amount: 0, deposit_percent: 50, active: true },
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const monthStr = () => new Date().toISOString().slice(0, 7);
const weekStr = () => {
  const d = new Date();
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

const defaultClaim = {
  signupClaimed: false,
  dailyLast: null,
  weeklyLast: null,
  monthlyLast: null,
  depositAvailable: false,
  depositAmount: 0,
};

export function useCasinoAccount() {
  const { balance, setBalance, addRealBalance, demoMode, wagerRemaining, maxWithdrawable } = useCasinoBalance();
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [settings, setSettings] = useState([]);
  const [claim, setClaim] = useState(defaultClaim);

  // Load current user + admin-configured bonus settings.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await base44.auth.me().catch(() => null);
        const rows = await base44.entities.BonusSetting.list().catch(() => []);
        if (!active) return;
        if (me) { setUserId(me.id); setUserEmail(me.email); }
        setSettings(rows);
      } catch {
        if (active) setSettings([]);
      }
    })();
    return () => { active = false; };
  }, []);

  const claimKey = userId ? `casino_bonuses_${userId}` : null;

  useEffect(() => {
    if (!claimKey) return;
    try {
      const s = localStorage.getItem(claimKey);
      setClaim(s ? { ...defaultClaim, ...JSON.parse(s) } : { ...defaultClaim });
    } catch {
      setClaim({ ...defaultClaim });
    }
  }, [claimKey]);

  useEffect(() => {
    if (claimKey) localStorage.setItem(claimKey, JSON.stringify(claim));
  }, [claimKey, claim]);

  const cfg = (name) => {
    const r = settings.find((s) => s.name === name);
    if (!r) return DEFAULTS[name];
    return {
      amount: Number(r.amount ?? 0),
      deposit_percent: Number(r.deposit_percent ?? 0),
      active: r.active !== false,
    };
  };
  const signupCfg = cfg('signup');
  const dailyCfg = cfg('daily');
  const weeklyCfg = cfg('weekly');
  const monthlyCfg = cfg('monthly');
  const depositCfg = cfg('deposit');

  // Deposit creates a pending request — no instant credit. Admin must approve.
  // Demo balance cannot be deposited or withdrawn.
  const deposit = async (amount) => {
    if (demoMode) return false;
    const n = Number(amount);
    if (!n || n <= 0 || !userId) return;
    try {
      await base44.entities.Transaction.create({
        user_id: userId, user_email: userEmail, type: 'deposit', amount: n,
        status: 'pending', method: 'manual-request', note: 'Deposit request',
      });
    } catch { /* user will see no toast change */ }
    setClaim((prev) => ({ ...prev, depositAvailable: true, depositAmount: n }));
  };

  const withdraw = (amount) => {
    if (demoMode) return false;
    const n = Number(amount);
    if (!n || n <= 0 || n > balance) return false;
    setBalance((b) => b - n);
    return true;
  };

  const claimSignup = () => {
    if (!signupCfg.active || claim.signupClaimed) return false;
    addRealBalance(signupCfg.amount, 'signup');
    setClaim((prev) => ({ ...prev, signupClaimed: true }));
    if (userId) pushNotification({ user_id: userId, type: 'bonus_claimed', title: 'Signup bonus claimed', body: `+$${signupCfg.amount.toFixed(2)} added to your balance`, amount: signupCfg.amount });
    return true;
  };
  const claimDaily = () => {
    if (!dailyCfg.active || claim.dailyLast === todayStr()) return false;
    addRealBalance(dailyCfg.amount, 'daily');
    setClaim((prev) => ({ ...prev, dailyLast: todayStr() }));
    if (userId) pushNotification({ user_id: userId, type: 'bonus_claimed', title: 'Daily bonus claimed', body: `+$${dailyCfg.amount.toFixed(2)} added to your balance`, amount: dailyCfg.amount });
    return true;
  };
  const claimWeekly = () => {
    if (!weeklyCfg.active || claim.weeklyLast === weekStr()) return false;
    addRealBalance(weeklyCfg.amount, 'weekly');
    setClaim((prev) => ({ ...prev, weeklyLast: weekStr() }));
    if (userId) pushNotification({ user_id: userId, type: 'bonus_claimed', title: 'Weekly bonus claimed', body: `+$${weeklyCfg.amount.toFixed(2)} added to your balance`, amount: weeklyCfg.amount });
    return true;
  };
  const claimMonthly = () => {
    if (!monthlyCfg.active || claim.monthlyLast === monthStr()) return false;
    addRealBalance(monthlyCfg.amount, 'monthly');
    setClaim((prev) => ({ ...prev, monthlyLast: monthStr() }));
    if (userId) pushNotification({ user_id: userId, type: 'bonus_claimed', title: 'Monthly bonus claimed', body: `+$${monthlyCfg.amount.toFixed(2)} added to your balance`, amount: monthlyCfg.amount });
    return true;
  };
  const claimDeposit = () => {
    if (!depositCfg.active || !claim.depositAvailable) return false;
    const bonus = Math.round(claim.depositAmount * (depositCfg.deposit_percent / 100) * 100) / 100;
    addRealBalance(bonus, 'deposit_bonus');
    setClaim((prev) => ({ ...prev, depositAvailable: false }));
    if (userId) pushNotification({ user_id: userId, type: 'bonus_claimed', title: 'Deposit bonus claimed', body: `+$${bonus.toFixed(2)} added to your balance`, amount: bonus });
    return bonus;
  };

  return {
    balance, deposit, withdraw, wagerRemaining, maxWithdrawable, demoMode,
    bonuses: {
      signup: { amount: signupCfg.amount, active: signupCfg.active, claimed: claim.signupClaimed, claim: claimSignup },
      daily: { amount: dailyCfg.amount, active: dailyCfg.active, claimed: claim.dailyLast === todayStr(), claim: claimDaily },
      weekly: { amount: weeklyCfg.amount, active: weeklyCfg.active, claimed: claim.weeklyLast === weekStr(), claim: claimWeekly },
      monthly: { amount: monthlyCfg.amount, active: monthlyCfg.active, claimed: claim.monthlyLast === monthStr(), claim: claimMonthly },
      deposit: {
        amount: claim.depositAmount
          ? Math.round(claim.depositAmount * (depositCfg.deposit_percent / 100) * 100) / 100
          : 0,
        percent: depositCfg.deposit_percent,
        active: depositCfg.active,
        available: claim.depositAvailable,
        claim: claimDeposit,
      },
    },
  };
}