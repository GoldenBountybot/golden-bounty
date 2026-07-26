import { useState, useRef, useEffect, useCallback } from 'react';
import { computeSpin, BETS, buildGrid, FREE_SPINS_AWARD } from '@/lib/gatesEngine';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';

export function useGates() {
  const [grid, setGrid] = useState(() => buildGrid(false));
  const { balance, setBalance, reset: resetBalance } = useCasinoBalance();
  const [bet, setBet] = useState(BETS[2]);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [message, setMessage] = useState('GATES OF OLYMPUS · 8+ PAYS');
  const [winPositions, setWinPositions] = useState(new Set());
  const [freeSpins, setFreeSpins] = useState(0);
  const [showFreeSpinStart, setShowFreeSpinStart] = useState(false);
  const [freeSpinsActive, setFreeSpinsActive] = useState(false);
  const [awardedFreeSpins, setAwardedFreeSpins] = useState(FREE_SPINS_AWARD);
  const [turbo, setTurbo] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [spinMult, setSpinMult] = useState(0); // running multiplier for display
  const [winFlash, setWinFlash] = useState(0); // tumble running win for display

  const settings = useGameSettings('gates-of-olympus');
  const logActivity = useLogActivity();
  const rtpRef = useRef(50);
  useEffect(() => { rtpRef.current = settings.rtp; }, [settings.rtp]);
  const minBet = settings.minBet || BETS[0];
  const maxBet = settings.maxBet || BETS[BETS.length - 1];

  const timers = useRef([]);
  const runningMultRef = useRef(0);

  const setCustomBet = useCallback((amount) => {
    const n = Math.max(minBet, Math.min(maxBet, Number(amount) || minBet));
    setBet(Math.round(n * 100) / 100);
  }, [minBet, maxBet]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const spin = useCallback(() => {
    if (spinning) return;
    const usingFree = freeSpins > 0;
    if (!usingFree && balance < bet) {
      setMessage('Insufficient balance');
      return;
    }
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setSpinning(true);
    setWinPositions(new Set());
    setLastWin(0);
    setSpinMult(0);
    setWinFlash(0);
    if (!usingFree) setBalance((b) => b - bet);
    if (usingFree) setFreeSpins((f) => f - 1);
    setMessage('Spinning…');

    // RTP-biased forced win/loss gate.
    const wantWin = Math.random() < (rtpRef.current / 100) * 0.42;
    const freeMode = usingFree;
    const result = computeSpin(bet, wantWin, freeMode, runningMultRef.current);
    if (freeMode) runningMultRef.current = result.newRunningMult;

    const tumbleGap = turbo ? 990 : 1590;
    const firstGap = turbo ? 320 : 620;
    let acc = 0;
    let runningWin = 0;
    let multSeen = 0; // sum of multipliers revealed so far across tumbles
    const baseStart = freeMode ? (result.newRunningMult - result.spinMultSum) : 0;

    result.tumbles.forEach((tb, i) => {
      const showDelay = i === 0 ? firstGap : tumbleGap;
      acc += showDelay;
      const showAt = acc;
      timers.current.push(setTimeout(() => {
        setGrid(tb.grid);
        setWinPositions(tb.winPositions);
        runningWin += tb.win;
        if (tb.multipliers.length) multSeen += tb.multipliers.reduce((s, m) => s + m.value, 0);
        setWinFlash(runningWin);
        setSpinMult(freeMode ? (baseStart + multSeen) : multSeen);
      }, showAt));
      if (i < result.tumbles.length - 1) {
        acc += turbo ? 320 : 560;
        timers.current.push(setTimeout(() => setWinPositions(new Set()), acc));
      }
    });

    // settle
    acc += turbo ? 990 : 1590;
    timers.current.push(setTimeout(() => {
      const win = result.spinWin;
      if (win > 0) {
        setBalance((b) => b + win);
        setLastWin(win);
        setMessage(`WIN $${win.toFixed(2)}`);
      } else {
        setLastWin(0);
        setMessage(usingFree ? 'FREE SPIN · NO WIN' : 'GATES OF OLYMPUS · 8+ PAYS');
      }
      if (!freeMode) {
        setSpinMult(0);
        runningMultRef.current = 0;
      }
      // free spins trigger / retrigger
      if (result.triggeredFree) {
        setAwardedFreeSpins(FREE_SPINS_AWARD);
        setFreeSpins((f) => f + FREE_SPINS_AWARD);
        if (!usingFree) {
          setShowFreeSpinStart(true);
          setMessage(`${result.scatterMax} SCATTERS · +${FREE_SPINS_AWARD} FREE SPINS`);
        } else {
          setMessage(`RETRIGGER · +${FREE_SPINS_AWARD} FREE SPINS`);
        }
      }
      setSpinning(false);
      logActivity('gates-of-olympus', bet, win, win > 0 ? 'win' : 'loss', result.effectiveMult || 0);
    }, acc));
  }, [spinning, balance, bet, freeSpins, turbo, setBalance, logActivity]);

  // auto spin (base game)
  useEffect(() => {
    if (autoSpin && !spinning && !freeSpinsActive && balance >= bet) {
      const t = setTimeout(() => spin(), turbo ? 250 : 650);
      return () => clearTimeout(t);
    }
    if (autoSpin && balance < bet) setAutoSpin(false);
  }, [autoSpin, spinning, balance, bet, turbo, freeSpinsActive, spin]);

  // free spins auto trigger
  useEffect(() => {
    if (freeSpinsActive && !spinning && freeSpins > 0 && !showFreeSpinStart) {
      const t = setTimeout(() => spin(), turbo ? 350 : 750);
      return () => clearTimeout(t);
    }
    if (freeSpinsActive && freeSpins === 0) {
      setFreeSpinsActive(false);
      runningMultRef.current = 0;
      setSpinMult(0);
      setMessage('FREE SPINS ENDED');
    }
  }, [freeSpinsActive, spinning, freeSpins, showFreeSpinStart, turbo, spin]);

  const startFreeSpins = useCallback(() => {
    setShowFreeSpinStart(false);
    setFreeSpinsActive(true);
    runningMultRef.current = 0;
    setSpinMult(0);
    spin();
  }, [spin]);

  const cancelFreeSpinStart = useCallback(() => {
    setFreeSpins((f) => Math.max(0, f - awardedFreeSpins));
    setShowFreeSpinStart(false);
    setMessage('Free spins cancelled');
  }, [awardedFreeSpins]);

  const reset = () => {
    resetBalance();
    setLastWin(0);
    setFreeSpins(0);
    setFreeSpinsActive(false);
    setShowFreeSpinStart(false);
    runningMultRef.current = 0;
    setSpinMult(0);
    setMessage('Balance reset');
  };

  return {
    grid, balance, bet, spinning, lastWin, message, winPositions,
    freeSpins, turbo, autoSpin, spinMult, winFlash,
    showFreeSpinStart, freeSpinsActive, startFreeSpins, awardedFreeSpins,
    cancelFreeSpinStart,
    spin, setBet, setCustomBet, minBet, maxBet, setTurbo, setAutoSpin, reset,
  };
}