import { useState, useRef, useEffect, useCallback } from 'react';
import { REEL_ROWS, buildReel, evaluateWins, MULTIPLIERS, BETS, randomSymbol, SYMBOLS } from './symbols';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import { savePendingRound, clearPendingRound, usePendingRoundRecovery } from '@/lib/pendingRound';
import { sfx } from './sounds';

// Preload the uploaded spin sound so it's ready on first spin.
sfx.preload && sfx.preload();

export function useWildBounty() {
  const [grid, setGrid] = useState(() => REEL_ROWS.map(r => buildReel(r)));
  const { balance, setBalance, reset: resetBalance } = useCasinoBalance();
  const [betIndex, setBetIndex] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [multIndex, setMultIndex] = useState(0);
  const [lastWin, setLastWin] = useState(0);
  const [message, setMessage] = useState('WIN UP TO 3600 WAYS!');
  const [winningPositions, setWinningPositions] = useState(new Set());
  const [goldFrames, setGoldFrames] = useState(new Set());
  const [freeSpins, setFreeSpins] = useState(0);
  const [scatterCount, setScatterCount] = useState(0);
  const [turbo, setTurbo] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [stoppedReels, setStoppedReels] = useState(new Set([0, 1, 2, 3, 4, 5]));
  const [shattering, setShattering] = useState(new Set());
  const [cascading, setCascading] = useState(false);
  const [cascadePositions, setCascadePositions] = useState(new Set());
  const [cascadeSlow, setCascadeSlow] = useState(1);
  const [showFreeSpinStart, setShowFreeSpinStart] = useState(false);
  const [freeSpinsActive, setFreeSpinsActive] = useState(false);
  const [anticipation, setAnticipation] = useState(false);
  const [scatterGlow, setScatterGlow] = useState(new Set());
  const [flyingMult, setFlyingMult] = useState(null);
  const [bulletHit, setBulletHit] = useState(new Set());

  const settings = useGameSettings('wild-bounty');
  const logActivity = useLogActivity();
  usePendingRoundRecovery('wild-bounty', setBalance, (state) => {
    if (state && state.freeSpinsActive && state.freeSpins > 0) {
      setFreeSpins(state.freeSpins);
      setFreeSpinsActive(true);
      setMultIndex(3);
      setMessage(`FREE SPINS RESUMED · ${state.freeSpins} LEFT`);
    }
  });
  const rtpRef = useRef(50);
  useEffect(() => { rtpRef.current = settings.rtp; }, [settings.rtp]);

  const timers = useRef([]);
  const pendingStateRef = useRef(null);
  const bet = BETS[betIndex];

  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current.forEach(clearInterval); }, []);

  const assignGoldFrames = (newGrid) => {
    // Golden frames only appear on the two center reels (indices 2 & 3),
    // on the middle two lines (rows 2 & 3).
    const frames = new Set();
    newGrid.forEach((reel, ri) => {
      if (ri !== 2 && ri !== 3) return;
      reel.forEach((sym, row) => {
        if ((row === 2 || row === 3) && sym !== 'scatter' && Math.random() < 0.5) frames.add(`${ri}-${row}`);
      });
    });
    return frames;
  };

  // Remove winning symbols from each reel; remaining symbols fall to the
  // bottom and new random symbols drop in at the top (tumble mechanic).
  // Replace only the winning (blasted) positions with new symbols;
  // all other symbols stay exactly where they were.
  const cascadeStep = (currentGrid, removePositions) => {
    // Avoid matching reel 0's landed symbols when dropping new symbols on reels
    // 1+ so contiguous-from-left cascade wins (multiplier chain) form less often.
    const reel0Syms = new Set(currentGrid[0].filter(s => s && s !== 'scatter' && s !== 'wild'));
    const baseIds = Object.values(SYMBOLS).filter(s => s.type !== 'scatter' && s.type !== 'wild').map(s => s.id);
    return currentGrid.map((reel, ri) => {
      return reel.map((sym, row) => {
        if (!removePositions.has(`${ri}-${row}`)) return sym;
        if (ri > 0 && reel0Syms.size > 0 && Math.random() < 0.65) {
          const choices = baseIds.filter(id => !reel0Syms.has(id));
          if (choices.length) return choices[Math.floor(Math.random() * choices.length)];
        }
        return randomSymbol();
      });
    });
  };

  // Evaluate wins, shatter winners, cascade new symbols, repeat until no win.
  const evaluateAndCascade = (currentGrid, cascadeCount, totalWin, currentMultIndex, wasFree, scatterAwarded = false, framedPositions = new Set()) => {
    const { wins, scatterCount: sc } = evaluateWins(currentGrid, bet);
    const multiplier = MULTIPLIERS[currentMultIndex];
    const stepWin = wins.reduce((sum, w) => sum + w.pay, 0) * multiplier;

    const wpos = new Set();
    wins.forEach(w => {
      for (let r = 0; r < w.reels; r++) {
        currentGrid[r].forEach((sym, row) => {
          if (sym === w.symbol || sym === 'wild') wpos.add(`${r}-${row}`);
        });
      }
    });

    // Scatter check runs on every cascade (not just the first) — 3+ scatters
    // anywhere during the round award 10 free spins, but only once per round.
    setScatterCount(sc);
    let awarded = scatterAwarded;
    let justAwarded = false;
    if (sc >= 3 && !scatterAwarded) {
      setFreeSpins(f => f + 10);
      // First trigger shows the START screen; retrigger during free spins
      // just adds the spins and keeps the round going.
      if (!wasFree) setShowFreeSpinStart(true);
      awarded = true;
      justAwarded = true;
    }

    if (stepWin > 0) {
      const slow = cascadeCount >= 1 ? 1.6 : 1.2;
      setCascadeSlow(slow);
      sfx.win(cascadeCount);
      const newTotal = totalWin + stepWin;
      const newMult = Math.min(currentMultIndex + 1, MULTIPLIERS.length - 1);

      // Wild conversion: a 4/5+ of-a-kind turns the matching symbol on the
      // last matched reel into a wild (which persists through the cascade).
      // Cap at max 3 wilds per reel (including any already-landed wilds).
      const existingWilds = {};
      currentGrid.forEach((reel, ri) => { existingWilds[ri] = reel.filter(s => s === 'wild').length; });
      const convertByReel = {};
      wins.forEach(w => {
        if (w.reels >= 3) {
          // Wild lands only on reels 3 & 4 (indices 2 & 3), and only on
          // symbols sitting in a framed cell.
          const tr = Math.min(w.reels - 1, 3);
          if (!convertByReel[tr]) convertByReel[tr] = [];
          currentGrid[tr].forEach((s, row) => {
            const key = `${tr}-${row}`;
            if (s === w.symbol && !convertByReel[tr].includes(key) && framedPositions.has(key)) convertByReel[tr].push(key);
          });
        }
      });
      const convertSet = new Set();
      Object.entries(convertByReel).forEach(([tr, keys]) => {
        const room = Math.max(0, 3 - (existingWilds[tr] || 0));
        keys.slice(0, room).forEach(k => convertSet.add(k));
      });
      let gridForCascade = currentGrid;
      if (convertSet.size) {
        gridForCascade = currentGrid.map(reel => [...reel]);
        convertSet.forEach(pos => { const [r, row] = pos.split('-').map(Number); gridForCascade[r][row] = 'wild'; });
        setGrid(gridForCascade);
        setScatterGlow(prev => new Set([...prev, ...convertSet]));
      }
      // Converted wilds persist — shatter only the remaining winning positions
      const shatterPos = new Set([...wpos].filter(p => !convertSet.has(p)));

      setWinningPositions(wpos);
      // Credit the whole round at the end (see chain-end branch), not per
      // cascade, so a mid-cascade exit can be recovered exactly.
      savePendingRound('wild-bounty', { win: newTotal, bet, state: pendingStateRef.current });
      setLastWin(newTotal);
      setMultIndex(newMult);
      setFlyingMult({ value: MULTIPLIERS[newMult], key: Date.now(), slow: cascadeCount >= 1 ? 1.6 : 1.2 });
      setMessage(justAwarded ? `WIN ${newTotal.toFixed(2)} · +10 FREE SPINS` : `WIN ${newTotal.toFixed(2)}`);

      // From the second cascade, run everything in a slight slow motion so the
      // shatter/drop animation lines up with the (also slowed) win sound.
      // Hold matched (popped) symbols big so the bullet-hole impacts land,
      // then blast them directly.
      const holdMs = cascadeCount >= 1 ? 1500 : 1300;
      const shatterT = setTimeout(() => { setShattering(shatterPos); }, holdMs);
      timers.current.push(shatterT);

      // Cascade: drop new symbols, then re-evaluate
      const cascadeT = setTimeout(() => {
        const newGrid = cascadeStep(gridForCascade, shatterPos);
        setShattering(new Set());
        // Keep persistent wild symbols highlighted across cascades so their
        // light burst stays on smoothly instead of flickering off/on.
        setWinningPositions(new Set([...wpos].filter(p => !shatterPos.has(p))));
        // A shattered framed symbol carries its frame away with it — new
        // symbols tumbling into those cells don't inherit the frame.
        setGoldFrames(prev => new Set([...prev].filter(p => !shatterPos.has(p))));
        setGrid(newGrid);
        setCascading(true);
        setCascadePositions(shatterPos);

        const evalT = setTimeout(() => {
          setCascading(false);
          setCascadePositions(new Set());
          evaluateAndCascade(newGrid, cascadeCount + 1, newTotal, newMult, wasFree, awarded, framedPositions);
        }, 450 * slow);
        timers.current.push(evalT);
      }, 1000 * slow);
      timers.current.push(cascadeT);
    } else {
      // No more wins — end the chain. Credit the accumulated round total now
      // (cascades only displayed running totals before this) and clear the
      // pending round so recovery never double-pays.
      sfx.winStop();
      setCascadeSlow(1);
      setWinningPositions(new Set());
      if (totalWin > 0) setBalance(b => b + totalWin);
      clearPendingRound('wild-bounty');
      pendingStateRef.current = null;
      if (cascadeCount === 0) { setLastWin(0); sfx.loss(); }
      if (!wasFree) setMultIndex(0);
      if (awarded) {
        setMessage(wasFree ? 'RETRIGGER! +10 FREE SPINS' : '3+ SCATTER! 10 FREE SPINS');
      } else if (cascadeCount === 0) {
        setMessage(sc === 2 ? 'ONE MORE SCATTER!' : 'WIN UP TO 3600 WAYS!');
      }
      setSpinning(false);
      logActivity('wild-bounty', bet, totalWin, totalWin > 0 ? 'win' : 'loss');
    }
  };

  const settle = (finalGrid, frames, wasFree) => {
    setAnticipation(false);
    sfx.stopSpin();
    // Free spins always evaluate from 8x; normal spins from 1x.
    evaluateAndCascade(finalGrid, 0, 0, wasFree ? 3 : 0, wasFree, false, frames);
  };

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
    sfx.winStop();
    sfx.spin();
    setStoppedReels(new Set());
    setWinningPositions(new Set());
    setGoldFrames(new Set());
    setShattering(new Set());
    setCascading(false);
    setLastWin(0);
    setCascadeSlow(1);
    setAnticipation(false);
    setScatterGlow(new Set());
    setFlyingMult(null);
    setBulletHit(new Set());
    if (!usingFree) setBalance(b => b - bet);
    if (usingFree) setFreeSpins(f => f - 1);
    // Each free spin (re)starts at 8x; normal spins start at 1x.
    setMultIndex(usingFree ? 3 : 0);
    // Snapshot the free-spins round state for recovery; the running win is
    // updated each cascade and the whole total is credited at chain end.
    pendingStateRef.current = { freeSpins: usingFree ? Math.max(0, freeSpins - 1) : 0, freeSpinsActive: usingFree };
    savePendingRound('wild-bounty', { win: 0, bet, state: pendingStateRef.current });
    setMessage('Spinning...');

    let finalGrid = REEL_ROWS.map(r => buildReel(r));
    // RTP bias: decide win/loss for the spin before evaluation.
    // Higher bias factor so forced matching-symbol wins land more often.
    const wantWin = Math.random() < (rtpRef.current / 100) * 0.5;
    if (wantWin) {
      const X = 'A';
      finalGrid = finalGrid.map((reel, ri) => {
        if (ri < 3 && !reel.includes(X)) {
          const copy = [...reel];
          copy[Math.floor(Math.random() * copy.length)] = X;
          return copy;
        }
        return reel;
      });
    } else {
      // Only suppress natural wins briefly so matches still happen often.
      let attempts = 0;
      while (attempts < 2 && evaluateWins(finalGrid, bet).wins.length > 0) {
        finalGrid = REEL_ROWS.map(r => buildReel(r));
        attempts++;
      }
    }

    // Scatter distribution per spin: 1 = 10%, 2 = 5%, 3 = 0.003%, else 0.
    finalGrid = finalGrid.map(reel => [...reel]);
    const nonScatter = () => { let s = randomSymbol(); while (s === 'scatter') s = randomSymbol(); return s; };
    // Remove any natural scatters so we control the exact count.
    finalGrid.forEach(reel => { for (let i = 0; i < reel.length; i++) if (reel[i] === 'scatter') reel[i] = nonScatter(); });
    const roll = Math.random();
    let targetScatters = 0;
    if (roll < 0.00003) targetScatters = 3;            // 0.003%
    else if (roll < 0.05003) targetScatters = 2;       // 5%
    else if (roll < 0.15003) targetScatters = 1;       // 10%
    const cells = [];
    finalGrid.forEach((reel, ri) => reel.forEach((_, row) => cells.push([ri, row])));
    for (let i = 0; i < targetScatters && cells.length; i++) {
      const idx = Math.floor(Math.random() * cells.length);
      const [ri, row] = cells.splice(idx, 1)[0];
      finalGrid[ri][row] = 'scatter';
    }

    const frames = assignGoldFrames(finalGrid);
    // Pre-load the frame layout so each frame appears the instant its reel
    // stops (dropping in with the symbol), instead of popping in after every
    // reel has landed.
    setGoldFrames(frames);
    const baseGap = turbo ? 130 : 230;
    const slowGap = turbo ? 900 : 1500; // slow-motion anticipation for remaining reels

    let stoppedScatter = 0;
    const stopReel = (i, slow) => {
      const t = setTimeout(() => {
        setGrid(prev => {
          const next = [...prev];
          next[i] = finalGrid[i];
          return next;
        });
        setStoppedReels(prev => new Set([...prev, i]));
        const scattersInReel = finalGrid[i].filter(s => s === 'scatter').length;
        stoppedScatter += scattersInReel;
        // Play the scatter sting once for each scatter that landed on this reel.
        for (let s = 0; s < scattersInReel; s++) {
          const sndT = setTimeout(() => sfx.scatter(), s * 160);
          timers.current.push(sndT);
          // Bullet-hole impact synced to the gunshot inside the scatter sting.
          const hitT = setTimeout(() => {
            setBulletHit(() => {
              const all = new Set();
              for (let ri = 0; ri < finalGrid.length; ri++) {
                for (let row = 0; row < finalGrid[ri].length; row++) {
                  const sym = finalGrid[ri][row];
                  if (sym !== 'scatter' && sym !== 'wild') all.add(`${ri}-${row}`);
                }
              }
              return all;
            });
          }, s * 160 + 250);
          timers.current.push(hitT);
        }
        // Light up any landed wild & scatter symbols with a golden beam
        const glow = new Set();
        for (let r = 0; r <= i; r++) {
          finalGrid[r].forEach((s, row) => { if (s === 'scatter' || s === 'wild') glow.add(`${r}-${row}`); });
        }
        setScatterGlow(glow);
        if (stoppedScatter >= 2) {
          // 2 scatters landed — slow the remaining reels + golden side glow
          if (i < 5) {
            if (!slow) { setAnticipation(true); sfx.anticipation(); }
            stopReel(i + 1, true);
            return;
          }
        }
        if (i < 5) {
          stopReel(i + 1, false);
        } else {
          settle(finalGrid, frames, usingFree);
        }
      }, slow ? slowGap : baseGap);
      timers.current.push(t);
    };
    stopReel(0, false);
  }, [spinning, balance, bet, freeSpins, turbo, multIndex]);

  // auto spin
  useEffect(() => {
    if (autoSpin && !spinning && balance >= bet) {
      const t = setTimeout(() => spin(), turbo ? 300 : 700);
      return () => clearTimeout(t);
    }
    if (autoSpin && balance < bet) setAutoSpin(false);
  }, [autoSpin, spinning, balance, bet, turbo, spin]);

  // free spins auto trigger
  useEffect(() => {
    if (freeSpinsActive && !spinning && freeSpins > 0 && !showFreeSpinStart) {
      const t = setTimeout(() => spin(), turbo ? 400 : 800);
      return () => clearTimeout(t);
    }
    if (freeSpinsActive && freeSpins === 0) {
      setFreeSpinsActive(false);
      setMessage('FREE SPINS ENDED!');
    }
  }, [freeSpinsActive, spinning, freeSpins, showFreeSpinStart, turbo, spin]);

  const clearFlyingMult = useCallback(() => setFlyingMult(null), []);

  // FEATURE BUY — instantly award 10 free spins and show the start banner.
  const buyFeature = useCallback(() => {
    if (spinning || showFreeSpinStart) return;
    setFreeSpins(10);
    setShowFreeSpinStart(true);
    setMessage('FEATURE BUY · 10 FREE SPINS');
  }, [spinning, showFreeSpinStart]);

  const startFreeSpins = useCallback(() => {
    setShowFreeSpinStart(false);
    setFreeSpinsActive(true);
    setMultIndex(3); // 8x — free spins start here
    spin();
  }, [spin]);

  const reset = () => {
    resetBalance();
    setMultIndex(0);
    setLastWin(0);
    setFreeSpins(0);
    setFreeSpinsActive(false);
    setShowFreeSpinStart(false);
    setMessage('Balance reset');
  };

  return {
    grid, balance, bet, betIndex, spinning, stoppedReels,
    multiplier: MULTIPLIERS[multIndex], multIndex,
    lastWin, message, winningPositions, goldFrames, shattering, cascading, cascadePositions,
    freeSpins, scatterCount, turbo, autoSpin,
    showFreeSpinStart, freeSpinsActive, startFreeSpins, buyFeature,
    anticipation, scatterGlow,
    cascadeSlow,
    bulletHit,
    flyingMult, clearFlyingMult,
    spin, setBetIndex, setTurbo, setAutoSpin, reset,
  };
}