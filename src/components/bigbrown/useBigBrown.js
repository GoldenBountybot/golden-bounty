import { useState, useRef, useEffect, useCallback } from 'react';
import { BETS, buildGrid, clearWilds, expandWilds, evaluateWins, freeSpinsForScatters, WILD_REELS, bonusPopCost } from '@/lib/bigBrownEngine';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';

import { savePendingRound, clearPendingRound, usePendingRoundRecovery } from '@/lib/pendingRound';
import { playReelDropSound, playScatterDropSound, playLowValueWinSound, playHighValueWinSound } from '@/lib/bigBrownSound';
import { SYMBOLS } from '@/lib/bigBrownEngine';

export function useBigBrown() {
  const [grid, setGrid] = useState(() => buildGrid());
  const { balance, setBalance, reset: resetBalance, beginRound, settleBet, addRealBalance } = useCasinoBalance();
  const [bet, setBet] = useState(0.10);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [message, setMessage] = useState('4096 WAYS · BIG BROWN');
  const [winningPositions, setWinningPositions] = useState(new Set());
  const [expandedReels, setExpandedReels] = useState(new Set());
  const [scatterPositions, setScatterPositions] = useState(new Set());
  const [freeSpins, setFreeSpins] = useState(0);
  const [showFreeSpinStart, setShowFreeSpinStart] = useState(false);
  const [freeSpinsActive, setFreeSpinsActive] = useState(false);
  const [awardedFreeSpins, setAwardedFreeSpins] = useState(8);
  const [freeSpinTotalWin, setFreeSpinTotalWin] = useState(0);
  const [showSuperWin, setShowSuperWin] = useState(false);
  const [superWinAmount, setSuperWinAmount] = useState(0);
  const [turbo, setTurbo] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [stoppedReels, setStoppedReels] = useState(new Set([0, 1, 2, 3, 4, 5]));
  const [anticipation, setAnticipation] = useState(false);

  const settings = useGameSettings('big-brown');
  usePendingRoundRecovery('big-brown', setBalance, (state) => {
    // Restore an in-progress free spins round so the player resumes exactly
    // where they left off. The free-spins auto-trigger effect will spin the
    // next free spin automatically.
    if (state && state.freeSpinsActive && state.freeSpins > 0) {
      setFreeSpins(state.freeSpins);
      setFreeSpinsActive(true);
      setMessage(`FREE GAMES RESUMED · ${state.freeSpins} LEFT`);
    }
  });
  const rtpRef = useRef(50);
  const serverWinRef = useRef(0);
  useEffect(() => { rtpRef.current = settings.rtp; }, [settings.rtp]);
  const minBet = settings.minBet || 0.10;
  const maxBet = settings.maxBet || 500;

  const timers = useRef([]);
  const lastBonusPurchase = useRef(null); // { cost, games } when banner came from Bonus Pop
  const settlePromiseRef = useRef(null); // pending settleBet — awaited in spin() before the next beginRound

  // Clamp a custom bet amount to the allowed min/max and round to 2 decimals.
  const setCustomBet = useCallback((amount) => {
    const n = Math.max(minBet, Math.min(maxBet, Number(amount) || minBet));
    setBet(Math.round(n * 100) / 100);
  }, [minBet, maxBet]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const settle = useCallback((finalGrid, wasFree) => {
    clearPendingRound('big-brown');
    // Expand wilds (visual + evaluation).
    const expanded = expandWilds(finalGrid);

    // Scatter positions (on original grid, before expansion replaces them).
    const scPos = new Set();
    finalGrid.forEach((reel, ri) => reel.forEach((s, row) => { if (s === 'scatter') scPos.add(`${ri}-${row}`); }));

    const { wins, scatterCount, scatterWin } = evaluateWins(expanded, bet);
    // Symbol-value-based payout: the win comes from the paytable (actual
    // symbols on the grid), not the server's pre-decided amount. The server
    // still controls win/loss via the cap (cap mode) — if the server decided
    // a loss, the cap is 0 and settleBet credits min(paytableWin, 0) = 0.
    const totalWin = Math.round((wins.reduce((s, w) => s + w.pay, 0) + scatterWin) * 100) / 100;

    // Only expand wild reels that are part of a winning way. A wild on reel ri
    // is part of a win only when ri falls within the consecutive winning range
    // (0..maxReels-1) of at least one winning combination.
    const maxReels = wins.reduce((m, w) => Math.max(m, w.reels), 0);
    const expReels = new Set();
    expanded.forEach((reel, ri) => {
      if (WILD_REELS.has(ri) && (finalGrid[ri].includes('brown') || finalGrid[ri].includes('spirit')) && ri < maxReels) {
        expReels.add(ri);
      }
    });

    // Only expand wild reels when the server decided a win — a server loss
    // must not show the expanding wild animation (visual must match the 0 credit).
    const hasWin = totalWin > 0;
    setExpandedReels(hasWin ? expReels : new Set());
    const displayGrid = hasWin
      ? finalGrid.map((reel, ri) => expReels.has(ri) ? expanded[ri] : reel)
      : finalGrid;
    setGrid(displayGrid);
    setScatterPositions(scPos);

    const wpos = new Set();
    wins.forEach(w => {
      for (let r = 0; r < w.reels; r++) {
        expanded[r].forEach((s, row) => {
          if (s === w.symbol || s === 'brown' || s === 'spirit') wpos.add(`${r}-${row}`);
        });
      }
    });

    settlePromiseRef.current = settleBet(bet, totalWin, 'big-brown', wasFree);
    settlePromiseRef.current.then(() => { settlePromiseRef.current = null; }).catch(() => {});
    if (totalWin > 0) {
      setLastWin(totalWin);
      setWinningPositions(wpos);
      setMessage(`WIN ${totalWin.toFixed(2)}`);
      // Accumulate free-spin winnings for the Super Win banner.
      if (wasFree) setFreeSpinTotalWin(t => t + totalWin);
      // Play the user-supplied BigBrown sample when the win includes any
      // low-value card symbol (A, K, Q, J, 10, 9).
      const hasLowWin = wins.some(w => SYMBOLS[w.symbol] && SYMBOLS[w.symbol].type === 'low');
      if (hasLowWin) playLowValueWinSound();
      // High-value / mid-value animal win → play the user-supplied bgbn_0
      // sample, plus a distinct synthesized roar/call for each animal that
      // matched (wolf howl, buffalo growl, eagle screech, cougar snarl, deer
      // grunt) so the player hears the beast that lined up.
      const animalWins = wins.filter(w => {
        const ty = SYMBOLS[w.symbol] && SYMBOLS[w.symbol].type;
        return ty === 'high' || ty === 'mid';
      });
      if (animalWins.length > 0) {
        playHighValueWinSound();
      }
    } else {
      setLastWin(0);
      setMessage(wasFree ? 'FREE SPIN · NO WIN' : '4096 WAYS · BIG BROWN');
    }

    // Free spins trigger.
    if (scatterCount >= 3) {
      const award = freeSpinsForScatters(scatterCount);
      setAwardedFreeSpins(award);
      setFreeSpins(f => f + award);
      if (!wasFree) setShowFreeSpinStart(true);
      setMessage(`${scatterCount} SCATTERS · +${award} FREE GAMES`);
    }

    setSpinning(false);
    // PlayerActivity is logged authoritatively by the backend settleBet
    // function — logging here too double-records each round in history.
  }, [bet, setBalance, settleBet]);

  const spin = useCallback(async () => {
    if (spinning) return;
    const usingFree = freeSpins > 0;
    if (!usingFree && balance < bet) {
      setMessage('Insufficient balance! Reset');
      return;
    }
    timers.current.forEach(clearTimeout);
    timers.current = [];

    setSpinning(true);
    setStoppedReels(new Set());
    setWinningPositions(new Set());
    setExpandedReels(new Set());
    setScatterPositions(new Set());
    setLastWin(0);
    setAnticipation(false);
    // Wait for any pending settleBet from the previous round to complete
    // before starting a new beginRound — prevents the race where the next
    // beginRound's server deduction overlaps the previous settleBet's
    // response, double-deducting the bet and making wins appear uncredited.
    if (settlePromiseRef.current) {
      await settlePromiseRef.current;
      settlePromiseRef.current = null;
    }
    const _serverRoundPromise = beginRound(bet, 'big-brown', usingFree);
    if (usingFree) setFreeSpins(f => f - 1);
    setMessage('Spinning...');

    // Wait for the server's pre-decided outcome before generating the grid.
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

    let finalGrid = buildGrid();

    // Use the server's win decision (from beginRound) — NOT Math.random().
    // The server decides win/loss; the grid generates naturally and the
    // paytable determines the payout amount.
    const wantWin = serverWinRef.current > 0;
    if (wantWin) {
      // Generate naturally; if no winning combination appears, retry a few
      // times. If still no win, place a natural-looking 3-of-a-kind using
      // a random symbol (not always 'A') so the win feels organic.
      let attempts = 0;
      while (attempts < 10 && evaluateWins(expandWilds(finalGrid), bet).wins.length === 0) {
        finalGrid = buildGrid();
        attempts++;
      }
      if (evaluateWins(expandWilds(finalGrid), bet).wins.length === 0) {
        finalGrid = clearWilds(finalGrid);
        const winSyms = ['A', 'K', 'Q', 'J', '10', '9', 'deer', 'wolf', 'cougar', 'eagle', 'buffalo'];
        const sym = winSyms[Math.floor(Math.random() * winSyms.length)];
        finalGrid[0][Math.floor(Math.random() * 4)] = sym;
        finalGrid[1][Math.floor(Math.random() * 4)] = sym;
        finalGrid[2][Math.floor(Math.random() * 4)] = sym;
      }
    } else {
      let attempts = 0;
      while (attempts < 10 && evaluateWins(expandWilds(finalGrid), bet).wins.length > 0) {
        finalGrid = buildGrid();
        attempts++;
      }
    }

    // In free spins, guarantee a single expanding wild on one of reels 2-5,
    // and slightly boost the chance of matching symbols so the wild more often
    // completes a winning way.
    if (usingFree) {
      finalGrid = clearWilds(finalGrid);
      const wr = 1 + Math.floor(Math.random() * 4);
      finalGrid[wr][Math.floor(Math.random() * 4)] = Math.random() < 0.25 ? 'spirit' : 'brown';
      // ~30% chance to seed matching symbols on reels before the wild so the
      // guaranteed wild lands into a 3+ of-a-kind way.
      if (wr >= 2 && Math.random() < 0.15) {
        const sym = ['A', 'K', 'Q', 'J', '10'][Math.floor(Math.random() * 5)];
        finalGrid[0][Math.floor(Math.random() * 4)] = sym;
        finalGrid[1][Math.floor(Math.random() * 4)] = sym;
      }
    }

    // Persist the already-determined outcome so a mid-spin exit can be
    // recovered (win credited) on return. Cleared at settle.
    const _expanded = expandWilds(finalGrid);
    const _ev = evaluateWins(_expanded, bet);
    const _totalWin = _ev.wins.reduce((s, w) => s + w.pay, 0) + _ev.scatterWin;
    savePendingRound('big-brown', {
      win: _totalWin,
      bet,
      state: {
        freeSpins: usingFree ? Math.max(0, freeSpins - 1) : 0,
        freeSpinsActive: usingFree,
      },
    });

    const baseGap = turbo ? 300 : 460;
    const slowGap = turbo ? 850 : 1200;

    let stoppedScatter = 0;
    const stopReel = (i, slow) => {
      const t = setTimeout(() => {
        setGrid(prev => {
          const next = [...prev];
          next[i] = finalGrid[i];
          return next;
        });
        setStoppedReels(prev => new Set([...prev, i]));
        playReelDropSound(i);
        const scattersInReel = finalGrid[i].filter(s => s === 'scatter').length;
        if (scattersInReel > 0) playScatterDropSound();
        stoppedScatter += scattersInReel;
        if (stoppedScatter >= 2 && i < 5) {
          if (!slow) { setAnticipation(true); }
          stopReel(i + 1, true);
          return;
        }
        if (i < 5) {
          stopReel(i + 1, false);
        } else {
          settle(finalGrid, usingFree);
        }
      }, slow ? slowGap : baseGap);
      timers.current.push(t);
    };
    stopReel(0, false);
  }, [spinning, balance, bet, freeSpins, turbo, settle]);

  // auto spin
  useEffect(() => {
    if (autoSpin && !spinning && balance >= bet) {
      const t = setTimeout(() => spin(), turbo ? 250 : 650);
      return () => clearTimeout(t);
    }
    if (autoSpin && balance < bet) setAutoSpin(false);
  }, [autoSpin, spinning, balance, bet, turbo, spin]);

  // free spins auto trigger
  useEffect(() => {
    if (freeSpinsActive && !spinning && freeSpins > 0 && !showFreeSpinStart) {
      const t = setTimeout(() => spin(), turbo ? 350 : 750);
      return () => clearTimeout(t);
    }
    if (freeSpinsActive && freeSpins === 0) {
      setFreeSpinsActive(false);
      setMessage('FREE GAMES ENDED!');
      // Show the Super Win banner when the total free-spin winnings reach a
      // decent amount (at least 3× the bet). Otherwise just reset the counter.
      setFreeSpinTotalWin((total) => {
        if (total >= bet * 3) {
          setSuperWinAmount(total);
          setShowSuperWin(true);
        }
        return 0;
      });
    }
  }, [freeSpinsActive, spinning, freeSpins, showFreeSpinStart, turbo, spin]);

  const startFreeSpins = useCallback(() => {
    setShowFreeSpinStart(false);
    setFreeSpinsActive(true);
    lastBonusPurchase.current = null;
    spin();
  }, [spin]);

  // Cancel the FreeSpinStart banner without playing — refunds Bonus Pop cost,
  // or simply forfeits the scatter-awarded free spins.
  const cancelFreeSpinStart = useCallback(() => {
    if (lastBonusPurchase.current) {
      const { cost, games } = lastBonusPurchase.current;
      addRealBalance(cost);
      setFreeSpins(f => Math.max(0, f - games));
      lastBonusPurchase.current = null;
      setMessage('Bonus cancelled — refunded');
    } else {
      setFreeSpins(f => Math.max(0, f - awardedFreeSpins));
      setMessage('Free games cancelled');
    }
    setShowFreeSpinStart(false);
  }, [awardedFreeSpins, setBalance, addRealBalance]);

  const bonusCosts = {
    8: bonusPopCost(bet, 8),
    12: bonusPopCost(bet, 12),
    16: bonusPopCost(bet, 16),
    24: bonusPopCost(bet, 24),
  };
  const bonusCost = bonusCosts[8];

  const buyBonus = useCallback((games = 8) => {
    const cost = bonusPopCost(bet, games);
    if (spinning || showFreeSpinStart) return;
    if (freeSpins > 0) return;
    if (balance < cost) {
      setMessage('Insufficient balance for Bonus Pop');
      return;
    }
    setBalance(b => b - cost);
    setAwardedFreeSpins(games);
    setFreeSpins(games);
    lastBonusPurchase.current = { cost, games };
    setShowFreeSpinStart(true);
    setMessage(`BONUS POP · ${games} FREE GAMES`);
  }, [spinning, showFreeSpinStart, freeSpins, balance, bet, setBalance]);

  const reset = () => {
    resetBalance();
    setLastWin(0);
    setFreeSpins(0);
    setFreeSpinsActive(false);
    setShowFreeSpinStart(false);
    setFreeSpinTotalWin(0);
    setShowSuperWin(false);
    setMessage('Balance reset');
  };

  return {
    grid, balance, bet, spinning, stoppedReels,
    lastWin, message, winningPositions, expandedReels, scatterPositions,
    freeSpins, turbo, autoSpin,
    showFreeSpinStart, freeSpinsActive, startFreeSpins, awardedFreeSpins,
    cancelFreeSpinStart,
    showSuperWin, superWinAmount, setShowSuperWin,
    anticipation,
    spin, setBet, setCustomBet, minBet, maxBet, setTurbo, setAutoSpin, reset,
    bonusCost, bonusCosts, buyBonus,
  };
}