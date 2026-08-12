import { useState, useRef, useEffect, useCallback } from 'react';
import { computeSpin, BETS, buildGrid, FREE_SPINS_AWARD, REELS, ROWS, MIN_BET } from '@/lib/gatesEngine';
import {
  playSpinSound, playWinSound, playBigWin, playHugeWin,
  playFreeSpinsTrigger, playFreeSpinStart, playFeatureEnd,
  playMultCollect, playError, playSuperWin, playMegaWin,
} from '@/lib/gatesSound';

// every board position `${c}-${r}` — used so the first spin drops all symbols
const ALL_CELLS = (() => {
  const s = new Set();
  for (let c = 0; c < REELS; c++) for (let r = 0; r < ROWS; r++) s.add(`${c}-${r}`);
  return s;
})();
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { savePendingRound, clearPendingRound, usePendingRoundRecovery } from '@/lib/pendingRound';

export function useGates() {
  const [grid, setGrid] = useState(() => buildGrid(false));
  const { balance, setBalance, reset: resetBalance, beginRound, settleBet } = useCasinoBalance();
  const [bet, setBet] = useState(MIN_BET);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [message, setMessage] = useState('GATES OF OLYMPUS · 8+ PAYS');
  const [winPositions, setWinPositions] = useState(new Set());
  const [shatter, setShatter] = useState(new Set());
  const [dropCells, setDropCells] = useState(new Set());
  const [tumbleSeq, setTumbleSeq] = useState(0);
  const [shatterSeq, setShatterSeq] = useState(0);
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
  const [bigWinBanner, setBigWinBanner] = useState(null); // { variant: 'super'|'mega', amount } | null
  const [freeSpinEndBanner, setFreeSpinEndBanner] = useState(null); // { amount } | null

  const settings = useGameSettings('gates-of-olympus');
  usePendingRoundRecovery('gates-of-olympus', setBalance, (state) => {
    // Restore an in-progress free spins round so the player resumes exactly
    // where they left off. The free-spins auto-trigger effect will spin the
    // next free spin automatically.
    if (state && state.freeSpinsActive && state.freeSpins > 0) {
      setFreeSpins(state.freeSpins);
      setFreeSpinsActive(true);
      runningMultRef.current = state.runningMult || 0;
      setSpinMult(state.runningMult || 0);
      setMessage(`FREE SPINS RESUMED · ${state.freeSpins} LEFT`);
    }
  });
  const rtpRef = useRef(50);
  const serverWinRef = useRef(0);
  const demoModeRef = useRef(false);
  useEffect(() => { rtpRef.current = settings.rtp; }, [settings.rtp]);
  useEffect(() => { demoModeRef.current = settings.demoMode; }, [settings.demoMode]);
  const minBet = settings.minBet || BETS[0];
  const maxBet = settings.maxBet || BETS[BETS.length - 1];

  const timers = useRef([]);
  const runningMultRef = useRef(0);
  const freeSpinsTotalRef = useRef(0); // accumulated win across the whole free spins round
  const nextSpinDelayRef = useRef(1200); // dynamic gap before the next auto/free spin
  const settlePromiseRef = useRef(null); // pending settleBet — awaited in spin() before the next beginRound

  const setCustomBet = useCallback((amount) => {
    const n = Math.max(minBet, Math.min(maxBet, Number(amount) || minBet));
    setBet(Math.round(n * 100) / 100);
  }, [minBet, maxBet]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const spin = useCallback(async () => {
    if (spinning) return;
    const usingFree = freeSpins > 0;
    if (!usingFree && balance < bet) {
      setMessage('Insufficient balance');
      playError();
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
    // Wait for any pending settleBet from the previous round to complete
    // before starting a new beginRound — prevents the race where the next
    // beginRound's server deduction overlaps the previous settleBet's
    // response, double-deducting the bet and making wins appear uncredited.
    if (settlePromiseRef.current) {
      await settlePromiseRef.current;
      settlePromiseRef.current = null;
    }
    const _serverRoundPromise = beginRound(bet, 'gates-of-olympus', usingFree);
    if (usingFree) setFreeSpins((f) => f - 1);
    setMessage('Spinning…');
    playSpinSound();

    // RTP-biased forced win/loss gate. Free spins get a slightly higher chance
    // of landing 8+ matching symbols so the bonus round feels more rewarding.
    const serverRound = await _serverRoundPromise;
    // If beginRound failed (network error, server reject, etc.), the server
    // did NOT deduct the bet (beginRound already reverted its local
    // deduction). Just abort.
    if (serverRound.failed) {
      setSpinning(false);
      setMessage('Connection error — try again');
      return;
    }
    serverWinRef.current = Number(serverRound.win_amount ?? 0);
    const wantWin = serverWinRef.current > 0;
    const freeMode = usingFree;
    const result = computeSpin(bet, wantWin, freeMode, runningMultRef.current, demoModeRef.current);
    // Scale the engine's tumble wins to match the server's pre-decided win.
    // The engine generates the visual tumble sequence (positions, symbols,
    // multipliers), but the server decides the actual win amount. Scale each
    // tumble's displayed win proportionally so the running total during the
    // animation ends at the server's win — no visual/balance desync.
    const serverWin = serverWinRef.current;
    if (wantWin && result.spinWin > 0 && serverWin > 0 && Math.abs(result.spinWin - serverWin) > 0.01) {
      const scale = serverWin / result.spinWin;
      result.tumbles.forEach((tb) => {
        tb.win = Math.round(tb.win * scale * 100) / 100;
        if (freeMode) tb.tumbleWin = Math.round(tb.tumbleWin * scale * 100) / 100;
        if (tb.wins) tb.wins = tb.wins.map((w) => ({ ...w, pay: Math.round(w.pay * scale * 100) / 100 }));
      });
      result.spinWin = serverWin;
      result.totalWin = serverWin;
    }
    // When the server decided a loss, suppress all visual tumble wins so the
    // display matches the 0 credit — forceLossGrid may fail to produce a
    // clean no-win grid after 10 attempts, leaving natural wins visible.
    if (!wantWin && result.spinWin > 0) {
      result.tumbles.forEach((tb) => {
        tb.win = 0;
        tb.tumbleWin = 0;
        tb.wins = [];
        tb.winPositions = new Set();
        tb.multipliers = [];
      });
      result.spinWin = 0;
      result.totalWin = 0;
    }
    // Persist this spin's already-determined outcome plus the in-progress free
    // spins round state, so a mid-spin exit can be fully recovered on return:
    // the pending win is credited AND the free spins round resumes where it
    // left off. Cleared at settle.
    savePendingRound('gates-of-olympus', {
      win: result.spinWin,
      bet,
      state: {
        freeSpins: usingFree ? Math.max(0, freeSpins - 1) : 0,
        freeSpinsActive: usingFree,
        runningMult: freeMode ? result.newRunningMult : 0,
      },
    });
    if (freeMode) runningMultRef.current = result.newRunningMult;

    const hold = turbo ? 340 : 700;        // winners grow big — longer so the match is clearly visible before the blast
    const shatterDur = turbo ? 300 : 580;  // winners blast away — smoother, more dramatic
    const firstGap = turbo ? 130 : 210;    // reels stop, first grid drops in
    const refillGap = turbo ? 50 : 120;  // brief pause so the blast fully clears before new symbols drop
    let acc = 0;
    let runningWin = 0;
    let multSeen = 0; // sum of multipliers revealed so far across tumbles
    const baseStart = freeMode ? (result.newRunningMult - result.spinMultSum) : 0;

    let prevWinners = ALL_CELLS;
    const lastIdx = result.tumbles.length - 1;
    let cascadeIdx = 0; // counts winning tumbles for the cascade chain sound
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
        setTumbleSeq((s) => s + 1);
        // Base game: show base wins during the spin (multiplier applied at settle).
        // Free spins: show the actual per-tumble cascading multiplied win.
        runningWin += freeMode ? tb.tumbleWin : tb.win;
        // Multipliers only count on a winning tumble (matches the engine rule).
        if (tb.win > 0 && tb.multipliers.length) multSeen += tb.multipliers.reduce((s, m) => s + m.value, 0);
        setWinFlash(runningWin);
        if (tb.wins.length) {
          setWinList(tb.wins);
          setWinHistory((h) => [...h, {
            wins: tb.wins,
            subtotal: tb.win,
            tumbleWin: tb.tumbleWin,
            mult: tb.multipliers.length ? tb.multipliers.reduce((s, m) => s + m.value, 0) : 0,
            multipliers: tb.multipliers,
            bannerBefore: tb.bannerBefore,
            effectiveMult: tb.effectiveMult,
            freeMode,
          }]);
        }
        const scatPos = new Set();
        for (let c = 0; c < REELS; c++) for (let r = 0; r < ROWS; r++) if (tb.grid[c][r] === 'scatter') scatPos.add(`${c}-${r}`);
        setScatterGlow(scatPos.size >= 4 ? scatPos : new Set());
        setSpinMult(freeMode ? (baseStart + multSeen) : multSeen);
        // Play the golden win chime when matching symbols land. Each
        // consecutive cascade gets slightly more energetic.
        if (tb.win > 0) {
          playWinSound(tb.win, bet, cascadeIdx);
          cascadeIdx++;
          // Multiplier collect — when a winning tumble has value symbols.
          if (tb.multipliers.length) playMultCollect();
        }
      }, showAt));
      // winners glow, then shatter away. The final tumble has no winners, so
      // it skips the glow/shatter wait and settles as soon as its symbols
      // finish dropping — the next spin is ready immediately after the drop.
      if (tb.win > 0) {
        acc += hold;
        // When value (multiplier) symbols landed on this winning tumble, keep
        // the matched symbols on the board while every multiplier chip flies
        // out and multiplies the win — only then do the symbols blast away.
        if (tb.multipliers.length) {
          acc += tb.bannerBefore > 0 ? 5200 : 2900;
        }
        timers.current.push(setTimeout(() => { setShatter(tb.winPositions); setShatterSeq((s) => s + 1); }, acc));
        acc += shatterDur;
        if (i < lastIdx) {
          // New symbols drop in the instant the blast ends (no empty pause),
          // so the refill feels as smooth as the spin drop. The next tumble's
          // timeout clears shatter and sets the new grid together.
          acc += refillGap;
        }
      }
      prevWinners = tb.winPositions;
    });

    // settle — right after the final drop has landed
    acc += turbo ? 200 : 320;
    timers.current.push(setTimeout(() => {
      clearPendingRound('gates-of-olympus');
      setShatter(new Set());
      setWinPositions(new Set());
      const win = serverWinRef.current;
      setWinFlash(win);
      const settlePromise = settleBet(bet, win, 'gates-of-olympus', freeMode);
      settlePromiseRef.current = settlePromise;
      settlePromise.then(() => { settlePromiseRef.current = null; });
      if (win > 0) {
        setLastWin(win);
        if (freeMode) freeSpinsTotalRef.current += win;
        setMessage(`WIN $${win.toFixed(2)}`);
        // Big win / huge win celebration based on win-to-bet ratio.
        // During free spins, suppress the super/mega banner per spin — it
        // is shown once at the end of the whole round based on the total.
        const ratio = bet > 0 ? win / bet : 0;
        if (freeMode) {
          if (ratio >= 10) playBigWin();
        } else if (ratio >= 50) {
          playMegaWin();
          setBigWinBanner({ variant: 'mega', amount: win, key: Date.now() });
        } else if (ratio >= 20) {
          playSuperWin();
          setBigWinBanner({ variant: 'super', amount: win, key: Date.now() });
        } else if (ratio >= 10) {
          playBigWin();
        }
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
        playFreeSpinsTrigger();
        if (!usingFree) {
          setShowFreeSpinStart(true);
          setMessage(`${result.scatterMax} SCATTERS · +${FREE_SPINS_AWARD} FREE SPINS`);
        } else {
          setMessage(`RETRIGGER · +${FREE_SPINS_AWARD} FREE SPINS`);
        }
      }
      setScatterGlow(new Set());
      // The flying chip animation now plays during the tumble sequence (each
      // multiplier tumble gets its own gap), so by settle the banner is done.
      // A short gap lets the settle message show before the next spin.
      nextSpinDelayRef.current = turbo ? 800 : 1200;
      setSpinning(false);
      // PlayerActivity is logged authoritatively by the backend settleBet
      // function — logging here too double-records each round in history.
    }, acc));
  }, [spinning, balance, bet, freeSpins, turbo, setBalance, settleBet]);

  // auto spin (base game) — pause briefly so the win amount is readable
  useEffect(() => {
    if (autoSpin && !spinning && !freeSpinsActive && balance >= bet) {
      const t = setTimeout(() => spin(), nextSpinDelayRef.current);
      return () => clearTimeout(t);
    }
    if (autoSpin && balance < bet) setAutoSpin(false);
  }, [autoSpin, spinning, balance, bet, turbo, freeSpinsActive, spin]);

  // free spins auto trigger
  useEffect(() => {
    if (freeSpinsActive && !spinning && freeSpins > 0 && !showFreeSpinStart) {
      const t = setTimeout(() => spin(), nextSpinDelayRef.current);
      return () => clearTimeout(t);
    }
    if (freeSpinsActive && freeSpins === 0) {
      setFreeSpinsActive(false);
      runningMultRef.current = 0;
      setSpinMult(0);
      const total = freeSpinsTotalRef.current;
      freeSpinsTotalRef.current = 0;
      setMessage('FREE SPINS ENDED');
      playFeatureEnd();
      if (total > 0) {
        // Super/mega win banner based on the whole round's total vs bet;
        // otherwise show the standard free-spins-complete banner.
        const ratio = bet > 0 ? total / bet : 0;
        if (ratio >= 50) {
          playMegaWin();
          setBigWinBanner({ variant: 'mega', amount: total, key: Date.now() });
        } else if (ratio >= 20) {
          playSuperWin();
          setBigWinBanner({ variant: 'super', amount: total, key: Date.now() });
        } else {
          setFreeSpinEndBanner({ amount: total, key: Date.now() });
        }
      }
    }
  }, [freeSpinsActive, spinning, freeSpins, showFreeSpinStart, turbo, spin, bet]);

  const startFreeSpins = useCallback(() => {
    setShowFreeSpinStart(false);
    setFreeSpinsActive(true);
    runningMultRef.current = 0;
    freeSpinsTotalRef.current = 0;
    setSpinMult(0);
    playFreeSpinStart();
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
    grid, balance, bet, spinning, lastWin, message, winPositions, shatter, dropCells, tumbleSeq, shatterSeq,
    freeSpins, turbo, autoSpin, spinMult, winFlash, winList, winHistory, scatterGlow,
    showFreeSpinStart, freeSpinsActive, startFreeSpins, awardedFreeSpins,
    cancelFreeSpinStart, bigWinBanner, setBigWinBanner,
    freeSpinEndBanner, setFreeSpinEndBanner,
    spin, setBet, setCustomBet, minBet, maxBet, setTurbo, setAutoSpin, reset, buyFreeSpins,
  };
}