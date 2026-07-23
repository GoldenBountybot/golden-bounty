import { useState, useRef, useEffect, useCallback } from 'react';
import {
  REELS, ROWS, generateGrid, evaluate, resolveBonus, forceWinGrid,
  BETS, FREE_SPINS_AWARD, BONUS_TRIGGER_COUNT, MAX_RISK_STEPS,
  coinTriggered, collectCoins, spinCoinRound, coinTotal, COIN_SPINS_START,
} from './argonautsEngine';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';

export function useArgonauts() {
  const [grid, setGrid] = useState(() => generateGrid(false));
  const { balance, setBalance, reset: resetBalance } = useCasinoBalance();
  const [betIndex, setBetIndex] = useState(3); // $1 default
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [totalWin, setTotalWin] = useState(0);
  const [message, setMessage] = useState('ARGONAUTS · QUEST FOR THE GOLDEN FLEECE');
  const [winningPositions, setWinningPositions] = useState(new Set());
  const [winningLines, setWinningLines] = useState([]);
  const [spinningReels, setSpinningReels] = useState(new Set([0, 1, 2, 3, 4]));
  const [freeSpins, setFreeSpins] = useState(0);
  const [freeSpinsActive, setFreeSpinsActive] = useState(false);
  const [showFreeSpinStart, setShowFreeSpinStart] = useState(false);
  const [bonusActive, setBonusActive] = useState(false);
  const [bonusSteps, setBonusSteps] = useState([]);
  const [bonusPrize, setBonusPrize] = useState(0);
  const [bonusExtra, setBonusExtra] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [riskActive, setRiskActive] = useState(false);
  const [riskMode, setRiskMode] = useState(false);
  const [riskStep, setRiskStep] = useState(0);
  const [riskHistory, setRiskHistory] = useState([]);
  const [riskResult, setRiskResult] = useState(null);
  const [pendingWin, setPendingWin] = useState(0);

  // Value-coin hold-and-spin round state
  const [coinMode, setCoinMode] = useState(false);
  const [coinSpins, setCoinSpins] = useState(0);
  const [coinStuck, setCoinStuck] = useState({});

  const settings = useGameSettings('argonauts');
  const logActivity = useLogActivity('argonauts');
  const rtpRef = useRef(50);
  useEffect(() => { rtpRef.current = settings.rtp; }, [settings.rtp]);

  const timers = useRef([]);
  const bet = BETS[betIndex];
  const lineBet = bet / 10;

  // refs to avoid stale closures in chained coin-spin timers
  const betRef = useRef(bet); betRef.current = bet;
  const turboRef = useRef(turbo); turboRef.current = turbo;
  const coinModeRef = useRef(false);
  const coinStuckRef = useRef({});
  const coinSpinsRef = useRef(0);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // ---- Coin round ----
  const endCoinRound = useCallback((stuck) => {
    const total = coinTotal(stuck, betRef.current);
    coinStuckRef.current = {};
    coinSpinsRef.current = 0;
    coinModeRef.current = false;
    setCoinMode(false);
    setCoinStuck({});
    setCoinSpins(0);
    setBalance((b) => b + total);
    setLastWin(total);
    setTotalWin((t) => t + total);
    setMessage(`COIN FEATURE · WON $${total.toFixed(2)}`);
    logActivity('argonauts', betRef.current, total, 'win', 0);
  }, [setBalance, logActivity]);

  const coinSpin = useCallback(() => {
    if (!coinModeRef.current || Object.keys(coinStuckRef.current).length === 0) return;
    setSpinning(true);
    setSpinningReels(new Set());
    setWinningPositions(new Set());
    const { grid: newGrid, stuck: newStuck, dropped } = spinCoinRound(coinStuckRef.current);
    const gap = turboRef.current ? 80 : 150;
    const stopReel = (i) => {
      const t = setTimeout(() => {
        setGrid((prev) => { const next = prev.map((r) => [...r]); next[i] = newGrid[i]; return next; });
        setSpinningReels((prev) => { const n = new Set(prev); n.add(i); return n; });
        if (i < REELS - 1) stopReel(i + 1);
        else {
          const t2 = setTimeout(() => {
            coinStuckRef.current = newStuck;
            setCoinStuck(newStuck);
            setSpinning(false);
            setSpinningReels(new Set([0, 1, 2, 3, 4]));
            if (dropped > 0) {
              coinSpinsRef.current = COIN_SPINS_START;
              setCoinSpins(COIN_SPINS_START);
              setMessage(`COIN +${dropped} · 3 SPINS`);
            } else {
              const nc = coinSpinsRef.current - 1;
              coinSpinsRef.current = nc;
              setCoinSpins(nc);
              if (nc <= 0) { endCoinRound(newStuck); return; }
              setMessage(`${nc} SPINS LEFT`);
            }
            if (dropped > 0 || coinSpinsRef.current > 0) {
              const t3 = setTimeout(() => coinSpin(), turboRef.current ? 600 : 1000);
              timers.current.push(t3);
            }
          }, turboRef.current ? 120 : 250);
          timers.current.push(t2);
        }
      }, gap * (i + 1));
      timers.current.push(t);
    };
    stopReel(0);
  }, [endCoinRound]);

  const startCoinRound = useCallback((finalGrid) => {
    const stuck = collectCoins(finalGrid);
    coinStuckRef.current = stuck;
    coinSpinsRef.current = COIN_SPINS_START;
    coinModeRef.current = true;
    setCoinStuck(stuck);
    setCoinSpins(COIN_SPINS_START);
    setCoinMode(true);
    setWinningPositions(new Set());
    const t = setTimeout(() => coinSpin(), turboRef.current ? 700 : 1100);
    timers.current.push(t);
  }, [coinSpin]);

  const settle = useCallback((finalGrid, usingFree) => {
    setGrid(finalGrid);
    setSpinningReels(new Set([0, 1, 2, 3, 4]));
    const { wins, scatterCount, scatterPay, bonusCount, lineWin } = evaluate(finalGrid, lineBet, bet);
    const positions = new Set();
    wins.forEach((w) => w.positions.forEach((p) => positions.add(p)));
    setWinningPositions(positions);
    setWinningLines(wins.map((w) => ({ line: w.line, symbol: w.symbol, count: w.count, pay: w.pay })));

    const baseWin = lineWin + scatterPay;

    // Value-coin hold-and-spin trigger (base game only)
    const coinTrig = !usingFree && coinTriggered(finalGrid);
    if (coinTrig) {
      if (baseWin > 0) {
        setBalance((b) => b + baseWin);
        setLastWin(baseWin);
        setTotalWin((t) => t + baseWin);
      }
      setMessage(baseWin > 0 ? `WIN $${baseWin.toFixed(2)} · COIN FEATURE!` : 'COIN FEATURE!');
      setSpinning(false);
      logActivity('argonauts', bet, baseWin, baseWin > 0 ? 'win' : 'loss');
      startCoinRound(finalGrid);
      return;
    }

    let awardedFree = false;
    if (scatterCount >= 3) {
      awardedFree = true;
      setFreeSpins((f) => f + FREE_SPINS_AWARD);
      if (!usingFree) setShowFreeSpinStart(true);
    }

    if (baseWin > 0) {
      setLastWin(baseWin);
      setTotalWin((t) => t + baseWin);
      if (usingFree) {
        setBalance((b) => b + baseWin);
        setMessage(awardedFree ? `WIN $${baseWin.toFixed(2)} · +${FREE_SPINS_AWARD} FREE` : `WIN $${baseWin.toFixed(2)}`);
      } else {
        setPendingWin(baseWin);
        setRiskActive(true);
        setMessage(awardedFree ? `WIN $${baseWin.toFixed(2)} · +${FREE_SPINS_AWARD} FREE` : `WIN $${baseWin.toFixed(2)} · TAKE / RISK?`);
      }
    } else {
      setLastWin(0);
      if (!awardedFree) setMessage(usingFree ? 'FREE SPIN · NO WIN' : 'NO WIN · SPIN AGAIN');
    }

    if (bonusCount >= BONUS_TRIGGER_COUNT && !usingFree) {
      const t = setTimeout(() => {
        const { steps, total, extraJackpot } = resolveBonus(bet, bonusCount);
        setBonusSteps(steps);
        setBonusPrize(total);
        setBonusExtra(extraJackpot);
        setBonusActive(true);
      }, 700);
      timers.current.push(t);
    }

    setSpinning(false);
    if (!usingFree && !awardedFree && bonusCount < BONUS_TRIGGER_COUNT) {
      logActivity('argonauts', bet, baseWin, baseWin > 0 ? 'win' : 'loss');
    }
  }, [lineBet, bet, setBalance, logActivity, startCoinRound]);

  const spin = useCallback(() => {
    if (spinning || coinModeRef.current) return;
    const usingFree = freeSpins > 0;
    if (!usingFree && balance < bet) {
      setMessage('Insufficient balance!');
      return;
    }
    timers.current.forEach(clearTimeout);
    timers.current = [];

    setSpinning(true);
    setWinningPositions(new Set());
    setWinningLines([]);
    setLastWin(0);
    setSpinningReels(new Set());
    if (riskActive && pendingWin > 0) setBalance((b) => b + pendingWin);
    setPendingWin(0);
    setRiskActive(false);
    if (!usingFree) {
      setTotalWin(0);
      setBalance((b) => b - bet);
    } else {
      setFreeSpins((f) => f - 1);
    }
    setMessage('Spinning...');

    const wantWin = Math.random() < (rtpRef.current / 100);
    let finalGrid;
    if (usingFree) {
      finalGrid = generateGrid(true);
    } else if (wantWin) {
      finalGrid = forceWinGrid();
    } else {
      finalGrid = generateGrid(false);
      let attempts = 0;
      while (attempts < 5 && evaluate(finalGrid, lineBet, bet).lineWin > 0) {
        finalGrid = generateGrid(false);
        attempts++;
      }
    }

    const gap = turbo ? 110 : 200;
    const stopReel = (i) => {
      const t = setTimeout(() => {
        setGrid((prev) => {
          const next = prev.map((r) => [...r]);
          next[i] = finalGrid[i];
          return next;
        });
        setSpinningReels((prev) => {
          const n = new Set(prev);
          n.add(i);
          return n;
        });
        if (i < REELS - 1) stopReel(i + 1);
        else {
          const t2 = setTimeout(() => settle(finalGrid, usingFree), turbo ? 150 : 320);
          timers.current.push(t2);
        }
      }, gap * (i + 1));
      timers.current.push(t);
    };
    stopReel(0);
  }, [spinning, balance, bet, freeSpins, turbo, lineBet, settle, riskActive, pendingWin]);

  // Free spins auto-trigger
  useEffect(() => {
    if (freeSpinsActive && !spinning && freeSpins > 0 && !showFreeSpinStart && !bonusActive && !coinMode) {
      const t = setTimeout(() => spin(), turbo ? 350 : 700);
      return () => clearTimeout(t);
    }
    if (freeSpinsActive && freeSpins === 0 && !bonusActive && !coinMode) {
      setFreeSpinsActive(false);
      setMessage(`FREE SPINS ENDED · TOTAL $${totalWin.toFixed(2)}`);
      setSpinning(false);
      logActivity('argonauts', 0, totalWin, totalWin > 0 ? 'win' : 'loss', 0);
    }
  }, [freeSpinsActive, spinning, freeSpins, showFreeSpinStart, bonusActive, coinMode, turbo, spin, totalWin, logActivity]);

  // Auto spin
  useEffect(() => {
    if (autoSpin && !spinning && !freeSpinsActive && !bonusActive && !riskActive && !showFreeSpinStart && !coinMode && freeSpins === 0 && balance >= bet) {
      const t = setTimeout(() => spin(), turbo ? 300 : 700);
      return () => clearTimeout(t);
    }
    if (autoSpin && balance < bet) setAutoSpin(false);
  }, [autoSpin, spinning, freeSpinsActive, bonusActive, riskActive, showFreeSpinStart, coinMode, freeSpins, balance, bet, turbo, spin]);

  const startFreeSpins = useCallback(() => {
    setShowFreeSpinStart(false);
    setFreeSpinsActive(true);
    spin();
  }, [spin]);

  const finishBonus = useCallback(() => {
    setBonusActive(false);
    setBonusSteps([]);
    setBalance((b) => b + bonusPrize);
    setLastWin(bonusPrize);
    setTotalWin((t) => t + bonusPrize);
    setMessage(`GOLDEN FLEECE · WON $${bonusPrize.toFixed(2)}${bonusExtra ? ' · ULTRA JACKPOT!' : ''}`);
    setSpinning(false);
    logActivity('argonauts', bet, bonusPrize, 'win', 0);
    setBonusPrize(0);
    setBonusExtra(false);
  }, [bonusPrize, bonusExtra, setBalance, logActivity, bet]);

  // Gamble (risk) feature
  const startRisk = useCallback(() => {
    if (pendingWin <= 0) return;
    setRiskMode(true);
    setRiskActive(false);
    setRiskStep(0);
    setRiskHistory([]);
    setRiskResult(null);
  }, [pendingWin]);

  const riskPick = useCallback((color) => {
    const drawn = Math.random() < 0.5 ? 'red' : 'black';
    const win = drawn === color;
    setRiskHistory((h) => [...h, drawn]);
    if (win) {
      setPendingWin((w) => w * 2);
      setRiskStep((s) => s + 1);
      if (riskStep + 1 >= MAX_RISK_STEPS) setRiskResult('maxed');
    } else {
      setRiskResult('lose');
    }
  }, [riskStep]);

  const collectRisk = useCallback(() => {
    setBalance((b) => b + pendingWin);
    setLastWin(pendingWin);
    setMessage(`RISK WIN · COLLECTED $${pendingWin.toFixed(2)}`);
    setRiskMode(false);
    setRiskActive(false);
    setPendingWin(0);
    setRiskHistory([]);
    setRiskResult(null);
    setSpinning(false);
    logActivity('argonauts', bet, pendingWin, 'win', 0);
  }, [pendingWin, setBalance, logActivity, bet]);

  const loseRisk = useCallback(() => {
    setMessage('RISK GAME · LOST');
    setRiskMode(false);
    setRiskActive(false);
    setPendingWin(0);
    setRiskHistory([]);
    setRiskResult(null);
    setSpinning(false);
    logActivity('argonauts', bet, 0, 'loss', 0);
  }, [logActivity, bet]);

  const reset = () => {
    resetBalance();
    setLastWin(0);
    setTotalWin(0);
    setFreeSpins(0);
    setFreeSpinsActive(false);
    setShowFreeSpinStart(false);
    setAutoSpin(false);
    setCoinMode(false);
    setCoinStuck({});
    setCoinSpins(0);
    coinModeRef.current = false;
    coinStuckRef.current = {};
    coinSpinsRef.current = 0;
    setMessage('Balance reset');
  };

  return {
    grid, balance, bet, betIndex, spinning, spinningReels,
    lastWin, totalWin, message, winningPositions, winningLines,
    freeSpins, freeSpinsActive, showFreeSpinStart, startFreeSpins,
    bonusActive, bonusSteps, bonusPrize, bonusExtra, finishBonus,
    autoSpin, turbo, setBetIndex, setTurbo, setAutoSpin,
    riskActive, riskMode, riskStep, riskHistory, riskResult, pendingWin,
    startRisk, riskPick, collectRisk, loseRisk,
    coinMode, coinSpins, coinStuck,
    spin, reset,
  };
}