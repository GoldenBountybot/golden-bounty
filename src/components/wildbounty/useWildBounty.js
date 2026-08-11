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
  const [finalGrid, setFinalGrid] = useState(null);
  const { balance, setBalance, beginRound, settleBet, addRoundWin, reset: resetBalance } = useCasinoBalance();
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
  const [endSkull, setEndSkull] = useState(false); // skull shown at cascade-chain end when peak >= x8
  const [totalWinDur, setTotalWinDur] = useState(650); // count-up duration matched to the total-win sound length (ms)
  const [totalWinKey, setTotalWinKey] = useState(0); // bump to re-mount CountUp (re-animate from 0) at chain end
  const [totalWinCountUp, setTotalWinCountUp] = useState(false); // true only when the plaque should count up from 0 (peak x8–x16, no Super/Mega banner)
  const [showTotalLabel, setShowTotalLabel] = useState(false); // true when the plaque should show "TOTAL WIN" (current cascade multiplier >= x8)
  const [winFlashKey, setWinFlashKey] = useState(0); // bump to re-trigger the golden screen flash at round-end win
  const peakMultRef = useRef(1); // highest multiplier applied to a winning cascade this round
  const freeSpinsTotalRef = useRef(0); // accumulated win across the current free-spins round
  const freeSpinsCountRef = useRef(0); // remaining free spins (synced ref for chain-end checks)
  const roundEndSoundDurRef = useRef(800); // ms to wait for the round-end sound to finish before the next free spin
  const pendingWinRef = useRef(0); // win amount waiting to be revealed when the flying multiplier lands on the banner
  const [bannerPending, setBannerPending] = useState(false); // blocks auto/free spin while a round-end banner is delayed for the flying animation
  const forceScatterBuyRef = useRef(false); // Feature Buy: force 3 scatters on the next spin to trigger the free-spins banner
  const skipBetDeductRef = useRef(false); // Feature Buy: the triggering spin's bet is already covered by the feature cost
  const settleBetRef = useRef(0); // the bet amount used for server-side settlement (per-line bet, or feature-buy cost)
  const serverWinRef = useRef(0); // server-decided win amount for the current round (from beginRound)
  const settlePromiseRef = useRef(null); // pending settleBet — awaited in spin() before the next beginRound

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
  const demoModeRef = useRef(false);
  useEffect(() => { rtpRef.current = settings.rtp; }, [settings.rtp]);
  useEffect(() => { demoModeRef.current = settings.demoMode; }, [settings.demoMode]);

  const timers = useRef([]);
  const pendingStateRef = useRef(null);

  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current.forEach(clearInterval); sfx.stopFreeSpinReel(); }, []);

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
  //   reach X2 5%, X4 3.33%, X8 1.67%, X16 0.1%, X32 0.02%, X64 0.01%, X128 0.0006%.
  const CONTINUE_PROB = [0.00009, 0.000018, 0.0000035, 0.0000009, 0.00000009, 0.00000004, 0.00000002];

  // Drop new symbols into the blasted positions and rig them so the next
  // cascade either wins (chain continues toward a higher multiplier tier) or
  // loses (chain ends), hitting the target odds. Only blasted positions are
  // replaced; unchanged reels keep their array reference (React.memo skip).
  const rigCascadeGrid = (currentGrid, removePositions, forceWin, wasFree) => {
    const removed = [...removePositions];
    const changedReels = new Set(removed.map(p => Number(p.split('-')[0])));
    const grid = currentGrid.map((reel, ri) => changedReels.has(ri) ? [...reel] : reel);
    // During free spins, halve the high-value (bandit/revolver) frequency in
    // the random fill pool so high-value matches form far less often.
    const baseIds = wasFree
      ? ['whiskey', 'whiskey', 'whiskey', 'hat', 'hat', 'hat', 'Q', 'Q', 'Q', 'J', 'J', 'J']
      : ['whiskey', 'whiskey', 'whiskey', 'hat', 'hat', 'Q', 'Q', 'J', 'J', 'J'];
    const randBase = () => baseIds[Math.floor(Math.random() * baseIds.length)];
    removed.forEach(pos => {
      const [r, row] = pos.split('-').map(Number);
      grid[r][row] = randBase();
    });

    if (forceWin) {
      // Guarantee a 3+ contiguous-from-left win: drop the same LOW-value symbol
      // on the first blasted cell of reels 0, 1 and 2. Exclude high-value
      // symbols (bandit/revolver) AND A/K so multiplier rounds only form
      // low-value single-type matches.
      const lowMids = ['whiskey', 'hat', 'Q', 'J'];
      const S = lowMids[Math.floor(Math.random() * lowMids.length)];
      [0, 1, 2].forEach(r => {
        const pos = removed.find(p => Number(p.split('-')[0]) === r);
        if (pos) {
          const [, row] = pos.split('-').map(Number);
          grid[r][row] = S;
        }
      });
    } else {
      // Force a non-win: break any 3-reel contiguity. BULLETPROOF — strip
      // wilds from early reels and clear ALL instances of the winning symbol
      // from the target reel (not just one blasted cell), because evaluateWins
      // counts a win if ANY row on the reel has the symbol.
      for (let r = 0; r < 3; r++) {
        grid[r] = grid[r].map(s => s === 'wild' ? randBase() : s);
      }
      let guard = 0;
      while (guard++ < 30 && evaluateWins(grid, bet).wins.length > 0) {
        const wins = evaluateWins(grid, bet).wins;
        for (const w of wins) {
          for (let targetReel = 2; targetReel >= 0; targetReel--) {
            const reel = grid[targetReel];
            let hadSym = false;
            for (let row = 0; row < reel.length; row++) {
              if (reel[row] === w.symbol) { reel[row] = randBase(); while (reel[row] === w.symbol) reel[row] = randBase(); hadSym = true; }
            }
            if (hadSym) break;
          }
        }
      }
    }

    // Limit to a SINGLE winning symbol type per cascade round so multiple
    // symbol types never match at once. Keep only the forced symbol's win
    // (or the first win if no forced win), break every other win type by
    // swapping a blasted cell on its earliest reel to a different symbol.
    {
      const lows = ['whiskey', 'hat', 'Q', 'J'];
      let guard = 0;
      while (guard++ < 30) {
        const { wins } = evaluateWins(grid, bet);
        if (wins.length <= 1) break;
        const keepSym = forceWin ? wins[0].symbol : wins[0].symbol;
        const extras = wins.filter(w => w.symbol !== keepSym);
        if (extras.length === 0) break;
        let fixed = false;
        for (const w of extras) {
          // Try every reel where this extra win's symbol appears (not just
          // blasted cells) so the break always lands even when the extra win
          // spans reels with no removed positions.
          for (let targetReel = 0; targetReel < 6 && !fixed; targetReel++) {
            const reel = grid[targetReel];
            for (let row = 0; row < reel.length; row++) {
              if (reel[row] !== w.symbol) continue;
              // Prefer a blasted cell on this reel; otherwise overwrite the
              // matching symbol directly to break the contiguity.
              const pos = removed.find(p => Number(p.split('-')[0]) === targetReel);
              const useRow = pos ? Number(pos.split('-')[1]) : row;
              let alt = lows[Math.floor(Math.random() * lows.length)];
              while (alt === w.symbol) alt = lows[Math.floor(Math.random() * lows.length)];
              grid[targetReel][useRow] = alt;
              fixed = true;
              break;
            }
          }
        }
        if (!fixed) break;
      }
    }

    // Cap the kept win to exactly 1 matching symbol per early reel so the
    // fewest possible symbols match at once (minimal ways).
    {
      const { wins } = evaluateWins(grid, bet);
      if (wins.length > 0) {
        const keepSym = wins[0].symbol;
        const lows = ['whiskey', 'hat', 'Q', 'J'];
        for (let r = 0; r < 3; r++) {
          const reel = grid[r];
          let foundFirst = false;
          for (let row = 0; row < reel.length; row++) {
            if (reel[row] === keepSym) {
              if (foundFirst) {
                reel[row] = lows[Math.floor(Math.random() * lows.length)];
              } else {
                foundFirst = true;
              }
            }
          }
        }
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
      // First trigger awards 10 free spins; retrigger during free spins adds 5.
      const awardCount = wasFree ? 5 : 10;
      setFreeSpins(f => f + awardCount);
      freeSpinsCountRef.current += awardCount;
      // First trigger shows the START screen; retrigger during free spins
      // just adds the spins and keeps the round going.
      if (!wasFree) { setShowFreeSpinStart(true); sfx.freeSpinTrigger(); }
      awarded = true;
      justAwarded = true;
    }

    if (stepWin > 0) {
      const slow = cascadeCount >= 1 ? 1.6 : 1.2;
      setCascadeSlow(slow);
      // High-value symbols (bandit, revolver) play a distinct match sound.
      sfx.symbolMatch();
      sfx.win(cascadeCount);
      const newTotal = totalWin + stepWin;
      const newMult = Math.min(currentMultIndex + 1, MULTIPLIERS.length - 1);
      // Show the ACCUMULATED total in the banner (not just this cascade's
      // step win) so the banner always matches the balance addition.

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
      // The symbols that will convert to wilds blast in place then become
      // wilds right there (no drop). Other winning positions blast and get
      // replaced by new symbols dropping in from above.
      const gridForCascade = currentGrid;
      const shatterPos = new Set([...wpos]);        // for the blast visual
      const removePositions = new Set([...wpos].filter(p => !convertSet.has(p))); // for rigCascadeGrid

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
      // Show the ACCUMULATED total in the banner so it matches the balance.
      const winMsg = justAwarded ? `WIN ${newTotal.toFixed(2)} · +${wasFree ? 5 : 10} FREE SPINS` : `WIN ${newTotal.toFixed(2)}`;
      const winValue = newTotal;
      // Server already confirmed a win (the outer condition guarantees
      // serverWinRef.current > 0) — add the win to the balance AND show the
      // banner IMMEDIATELY, at the same time, no delay.
      addRoundWin(stepWin);
      setLastWin(newTotal);
      setMessage(winMsg);
      pendingWinRef.current = winValue;
      if (currentMultIndex >= 1) {
        setFlyingMult({ value: MULTIPLIERS[currentMultIndex], key: Date.now(), slow: flySlow });
      }
      if (justAwarded) setMessage(`+${wasFree ? 5 : 10} FREE SPINS!`);

      // From the second cascade, run everything in a slight slow motion so the
      // shatter/drop animation lines up with the (also slowed) win sound.
      // Hold matched (popped) symbols big for ~1s, then blast them directly.
      const holdMs = cascadeCount >= 1 ? 1200 : 1000;
      const shatterT = setTimeout(() => { setShattering(shatterPos); }, holdMs);
      timers.current.push(shatterT);

      // Cascade: drop new symbols, then re-evaluate at the normal pacing so
      // every multiplier round feels deliberate — no collapsed timing at chain end.
      // Normal spins at x8 and above (multIndex >= 3): lock the continue chance
      // to exactly 0.1% (0.001). Below x8, use the tiered CONTINUE_PROB.
      // Demo mode doubles the cascade continuation chance so multiplier
      // chains climb higher more often during demo play.
      const baseContProb = (!wasFree && currentMultIndex >= 3)
        ? 0.001
        : CONTINUE_PROB[currentMultIndex] * (wasFree ? 0.3 : 0.25);
      const contProb = demoModeRef.current ? Math.min(1, baseContProb * 2) : baseContProb;
      const cont = currentMultIndex < CONTINUE_PROB.length && Math.random() < contProb;
      const cascadeT = setTimeout(() => {
        const newGrid = rigCascadeGrid(gridForCascade, removePositions, cont, wasFree);
        // The blasted convert positions become wilds in place (no drop).
        if (convertSet.size) {
          convertSet.forEach(pos => { const [r, row] = pos.split('-').map(Number); newGrid[r][row] = 'wild'; });
          setScatterGlow(prev => new Set([...prev, ...convertSet]));
        }
        setShattering(new Set());
        setWinningPositions(new Set([...wpos].filter(p => !shatterPos.has(p))));
        setGoldFrames(prev => new Set([...prev].filter(p => !shatterPos.has(p))));
        setGrid(newGrid);
        setCascading(true);
        setCascadePositions(removePositions);

        const evalT = setTimeout(() => {
          setCascading(false);
          setCascadePositions(new Set());
          evaluateAndCascade(newGrid, cascadeCount + 1, newTotal, newMult, wasFree, awarded, framedPositions);
        }, 450 * slow);
        timers.current.push(evalT);
      }, 1000 * slow);
      timers.current.push(cascadeT);
    } else {
      // No more wins — end the chain. Use the CLIENT-computed cascade total
      // (what the user actually saw win). settleBet runs in 'cap' mode, so
      // the server credits min(clientTotal, serverCap) — the balance gets
      // EXACTLY the displayed win, never more.
      sfx.winStop();
      setCascadeSlow(1);
      setWinningPositions(new Set());
      // Settle the round atomically on the server: deducts the bet (if not a
      // free spin) and credits the capped win in one verified operation.
      // AWAIT the settlement before allowing the next spin — otherwise the
      // next auto-spin/free-spin beginRound races this settleBet, and the
      // settleBet response (which may include the next bet's server-side
      // deduction) combined with the local -bet uncommittedDelta double-
      // deducts the next bet, making wins appear uncredited.
      const settlePromise = settleBet(settleBetRef.current, totalWin, 'wild-bounty', wasFree);
      settlePromiseRef.current = settlePromise;
      // Only show win effects if the SERVER decided a win. If the server
      // decided a loss, totalWin is meaningless (accidental grid match) —
      // don't show banners, flash, or credit anything.
      // Show win effects whenever the grid produced a win — the simplified grid
      // generation already ensures the grid matches the server's decision.
      const isServerWin = totalWin > 0;
      if (isServerWin && totalWin > 0) setWinFlashKey(k => k + 1);
      // Safety: if the delayed win-reveal timer hasn't fired yet, show it now.
      if (isServerWin && pendingWinRef.current > 0) { setLastWin(pendingWinRef.current); pendingWinRef.current = 0; }
      clearPendingRound('wild-bounty');
      pendingStateRef.current = null;
      if (cascadeCount === 0) { setLastWin(0); sfx.loss(); }

      // Accumulate this spin's win into the free-spins running total.
      if (wasFree && isServerWin) freeSpinsTotalRef.current += totalWin;

      // Decide which banner (if any) to show at round end. Super Win covers
      // x16–x32; Mega Win covers x64 and every tier beyond. Free-spins rounds
      // show a Mega Win banner with the accumulated 10-spin total instead.
      const peak = peakMultRef.current;
      let showdownDurMs = 0;
      if (isServerWin && peak >= 8 && totalWin > 0) {
        setEndSkull(true);
        // Only count up from 0 + play the total-win sting when NO Super/Mega
        // win banner is showing (peak < 32) — those banners have their own
        // count-up + sound, so the plaque just shows the plain total.
        if (peak < 32) {
          showdownDurMs = (sfx.showdown() || 2.2) * 1000;
          setTotalWinCountUp(true);
          setTotalWinDur(showdownDurMs * 0.9);
          setTotalWinKey(k => k + 1);
          setLastWin(totalWin);
        }
      }
      const fsEnding = wasFree && freeSpinsCountRef.current === 0 && freeSpinsTotalRef.current > 0;
      let banner = null;
      if (fsEnding) {
        const fsTotal = freeSpinsTotalRef.current;
        freeSpinsTotalRef.current = 0;
        banner = { type: 'freeSpinsEnd', amount: fsTotal, multiplier: peak };
      } else {
        const isMega = peak >= 128;
        const isSuper = !isMega && peak >= 32;
        if (isMega && isServerWin && totalWin > 0) banner = { type: 'mega', amount: totalWin, multiplier: peak };
        else if (isSuper && isServerWin && totalWin > 0) banner = { type: 'super', amount: totalWin, multiplier: peak };
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
          }, 700);
          timers.current.push(bt);
        } else {
          applyBanner(banner);
        }
        // Banners have their own sound + dismiss timing — the free-spin
        // auto-trigger already waits for !superWin/!megaWin/!bannerPending, so
        // a short fallback delay is enough after the banner is dismissed.
        roundEndSoundDurRef.current = 600;
      } else if (showdownDurMs > 0) {
        // Showdown sting is playing — wait for it to finish (+ small buffer)
        // before the next free spin starts.
        roundEndSoundDurRef.current = showdownDurMs + 400;
      } else {
        roundEndSoundDurRef.current = turbo ? 400 : 800;
      }

      if (!wasFree) setMultIndex(0);
      if (awarded) {
        setMessage(wasFree ? 'RETRIGGER! +5 FREE SPINS' : '3+ SCATTER! 10 FREE SPINS');
      } else if (cascadeCount === 0) {
        setMessage(sc === 2 ? 'ONE MORE SCATTER!' : 'WIN UP TO 3600 WAYS!');
      }
      logActivity('wild-bounty', bet, isServerWin ? totalWin : 0, isServerWin && totalWin > 0 ? 'win' : 'loss');
      // Delay setSpinning(false) until settleBet completes — prevents the next
      // auto-spin/free-spin from starting a new beginRound before this round's
      // settleBet finishes, which would race the two server calls and double-
      // deduct the next bet (making wins appear uncredited).
      // Enable the spin button immediately — the user can click as soon as
      // the visual round ends. The pending settleBet is awaited in spin()
      // before the next beginRound, so the server race is still prevented.
      setSpinning(false);
      settlePromise.then(() => { settlePromiseRef.current = null; });
    }
  };

  const settle = (finalGrid, frames, wasFree) => {
    setAnticipation(false);
    sfx.stopSpin();
    sfx.stopFreeSpinReel();
    // Free spins always evaluate from 8x; normal spins from 1x.
    evaluateAndCascade(finalGrid, 0, 0, wasFree ? 3 : 0, wasFree, false, frames);
  };

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
    sfx.winStop();
    sfx.spin();
    if (usingFree) sfx.startFreeSpinReel();
    peakMultRef.current = 1;
    pendingWinRef.current = 0;
    setBannerPending(false);
    setSuperWin(null);
    setMegaWin(null);
    setFreeSpinsEndWin(null);
    setEndSkull(false);
    setTotalWinCountUp(false);
    setShowTotalLabel(false);
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
    if (usingFree) { setFreeSpins(f => f - 1); freeSpinsCountRef.current = Math.max(0, freeSpinsCountRef.current - 1); }
    // Each free spin (re)starts at 8x; normal spins start at 1x.
    setMultIndex(usingFree ? 3 : 0);
    setMessage('SPINNING...');

    // Wait for any pending settleBet from the previous round to complete
    // before starting a new beginRound — prevents the race where the next
    // beginRound's server deduction overlaps the previous settleBet's
    // response, double-deducting the bet. Visual feedback (sound, state
    // resets) already happened above, so the user sees immediate action.
    if (settlePromiseRef.current) {
      await settlePromiseRef.current;
      settlePromiseRef.current = null;
    }

    // Start the server round (sets roundActive = true synchronously so the
    // setBalance below is local-display-only, then calls the backend to
    // pre-decide the outcome). The server's win is AUTHORITATIVE — settleBet
    // credits it, ignoring the client's cascade-computed total.
    const _roundBet = skipBetDeductRef.current ? settleBetRef.current : bet;
    const _serverRoundPromise = beginRound(_roundBet, 'wild-bounty', usingFree, 'cap');
    if (!usingFree) {
      if (skipBetDeductRef.current) {
        skipBetDeductRef.current = false;
        // settleBetRef was already set to the feature-buy cost by confirmFeatureBuy
      } else {
        settleBetRef.current = bet;
      }
      freeSpinsTotalRef.current = 0;
      freeSpinsCountRef.current = 0;
    } else {
      // Free spin: no bet deducted, but use the per-line bet for the win cap
      settleBetRef.current = bet;
    }
    // Snapshot the free-spins round state for recovery; the running win is
    // updated each cascade and the whole total is credited at chain end.
    pendingStateRef.current = { freeSpins: usingFree ? Math.max(0, freeSpins - 1) : 0, freeSpinsActive: usingFree };
    savePendingRound('wild-bounty', { win: 0, bet, state: pendingStateRef.current });

    // Wait for the server's pre-decided outcome before generating the grid.
    const serverRound = await _serverRoundPromise;
    // If beginRound failed (network error, server reject, etc.), the server
    // did NOT deduct the bet. Revert the local display deduction and abort.
    if (serverRound.failed) {
      setSpinning(false);
      setMessage('Connection error — try again');
      return;
    }
    serverWinRef.current = Number(serverRound.win_amount ?? 0);

    let finalGrid = REEL_ROWS.map(r => buildReel(r));
    // Use the server's win decision (from beginRound) — NOT Math.random().
    const wantWin = serverWinRef.current > 0;

    // --- Scatter placement (before win/loss matching so scatters are preserved) ---
    finalGrid = finalGrid.map(reel => [...reel]);
    const nonScatter = () => { let s = randomSymbol(); while (s === 'scatter') s = randomSymbol(); return s; };
    finalGrid.forEach(reel => { for (let i = 0; i < reel.length; i++) if (reel[i] === 'scatter') reel[i] = nonScatter(); });
    const roll = Math.random();
    let targetScatters = 0;
    if (roll < 0.004) targetScatters = 3;              // 0.4%  (free-spin trigger)
    else if (roll < 0.029) targetScatters = 2;          // 2.5%
    else if (roll < 0.16) targetScatters = 1;          // 10%
    if (forceScatterBuyRef.current) {
      targetScatters = 3;
      forceScatterBuyRef.current = false;
    }
    {
      const cells = [];
      finalGrid.forEach((reel, ri) => reel.forEach((_, row) => cells.push([ri, row])));
      if (targetScatters === 3) {
        const early = cells.filter(([ri]) => ri <= 2);
        const late = cells.filter(([ri]) => ri >= 3);
        for (let i = 0; i < 2 && early.length; i++) {
          const idx = Math.floor(Math.random() * early.length);
          const [ri, row] = early.splice(idx, 1)[0];
          finalGrid[ri][row] = 'scatter';
        }
        if (late.length) {
          const idx = Math.floor(Math.random() * late.length);
          const [ri, row] = late.splice(idx, 1)[0];
          finalGrid[ri][row] = 'scatter';
        }
      } else {
        for (let i = 0; i < targetScatters && cells.length; i++) {
          const idx = Math.floor(Math.random() * cells.length);
          const [ri, row] = cells.splice(idx, 1)[0];
          finalGrid[ri][row] = 'scatter';
        }
      }
    }

    // --- Win/loss matching: regenerate non-scatter cells on reels 0-2 until
    // the grid matches the server's decision. Simple and reliable — no complex
    // win-breaking loops that can fail and leave phantom wins. ---
    {
      let guard = 0;
      while (guard++ < 80) {
        const { wins } = evaluateWins(finalGrid, bet);
        if (wantWin && wins.length > 0) break;
        if (!wantWin && wins.length === 0) break;
        for (let r = 0; r < 3; r++) {
          finalGrid[r] = finalGrid[r].map(s => s === 'scatter' ? s : randomSymbol());
        }
      }
    }

    setFinalGrid(finalGrid);
    const frames = assignGoldFrames(finalGrid);
    // Pre-load the frame layout so each frame appears the instant its reel
    // stops (dropping in with the symbol), instead of popping in after every
    // reel has landed.
    setGoldFrames(frames);
    const baseGap = turbo ? 95 : 175;
    const slowGap = turbo ? 650 : 1150; // slow-motion anticipation for remaining reels

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
      const t = setTimeout(() => spin(), turbo ? 400 : roundEndSoundDurRef.current);
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
    // The banner component itself plays the total-win sound and matches its
    // count-up to the sound length, so we don't trigger the sound here.
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

  // START — run a single spin that forces 3 scatters to land. The scatters
  // trigger the normal free-spins banner, and the 10 free spins begin after
  // the user dismisses it (exactly like a natural 3-scatter trigger).
  const confirmFeatureBuy = useCallback(() => {
    const cost = bet * 75;
    if (balance < cost) {
      setMessage('Insufficient balance for Feature Buy');
      setShowFeatureBuyConfirm(false);
      return;
    }
    beginRound();
    settleBetRef.current = cost;
    setBalance(b => b - cost);
    skipBetDeductRef.current = true;
    setShowFeatureBuyConfirm(false);
    forceScatterBuyRef.current = true;
    setMessage('FEATURE BUY · SPINNING...');
    spin();
  }, [bet, balance, spin]);

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
    grid, finalGrid, balance, bet, spinning, stoppedReels,
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
    endSkull,
    totalWinDur, totalWinKey, totalWinCountUp, showTotalLabel,
    winFlashKey,
    spin, setBet, setTurbo, setAutoSpin, reset,
    featureCost: bet * 75,
  };
}