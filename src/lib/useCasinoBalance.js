import { useState, useEffect } from 'react';

// Shared casino balance — persisted in localStorage so winnings carry across every game.
const STORAGE_KEY = 'casino_balance';
const START_BALANCE = 25000;

export function useCasinoBalance() {
  const [balance, setBalance] = useState(() => {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? parseFloat(s) : START_BALANCE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(balance));
  }, [balance]);

  const reset = () => setBalance(START_BALANCE);

  return { balance, setBalance, reset };
}