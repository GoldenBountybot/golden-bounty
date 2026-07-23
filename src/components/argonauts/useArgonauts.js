import { useState, useRef, useEffect, useCallback } from 'react';
import {
  REELS, ROWS, generateGrid, evaluate, resolveBonus, forceWinGrid,
  BETS, FREE_SPINS_AWARD, BONUS_TRIGGER_COUNT, MAX_RISK_STEPS,
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
  const [totalWin, setTotalWin] = useState(0);       // accumulates across free spins
  const [message, setMessage] = useState('ARGONAUTS · QUEST FOR THE GOLDEN FLEECE');
  const [winningPositions, setWinningPositions] = useState(new Set());
  const [spinningReels, setSpinningReels] = useState(new Set());
  const [freeSpins, setFreeSpins] = useState(0);
  const [freeSpinsActive, setFreeSpinsActive] = useState(false);
  const [showFreeSpinStart, setShowFreeSpinStart] = useState(false);
  const [bonusActive, setBonusActive] = useState(false);
  const [bonusSteps, setBonusSteps] = useState([]);
  const [bonusPrize, setBonusPrize] = useState(0);
  const [bonusExtra, setBonusExtra] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [riskActive, setRiskActive] = useState(false);     // gamble prompt available
  const [riskMode, setRiskMode] = useState(false);          // gamble in progress
  const [riskStep, setRiskStep] = useState(0);
  const [riskHistory, setRiskHistory] = useState([]);        // ['red','black',...]
  const [riskResult, setRiskResult] = useState(null);        // 'win'|'lose'|null
  const [pendingWin, setPendingWin] = useState(0);           // win awaiting gamble decision

  const settings = useGameSettings('argonauts');
  const logActivity = useLogActivity('argonauts');
  const rtpRef = useRef(50);
  useEffect(() => { rtpRef.current = settings.rtp; }, [settings.rtp]);

  const timers = useRef([]);
  const bet = BETS[betIndex];
  const lineBet = bet / 10;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const settle = useCallback((finalGrid, usingFree) => {
    setGrid(finalGrid);
    setSpinningReels(new Set());
    const { wins, scatterCount, scatterPay, bonusCount, lineWin } = evaluate(finalGrid, lineBet, bet);
    const positions = new Set();
    wins.forEach((w) => w.positions.forEach((p) => positions.add(p)));
    setWinningPositions(positions);

    const baseWin = lineWin + scatterPay;
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
        // Hold the win as a gamble pot; credited on collect or next spin.
        setPendingWin(baseWin);
        setRiskActive(true);
        setMessage(awardedFree ? `WIN $${baseWin.toFixed(2)} · +${FREE_SPINS_AWARD} FREE` : `WIN $${baseWin.toFixed(2)} · TAKE / RISK?`);
      }
    } else {
      setLastWin(0);
      if (!awardedFree) setMessage(usingFree ? 'FREE SPIN · NO WIN' : 'NO WIN · SPIN AGAIN');
    }

    // Golden Fleece bonus
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
  }, [lineBet, bet, setBalance, logActivity]);

  const spin = useCallback(() => {
    if (spinning) return;
    const usingFree = freeSpins > 0;
    if (!usingFree && balance < bet) {
      setMessage('Insufficient balance!');
      return;
    }
    timers.current.forEach(clearTimeout);
    timers.current = [];

    setSpinning(true);
    setWinningPositions(new Set());
    setLastWin(0);
    // Auto-collect any pending risk pot before starting a fresh spin.
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

    // RTP bias: decide outcome before evaluation.
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
  }, [spinning, balance, bet, freeSpins, turbo, lineBet, settle]);

  // Free spins auto-trigger
  useEffect(() => {
    if (freeSpinsActive && !spinning && freeSpins > 0 && !showFreeSpinStart && !bonusActive) {
      const t = setTimeout(() => spin(), turbo ? 350 : 700);
      return () => clearTimeout(t);
    }
    if (freeSpinsActive && freeSpins === 0 && !bonusActive) {
      setFreeSpinsActive(false);
      setMessage(`FREE SPINS ENDED · TOTAL $${totalWin.toFixed(2)}`);
      setSpinning(false);
      logActivity('argonauts', 0, totalWin, totalWin > 0 ? 'win' : 'loss', 0);
    }
  }, [freeSpinsActive, spinning, freeSpins, showFreeSpinStart, bonusActive, turbo, spin, totalWin, logActivity]);

  // Auto spin
  useEffect(() => {
    if (autoSpin && !spinning && !freeSpinsActive && !bonusActive && !riskActive && !showFreeSpinStart && freeSpins === 0 && balance >= bet) {
      const t = setTimeout(() => spin(), turbo ? 300 : 700);
      return () => clearTimeout(t);
    }
    if (autoSpin && balance < bet) setAutoSpin(false);
  }, [autoSpin, spinning, freeSpinsActive, bonusActive, riskActive, showFreeSpinStart, freeSpins, balance, bet, turbo, spin]);

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

  // Gamble (risk) feature — double or nothing on card color, up to MAX_RISK_STEPS.
  const startRisk = useCallback(() => {
    if (pendingWin <= 0) return;
    setRiskMode(true);
    setRiskActive(false);
    setRiskStep(0);
    setRiskHistory([]);
    setRiskResult(null);
  }, [pendingWin]);

  const riskPick = useCallback((color) => {
    // red = hearts/diamonds, black = clubs/spades
    const drawn = Math.random() < 0.5 ? 'red' : 'black';
    const win = drawn === color;
    setRiskHistory((h) => [...h, drawn]);
    if (win) {
      setPendingWin((w) => w * 2);
      setRiskStep((s) => s + 1);
      if (riskStep + 1 >= MAX_RISK_STEPS) {
        setRiskResult('maxed');
      }
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
    setMessage('Balance reset');
  };

  return {
    grid, balance, bet, betIndex, spinning, spinningReels,
    lastWin, totalWin, message, winningPositions,
    freeSpins, freeSpinsActive, showFreeSpinStart, startFreeSpins,
    bonusActive, bonusSteps, bonusPrize, bonusExtra, finishBonus,
    autoSpin, turbo, setBetIndex, setTurbo, setAutoSpin,
    riskActive, riskMode, riskStep, riskHistory, riskResult, pendingWin,
    startRisk, riskPick, collectRisk, loseRisk,
    spin, reset,
  };
}