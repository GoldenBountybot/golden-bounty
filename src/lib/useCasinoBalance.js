import { useState, useEffect } from 'react';

// Shared casino balance — persisted in localStorage so winnings carry across every game.
const STORAGE_KEY = 'casino_balance';
const START_BALANCE = 0;

export function useCasinoBalance() {
  const [balance, setBalance] = useState(() => {
    // One-time reset to 0 for everyone: balance now comes only from bonuses + deposits.
    if (!localStorage.getItem('casino_balance_v2')) {
      localStorage.setItem('casino_balance_v2', '1');
      localStorage.setItem(STORAGE_KEY, '0');
      return 0;
    }
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? parseFloat(s) : START_BALANCE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(balance));
  }, [balance]);

  const reset = () => setBalance(START_BALANCE);

  return { balance, setBalance, reset };
}