import { useState, useEffect } from 'react';

// Shared casino balance + bonus claim state, persisted in localStorage.
const BAL_KEY = 'casino_balance';
const START_BALANCE = 0;
const BONUS_KEY = 'casino_bonuses';

const SIGNUP_BONUS = 500;
const DAILY_BONUS = 100;
const MONTHLY_BONUS = 1000;
const DEPOSIT_BONUS_RATE = 0.5;

const todayStr = () => new Date().toISOString().slice(0, 10);
const monthStr = () => new Date().toISOString().slice(0, 7);

const defaultBonuses = {
  signupClaimed: false,
  dailyLast: null,
  monthlyLast: null,
  depositAvailable: false,
  depositAmount: 0,
};

function readBonuses() {
  try {
    const s = localStorage.getItem(BONUS_KEY);
    return s ? { ...defaultBonuses, ...JSON.parse(s) } : { ...defaultBonuses };
  } catch {
    return { ...defaultBonuses };
  }
}

export function useCasinoAccount() {
  const [balance, setBalance] = useState(() => {
    const s = localStorage.getItem(BAL_KEY);
    return s ? parseFloat(s) : START_BALANCE;
  });
  const [bonuses, setBonuses] = useState(readBonuses);

  useEffect(() => { localStorage.setItem(BAL_KEY, String(balance)); }, [balance]);
  useEffect(() => { localStorage.setItem(BONUS_KEY, JSON.stringify(bonuses)); }, [bonuses]);

  const deposit = (amount) => {
    const n = Number(amount);
    if (!n || n <= 0) return;
    setBalance(b => b + n);
    setBonuses(prev => ({ ...prev, depositAvailable: true, depositAmount: n }));
  };

  const withdraw = (amount) => {
    const n = Number(amount);
    if (!n || n <= 0 || n > balance) return false;
    setBalance(b => b - n);
    return true;
  };

  const claimSignup = () => {
    if (bonuses.signupClaimed) return false;
    setBalance(b => b + SIGNUP_BONUS);
    setBonuses(prev => ({ ...prev, signupClaimed: true }));
    return true;
  };

  const claimDaily = () => {
    if (bonuses.dailyLast === todayStr()) return false;
    setBalance(b => b + DAILY_BONUS);
    setBonuses(prev => ({ ...prev, dailyLast: todayStr() }));
    return true;
  };

  const claimMonthly = () => {
    if (bonuses.monthlyLast === monthStr()) return false;
    setBalance(b => b + MONTHLY_BONUS);
    setBonuses(prev => ({ ...prev, monthlyLast: monthStr() }));
    return true;
  };

  const claimDeposit = () => {
    if (!bonuses.depositAvailable) return false;
    const bonus = Math.round(bonuses.depositAmount * DEPOSIT_BONUS_RATE * 100) / 100;
    setBalance(b => b + bonus);
    setBonuses(prev => ({ ...prev, depositAvailable: false }));
    return bonus;
  };

  return {
    balance,
    deposit,
    withdraw,
    bonuses: {
      signup: { amount: SIGNUP_BONUS, claimed: bonuses.signupClaimed, claim: claimSignup },
      daily: { amount: DAILY_BONUS, claimed: bonuses.dailyLast === todayStr(), claim: claimDaily },
      monthly: { amount: MONTHLY_BONUS, claimed: bonuses.monthlyLast === monthStr(), claim: claimMonthly },
      deposit: {
        amount: bonuses.depositAmount ? Math.round(bonuses.depositAmount * DEPOSIT_BONUS_RATE * 100) / 100 : 0,
        available: bonuses.depositAvailable,
        claim: claimDeposit,
      },
    },
  };
}