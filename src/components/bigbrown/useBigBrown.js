import { useState, useRef, useEffect, useCallback } from 'react';
import { BETS, buildGrid, clearWilds, expandWilds, evaluateWins, freeSpinsForScatters, WILD_REELS, bonusPopCost } from '@/lib/bigBrownEngine';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import { savePendingRound, clearPendingRound, usePendingRoundRecovery } from '@/lib/pendingRound';
import { playReelDropSound } from '@/lib/bigBrownSound';

export function useBigBrown() {
  const [grid, setGrid] = useState(() => buildGrid());
  const { balance, setBalance, reset: resetBalance } = useCasinoBalance();
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
  const [turbo, setTurbo] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [stoppedReels, setStoppedReels] = useState(new Set([0, 1, 2, 3, 4, 5]));
  const [anticipation, setAnticipation] = useState(false);

  const settings = useGameSettings('big-brown');
  const logActivity = useLogActivity();
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
  useEffect(() => { rtpRef.current = settings.rtp; }, [settings.rtp]);
  const minBet = settings.minBet || 0.10;
  const maxBet = settings.maxBet || 500;

  const timers = useRef([]);
  const lastBonusPurchase = useRef(null); // { cost, games } when banner came from Bonus Pop

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
    const totalWin = wins.reduce((sum, w) => sum + w.pay, 0) + scatterWin;

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

    setExpandedReels(expReels);
    // Build the display grid: only wild reels that are part of a win expand
    // to a full wild column; other reels keep their original landed symbols.
    const displayGrid = finalGrid.map((reel, ri) => expReels.has(ri) ? expanded[ri] : reel);
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

    if (totalWin > 0) {
      setBalance(b => b + totalWin);
      setLastWin(totalWin);
      setWinningPositions(wpos);
      setMessage(`WIN ${totalWin.toFixed(2)}`);
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
    logActivity('big-brown', bet, totalWin, totalWin > 0 ? 'win' : 'loss');
  }, [bet, setBalance, logActivity]);

  const spin = useCallback(() => {
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
    if (!usingFree) setBalance(b => b - bet);
    if (usingFree) setFreeSpins(f => f - 1);
    setMessage('Spinning...');

    let finalGrid = buildGrid();

    // RTP bias: force a win or a clean loss (reduced for Big Brown).
    const wantWin = Math.random() < (rtpRef.current / 100) * 0.12;
    if (wantWin) {
      // Clear any natural wilds first so at most one wild exists on the board,
      // then place matching symbols on reels 0 & 2 and a single wild on either
      // reel 1 or reel 2 for a guaranteed 3-of-a-kind. This distributes forced
      // wilds across lines 2 & 3 instead of always dropping them on reel 1.
      // Wilds on reels 3 & 4 (lines 4 & 5) come from the natural WILD_CHANCE.
      finalGrid = clearWilds(finalGrid);
      const sym = 'A';
      finalGrid[0][0] = sym;
      finalGrid[2][0] = sym;
      const wildReel = Math.random() < 0.5 ? 1 : 2;
      finalGrid[wildReel][Math.floor(Math.random() * 4)] = 'brown';
    } else {
      let attempts = 0;
      while (attempts < 6 && evaluateWins(expandWilds(finalGrid), bet).wins.length > 0) {
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
      setBalance(b => b + cost);
      setFreeSpins(f => Math.max(0, f - games));
      lastBonusPurchase.current = null;
      setMessage('Bonus cancelled — refunded');
    } else {
      setFreeSpins(f => Math.max(0, f - awardedFreeSpins));
      setMessage('Free games cancelled');
    }
    setShowFreeSpinStart(false);
  }, [awardedFreeSpins, setBalance]);

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
    setMessage('Balance reset');
  };

  return {
    grid, balance, bet, spinning, stoppedReels,
    lastWin, message, winningPositions, expandedReels, scatterPositions,
    freeSpins, turbo, autoSpin,
    showFreeSpinStart, freeSpinsActive, startFreeSpins, awardedFreeSpins,
    cancelFreeSpinStart,
    anticipation,
    spin, setBet, setCustomBet, minBet, maxBet, setTurbo, setAutoSpin, reset,
    bonusCost, bonusCosts, buyBonus,
  };
}