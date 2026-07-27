import { useState, useRef, useEffect, useCallback } from 'react';
import { computeSpin, BETS, buildGrid, FREE_SPINS_AWARD, REELS, ROWS } from '@/lib/gatesEngine';

// every board position `${c}-${r}` — used so the first spin drops all symbols
const ALL_CELLS = (() => {
  const s = new Set();
  for (let c = 0; c < REELS; c++) for (let r = 0; r < ROWS; r++) s.add(`${c}-${r}`);
  return s;
})();
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
  const [shatter, setShatter] = useState(new Set());
  const [dropCells, setDropCells] = useState(new Set());
  const [freeSpins, setFreeSpins] = useState(0);
  const [showFreeSpinStart, setShowFreeSpinStart] = useState(false);
  const [freeSpinsActive, setFreeSpinsActive] = useState(false);
  const [awardedFreeSpins, setAwardedFreeSpins] = useState(FREE_SPINS_AWARD);
  const [turbo, setTurbo] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [spinMult, setSpinMult] = useState(0); // running multiplier for display
  const [winFlash, setWinFlash] = useState(0); // tumble running win for display
  const [winList, setWinList] = useState([]); // current tumble winners: {symbol,count,pay}[]
  const [winHistory, setWinHistory] = useState([]); // per-tumble winners list across the whole spin
  const [scatterGlow, setScatterGlow] = useState(new Set()); // scatter cells glowing when 4+ land together

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
    setShatter(new Set());
    setDropCells(new Set());
    setLastWin(0);
    if (!usingFree) setSpinMult(0);
    setWinFlash(0);
    setWinList([]);
    setWinHistory([]);
    setScatterGlow(new Set());
    if (!usingFree) setBalance((b) => b - bet);
    if (usingFree) setFreeSpins((f) => f - 1);
    setMessage('Spinning…');

    // RTP-biased forced win/loss gate. Free spins get a slightly higher chance
    // of landing 8+ matching symbols so the bonus round feels more rewarding.
    const baseChance = (rtpRef.current / 100) * 0.42;
    const wantWin = Math.random() < (usingFree ? baseChance + 0.12 : baseChance);
    const freeMode = usingFree;
    const result = computeSpin(bet, wantWin, freeMode, runningMultRef.current);
    if (freeMode) runningMultRef.current = result.newRunningMult;

    const hold = turbo ? 520 : 950;        // winners glow long enough to read which matched
    const shatterDur = turbo ? 240 : 420;  // winners blast away
    const firstGap = turbo ? 360 : 660;    // reels stop, first grid drops in
    let acc = 0;
    let runningWin = 0;
    let multSeen = 0; // sum of multipliers revealed so far across tumbles
    const baseStart = freeMode ? (result.newRunningMult - result.spinMultSum) : 0;

    let prevWinners = ALL_CELLS;
    const lastIdx = result.tumbles.length - 1;
    result.tumbles.forEach((tb, i) => {
      const showDelay = i === 0 ? firstGap : 0;
      acc += showDelay;
      const showAt = acc;
      const fresh = i === 0 ? ALL_CELLS : prevWinners;
      // show grid + highlight winners; only fresh (empty) cells drop in
      timers.current.push(setTimeout(() => {
        setShatter(new Set());
        setGrid(tb.grid);
        setWinPositions(tb.winPositions);
        setDropCells(fresh);
        runningWin += tb.win;
        // Multipliers only count on a winning tumble (matches the engine rule).
        if (tb.win > 0 && tb.multipliers.length) multSeen += tb.multipliers.reduce((s, m) => s + m.value, 0);
        setWinFlash(runningWin);
        if (tb.wins.length) {
          setWinList(tb.wins);
          setWinHistory((h) => [...h, { wins: tb.wins, subtotal: tb.win, mult: tb.multipliers.length ? tb.multipliers.reduce((s, m) => s + m.value, 0) : 0 }]);
        }
        const scatPos = new Set();
        for (let c = 0; c < REELS; c++) for (let r = 0; r < ROWS; r++) if (tb.grid[c][r] === 'scatter') scatPos.add(`${c}-${r}`);
        setScatterGlow(scatPos.size >= 4 ? scatPos : new Set());
        setSpinMult(freeMode ? (baseStart + multSeen) : multSeen);
      }, showAt));
      // winners glow, then shatter away. The final tumble has no winners, so
      // it skips the glow/shatter wait and settles as soon as its symbols
      // finish dropping — the next spin is ready immediately after the drop.
      if (tb.win > 0) {
        acc += hold;
        timers.current.push(setTimeout(() => setShatter(tb.winPositions), acc));
        acc += shatterDur;
        if (i < lastIdx) {
          timers.current.push(setTimeout(() => {
            setShatter(new Set());
            setWinPositions(new Set());
          }, acc));
        }
      }
      prevWinners = tb.winPositions;
    });

    // settle — right after the final drop has landed
    acc += turbo ? 200 : 320;
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
      setScatterGlow(new Set());
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

  // Buy bonus — pay 100× current bet to trigger the free spins round instantly.
  const buyFreeSpins = useCallback(() => {
    if (spinning) return;
    if (freeSpins > 0) return;
    const cost = Math.round(bet * 100 * 100) / 100;
    if (balance < cost) {
      setMessage('Insufficient balance');
      return;
    }
    setBalance((b) => b - cost);
    setAwardedFreeSpins(FREE_SPINS_AWARD);
    setFreeSpins((f) => f + FREE_SPINS_AWARD);
    setShowFreeSpinStart(true);
    setMessage(`BUY · ${FREE_SPINS_AWARD} FREE SPINS · -$${cost.toFixed(2)}`);
  }, [spinning, freeSpins, bet, balance, setBalance]);

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
    grid, balance, bet, spinning, lastWin, message, winPositions, shatter, dropCells,
    freeSpins, turbo, autoSpin, spinMult, winFlash, winList, winHistory, scatterGlow,
    showFreeSpinStart, freeSpinsActive, startFreeSpins, awardedFreeSpins,
    cancelFreeSpinStart,
    spin, setBet, setCustomBet, minBet, maxBet, setTurbo, setAutoSpin, reset, buyFreeSpins,
  };
}