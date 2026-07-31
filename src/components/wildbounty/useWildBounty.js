import { useState, useRef, useEffect, useCallback } from 'react';
import { REEL_ROWS, buildReel, evaluateWins, MULTIPLIERS, randomSymbol } from './symbols';
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
  const [bet, setBet] = useState(0.10);
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
  const [showFeatureBuyConfirm, setShowFeatureBuyConfirm] = useState(false);
  const [freeSpinsActive, setFreeSpinsActive] = useState(false);
  const [anticipation, setAnticipation] = useState(false);
  const [scatterGlow, setScatterGlow] = useState(new Set());
  const [flyingMult, setFlyingMult] = useState(null);
  const [bulletHit, setBulletHit] = useState(new Set());
  const [superWin, setSuperWin] = useState(null); // { amount, multiplier }
  const [megaWin, setMegaWin] = useState(null);   // { amount, multiplier }
  const [freeSpinsEndWin, setFreeSpinsEndWin] = useState(null); // total win after 10 free spins
  const peakMultRef = useRef(1); // highest multiplier applied to a winning cascade this round
  const freeSpinsTotalRef = useRef(0); // accumulated win across the current free-spins round
  const freeSpinsCountRef = useRef(0); // remaining free spins (synced ref for chain-end checks)
  const pendingWinRef = useRef(0); // win amount waiting to be revealed when the flying multiplier lands on the banner
  const [bannerPending, setBannerPending] = useState(false); // blocks auto/free spin while a round-end banner is delayed for the flying animation

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

  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current.forEach(clearInterval); }, []);

  const assignGoldFrames = (newGrid) => {
    // Golden frames only appear on the two center reels (indices 2 & 3),
    // on the middle two lines (rows 2 & 3).
    const frames = new Set();
    newGrid.forEach((reel, ri) => {
      if (ri !== 2 && ri !== 3) return;
      reel.forEach((sym, row) => {
        if ((row === 2 || row === 3) && sym !== 'scatter' && Math.random() < 0.72) frames.add(`${ri}-${row}`);
      });
    });
    return frames;
  };

  // Target odds for the cascade chain (among winning spins). The multiplier
  // strip climbs X1→X2→X4→X8→X16→X32→X64→X128 one tier per winning cascade.
  // CONTINUE_PROB[i] = chance the NEXT cascade wins after a win paid at tier i,
  // derived from the requested cumulative reach odds:
  //   reach X2 5%, X4 3.33%, X8 1.67%, X16 0.17%, X32 0.033%, X64 0.017%, X128 0.003%.
  const CONTINUE_PROB = [0.05, 10 / 15, 0.5, 0.5 / 5, 0.1 / 0.5, 0.05 / 0.1, 0.01 / 0.05];

  // Drop new symbols into the blasted positions and rig them so the next
  // cascade either wins (chain continues toward a higher multiplier tier) or
  // loses (chain ends), hitting the target odds. Only blasted positions are
  // replaced; unchanged reels keep their array reference (React.memo skip).
  const rigCascadeGrid = (currentGrid, removePositions, forceWin) => {
    const removed = [...removePositions];
    const changedReels = new Set(removed.map(p => Number(p.split('-')[0])));
    const grid = currentGrid.map((reel, ri) => changedReels.has(ri) ? [...reel] : reel);
    const baseIds = ['bandit', 'revolver', 'whiskey', 'hat', 'A', 'K', 'Q', 'J'];
    const randBase = () => baseIds[Math.floor(Math.random() * baseIds.length)];
    removed.forEach(pos => {
      const [r, row] = pos.split('-').map(Number);
      grid[r][row] = randBase();
    });

    if (forceWin) {
      // Guarantee a 3+ contiguous-from-left win: drop the same symbol on the
      // first blasted cell of reels 0, 1 and 2 (a wild already on one of those
      // reels substitutes, so a reel with no blasted cell is fine).
      const S = randBase();
      [0, 1, 2].forEach(r => {
        const pos = removed.find(p => Number(p.split('-')[0]) === r);
        if (pos) {
          const [, row] = pos.split('-').map(Number);
          grid[r][row] = S;
        }
      });
    } else {
      // Force a non-win: break any 3-reel contiguity by swapping a blasted
      // cell on reel 2 (then 1, then 0) to a symbol different from the win.
      let guard = 0;
      while (guard++ < 12 && evaluateWins(grid, bet).wins.length > 0) {
        const wins = evaluateWins(grid, bet).wins;
        let fixed = false;
        for (const w of wins) {
          for (const targetReel of [2, 1, 0]) {
            const pos = removed.find(p => Number(p.split('-')[0]) === targetReel);
            if (pos) {
              const [, row] = pos.split('-').map(Number);
              let alt = randBase();
              while (alt === w.symbol) alt = randBase();
              grid[targetReel][row] = alt;
              fixed = true;
              break;
            }
          }
          if (fixed) break;
        }
        if (!fixed) break;
      }
    }
    return grid;
  };

  // Evaluate wins, shatter winners, cascade new symbols, repeat until no win.
  const evaluateAndCascade = (currentGrid, cascadeCount, totalWin, currentMultIndex, wasFree, scatterAwarded = false, framedPositions = new Set()) => {
    const { wins, scatterCount: sc } = evaluateWins(currentGrid, bet);
    const multiplier = MULTIPLIERS[currentMultIndex];
    const stepWin = wins.reduce((sum, w) => sum + w.pay, 0) * multiplier;
    if (stepWin > 0 && multiplier > peakMultRef.current) peakMultRef.current = multiplier;

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
      freeSpinsCountRef.current += 10;
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
          // Every framed matching symbol on reels 3 & 4 (indices 2 & 3) that is
          // part of this winning line converts to a wild.
          for (let r = 2; r <= Math.min(w.reels - 1, 3); r++) {
            if (!convertByReel[r]) convertByReel[r] = [];
            currentGrid[r].forEach((s, row) => {
              const key = `${r}-${row}`;
              if (s === w.symbol && !convertByReel[r].includes(key) && framedPositions.has(key)) convertByReel[r].push(key);
            });
          }
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
      setMultIndex(newMult);
      // Don't show the win in the banner immediately — wait for the flying
      // multiplier to land on the win banner, then the amount counts up.
      // X1 (first cascade) has no flying multiplier, so it shows after a
      // short delay instead.
      const flySlow = cascadeCount >= 1 ? 1.6 : 1.2;
      const winMsg = justAwarded ? `WIN ${newTotal.toFixed(2)} · +10 FREE SPINS` : `WIN ${newTotal.toFixed(2)}`;
      if (currentMultIndex >= 1) {
        setFlyingMult({ value: MULTIPLIERS[currentMultIndex], key: Date.now(), slow: flySlow });
        // The multiplier arrives at the banner at ~86% of the fly duration.
        pendingWinRef.current = newTotal;
        const winT = setTimeout(() => {
          setLastWin(pendingWinRef.current);
          pendingWinRef.current = 0;
          setMessage(winMsg);
        }, 1500 * flySlow * 0.86);
        timers.current.push(winT);
      } else {
        pendingWinRef.current = newTotal;
        const winT = setTimeout(() => {
          setLastWin(pendingWinRef.current);
          pendingWinRef.current = 0;
          setMessage(winMsg);
        }, 600);
        timers.current.push(winT);
      }
      setMessage(justAwarded ? '+10 FREE SPINS!' : 'MATCH!');

      // From the second cascade, run everything in a slight slow motion so the
      // shatter/drop animation lines up with the (also slowed) win sound.
      // Hold matched (popped) symbols big for ~1s, then blast them directly.
      const holdMs = cascadeCount >= 1 ? 1200 : 1000;
      const shatterT = setTimeout(() => { setShattering(shatterPos); }, holdMs);
      timers.current.push(shatterT);

      // Cascade: drop new symbols, then re-evaluate at the normal pacing so
      // every multiplier round feels deliberate — no collapsed timing at chain end.
      const cont = currentMultIndex < CONTINUE_PROB.length && Math.random() < CONTINUE_PROB[currentMultIndex];
      const cascadeT = setTimeout(() => {
        const newGrid = rigCascadeGrid(gridForCascade, shatterPos, cont);
        setShattering(new Set());
        setWinningPositions(new Set([...wpos].filter(p => !shatterPos.has(p))));
        setGoldFrames(prev => new Set([...prev].filter(p => !shatterPos.has(p))));
        setGrid(newGrid);
        setCascading(true);
        setCascadePositions(shatterPos);
        sfx.drop();

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
      // Safety: if the delayed win-reveal timer hasn't fired yet, show it now.
      if (pendingWinRef.current > 0) { setLastWin(pendingWinRef.current); pendingWinRef.current = 0; }
      clearPendingRound('wild-bounty');
      pendingStateRef.current = null;
      if (cascadeCount === 0) { setLastWin(0); sfx.loss(); }

      // Accumulate this spin's win into the free-spins running total.
      if (wasFree) freeSpinsTotalRef.current += totalWin;

      // Decide which banner (if any) to show at round end. Super Win covers
      // x16–x32; Mega Win covers x64 and every tier beyond. Free-spins rounds
      // show a Mega Win banner with the accumulated 10-spin total instead.
      const peak = peakMultRef.current;
      const fsEnding = wasFree && freeSpinsCountRef.current === 0 && freeSpinsTotalRef.current > 0;
      let banner = null;
      if (fsEnding) {
        const fsTotal = freeSpinsTotalRef.current;
        freeSpinsTotalRef.current = 0;
        banner = { type: 'freeSpinsEnd', amount: fsTotal, multiplier: peak };
      } else {
        const isMega = peak >= 64;
        const isSuper = !isMega && peak >= 16;
        if (isMega && totalWin > 0) banner = { type: 'mega', amount: totalWin, multiplier: peak };
        else if (isSuper && totalWin > 0) banner = { type: 'super', amount: totalWin, multiplier: peak };
      }

      if (banner) {
        // If a flying-multiplier animation is still playing (peak >= 2 means a
        // flying mult was triggered this round), delay the banner ~800ms so it
        // appears right after the animation finishes — never overlapping it.
        if (peak >= 2) {
          setBannerPending(true);
          const bt = setTimeout(() => {
            applyBanner(banner);
            setBannerPending(false);
          }, 800);
          timers.current.push(bt);
        } else {
          applyBanner(banner);
        }
      }

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
    peakMultRef.current = 1;
    pendingWinRef.current = 0;
    setBannerPending(false);
    setSuperWin(null);
    setMegaWin(null);
    setFreeSpinsEndWin(null);
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
    if (!usingFree) { setBalance(b => b - bet); freeSpinsTotalRef.current = 0; freeSpinsCountRef.current = 0; }
    if (usingFree) { setFreeSpins(f => f - 1); freeSpinsCountRef.current = Math.max(0, freeSpinsCountRef.current - 1); }
    // Each free spin (re)starts at 8x; normal spins start at 1x.
    setMultIndex(usingFree ? 3 : 0);
    // Snapshot the free-spins round state for recovery; the running win is
    // updated each cascade and the whole total is credited at chain end.
    pendingStateRef.current = { freeSpins: usingFree ? Math.max(0, freeSpins - 1) : 0, freeSpinsActive: usingFree };
    savePendingRound('wild-bounty', { win: 0, bet, state: pendingStateRef.current });
    setMessage('Spinning...');

    let finalGrid = REEL_ROWS.map(r => buildReel(r));
    // Match chance = admin RTP (default 35%): 65% no-match, 35% match.
    const wantWin = Math.random() < (rtpRef.current / 100);
    if (wantWin) {
      const X = 'A';
      finalGrid = finalGrid.map((reel, ri) => {
        if (ri < 4 && !reel.includes(X)) {
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

    // Scatter distribution per spin: 3+ = 1% (free-spin trigger), 2 = 5%, 1 = 10%.
    finalGrid = finalGrid.map(reel => [...reel]);
    const nonScatter = () => { let s = randomSymbol(); while (s === 'scatter') s = randomSymbol(); return s; };
    // Remove any natural scatters so we control the exact count.
    finalGrid.forEach(reel => { for (let i = 0; i < reel.length; i++) if (reel[i] === 'scatter') reel[i] = nonScatter(); });
    const roll = Math.random();
    let targetScatters = 0;
    if (roll < 0.01) targetScatters = 3;               // 1%  (free-spin trigger)
    else if (roll < 0.06) targetScatters = 2;           // 5%
    else if (roll < 0.16) targetScatters = 1;          // 10%
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
  }, [spinning, balance, bet, freeSpins, turbo, multIndex, setBet]);

  // auto spin — paused while a Super/Mega win banner is on screen (or pending)
  useEffect(() => {
    if (autoSpin && !spinning && balance >= bet && !superWin && !megaWin && !freeSpinsEndWin && !bannerPending) {
      const t = setTimeout(() => spin(), turbo ? 300 : 700);
      return () => clearTimeout(t);
    }
    if (autoSpin && balance < bet) setAutoSpin(false);
  }, [autoSpin, spinning, balance, bet, turbo, spin, superWin, megaWin, freeSpinsEndWin, bannerPending]);

  // free spins auto trigger — paused while a Super/Mega win banner is on screen (or pending)
  useEffect(() => {
    if (freeSpinsActive && !spinning && freeSpins > 0 && !showFreeSpinStart && !superWin && !megaWin && !bannerPending) {
      const t = setTimeout(() => spin(), turbo ? 400 : 800);
      return () => clearTimeout(t);
    }
    if (freeSpinsActive && freeSpins === 0) {
      setFreeSpinsActive(false);
      setMessage('FREE SPINS ENDED!');
    }
  }, [freeSpinsActive, spinning, freeSpins, showFreeSpinStart, turbo, spin, superWin, megaWin, bannerPending]);

  // Apply a pending banner to the matching state — used both immediately (no
  // flying animation active) and after the flying animation completes.
  const applyBanner = useCallback((banner) => {
    if (!banner) return;
    if (banner.type === 'mega') setMegaWin({ amount: banner.amount, multiplier: banner.multiplier });
    else if (banner.type === 'super') setSuperWin({ amount: banner.amount, multiplier: banner.multiplier });
    else if (banner.type === 'freeSpinsEnd') setFreeSpinsEndWin({ amount: banner.amount, multiplier: banner.multiplier });
  }, []);

  const clearFlyingMult = useCallback(() => setFlyingMult(null), []);
  const dismissSuperWin = useCallback(() => setSuperWin(null), []);
  const dismissMegaWin = useCallback(() => setMegaWin(null), []);
  const dismissFreeSpinsEndWin = useCallback(() => setFreeSpinsEndWin(null), []);

  // FEATURE BUY — open the confirmation modal first (Start awards the spins).
  const buyFeature = useCallback(() => {
    if (spinning || showFreeSpinStart || showFeatureBuyConfirm) return;
    setShowFeatureBuyConfirm(true);
  }, [spinning, showFreeSpinStart, showFeatureBuyConfirm]);

  // START — award 10 free spins and let the free-spins loop begin.
  const confirmFeatureBuy = useCallback(() => {
    setShowFeatureBuyConfirm(false);
    setFreeSpins(10);
    freeSpinsCountRef.current = 10;
    freeSpinsTotalRef.current = 0;
    setFreeSpinsActive(true);
    setMultIndex(3); // 8x — free spins start here
    setMessage('FEATURE BUY · 10 FREE SPINS');
  }, []);

  // CANCEL — just close the modal, nothing awarded.
  const cancelFeatureBuy = useCallback(() => setShowFeatureBuyConfirm(false), []);

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
    grid, balance, bet, spinning, stoppedReels,
    multiplier: MULTIPLIERS[multIndex], multIndex,
    lastWin, message, winningPositions, goldFrames, shattering, cascading, cascadePositions,
    freeSpins, scatterCount, turbo, autoSpin,
    showFreeSpinStart, showFeatureBuyConfirm, confirmFeatureBuy, cancelFeatureBuy,
    freeSpinsActive, startFreeSpins, buyFeature,
    anticipation, scatterGlow,
    cascadeSlow,
    bulletHit,
    flyingMult, clearFlyingMult,
    superWin, megaWin, dismissSuperWin, dismissMegaWin,
    freeSpinsEndWin, dismissFreeSpinsEndWin,
    spin, setBet, setTurbo, setAutoSpin, reset,
    featureCost: bet * 75,
  };
}