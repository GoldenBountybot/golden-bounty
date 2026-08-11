import { useState, useRef, useEffect, useCallback } from 'react';
import {
  REELS, ROWS, generateGrid, evaluate, resolveBonus, forceWinGrid,
  FREE_SPINS_AWARD, BONUS_TRIGGER_COUNT, MAX_RISK_STEPS,
  coinTriggered, collectCoins, spinCoinRound, coinTotal, COIN_SPINS_START,
  valueCoinKey, isValueCoin,
} from './argonautsEngine';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { savePendingRound, clearPendingRound, usePendingRoundRecovery } from '@/lib/pendingRound';
import { playReelLandSound, playValueCoinSound, playDoveSound, playAmphoraSound, playLyreSound, playSpartanSound, playGoddessSound, playDragonSound, playBowSound, playPotionSound, playWildSound, playScatterSound, playScatterLongSound, stopScatterLongSound, playScatterWinSound, playCoinFeatureSound } from './argoSounds';

// ---- Risk (Gamble) card helpers ----
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
// Dealer is weighted toward higher cards so the gamble approximates 84% RTP.
const DEALER_W = [2, 3, 3, 3, 3, 3, 3, 3, 4, 5, 5, 6, 7];
const rankVal = (c) => (c === 'JOKER' ? 99 : RANKS.indexOf(c));
function dealDealer() {
  const total = DEALER_W.reduce((a, b) => a + b, 0);
  let r = Math.random() * total, idx = 0;
  for (let i = 0; i < DEALER_W.length; i++) { r -= DEALER_W[i]; if (r <= 0) { idx = i; break; } }
  return RANKS[idx];
}
function dealPlayerCard() {
  if (Math.random() < 0.08) return 'JOKER'; // Joker beats all; Dealer never gets one
  return RANKS[Math.floor(Math.random() * RANKS.length)];
}
function dealFour() {
  return [dealPlayerCard(), dealPlayerCard(), dealPlayerCard(), dealPlayerCard()];
}

export function useArgonauts() {
  const [grid, setGrid] = useState(() => generateGrid(false));
  const { balance, setBalance, reset: resetBalance, beginRound, settleBet } = useCasinoBalance();
  const [bet, setBet] = useState(0.10); // $0.10 default
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
  // Card gamble state
  const [dealerCard, setDealerCard] = useState(null);
  const [playerCards, setPlayerCards] = useState([]);
  const [revealedIdx, setRevealedIdx] = useState(null);
  const [riskOutcome, setRiskOutcome] = useState(null);

  // Value-coin hold-and-spin round state
  const [coinMode, setCoinMode] = useState(false);
  const [coinSpins, setCoinSpins] = useState(0);
  const [coinStuck, setCoinStuck] = useState({});
  const [showCoinBanner, setShowCoinBanner] = useState(false);
  const [coinTriggerCount, setCoinTriggerCount] = useState(0);
  const [coinDropped, setCoinDropped] = useState(new Set());
  const [coinDroppingReels, setCoinDroppingReels] = useState(new Set());
  const [coinWin, setCoinWin] = useState(null);
  const [freeSpinEnd, setFreeSpinEnd] = useState(null);
  const [anticipateReels, setAnticipateReels] = useState(new Set());
  const [slowMoReels, setSlowMoReels] = useState(new Set());

  const settings = useGameSettings('argonauts');
  usePendingRoundRecovery('argonauts', setBalance, (state) => {
    if (state && state.freeSpinsActive && state.freeSpins > 0) {
      setFreeSpins(state.freeSpins);
      setFreeSpinsActive(true);
      setMessage(`FREE SPINS RESUMED · ${state.freeSpins} LEFT`);
    }
  });
  const rtpRef = useRef(50);
  useEffect(() => { rtpRef.current = settings.rtp; }, [settings.rtp]);

  const timers = useRef([]);
  const lineBet = bet / 10;
  const settlePromiseRef = useRef(null); // pending settleBet — awaited in spin() before the next beginRound
  const coinBaseWinRef = useRef(0); // base spin win stored when a coin round triggers — logged combined at coin round end

  // refs to avoid stale closures in chained coin-spin timers
  const betRef = useRef(bet); betRef.current = bet;
  const turboRef = useRef(turbo); turboRef.current = turbo;
  const coinModeRef = useRef(false);
  const coinStuckRef = useRef({});
  const coinSpinsRef = useRef(0);

  useEffect(() => () => { timers.current.forEach(clearTimeout); stopScatterLongSound(); }, []);

  // ---- Coin round ----
  const endCoinRound = useCallback((stuck) => {
    const total = coinTotal(stuck, betRef.current);
    setCoinWin({ total, coins: { ...stuck }, bet: betRef.current });
    coinStuckRef.current = {};
    coinSpinsRef.current = 0;
    coinModeRef.current = false;
    setCoinMode(false);
    setCoinStuck({});
    setCoinSpins(0);
    setCoinDropped(new Set());
    settlePromiseRef.current = settleBet(betRef.current, total, 'argonauts', true);
    settlePromiseRef.current.then(() => { settlePromiseRef.current = null; }).catch(() => {});
    setLastWin(total);
    setTotalWin((t) => t + total);
    setMessage(`COIN FEATURE · WON $${total.toFixed(2)}`);
    // Restore a normal symbol board so the maroon coin grid doesn't linger.
    setGrid(generateGrid(false));
    setSpinningReels(new Set([0, 1, 2, 3, 4]));
    coinBaseWinRef.current = 0;
  }, [setBalance, settleBet]);

  const coinSpin = useCallback(() => {
    if (!coinModeRef.current || Object.keys(coinStuckRef.current).length === 0) return;
    setSpinning(true);
    setWinningPositions(new Set());
    setCoinDropped(new Set());
    // Compute this drop upfront so we know which reels to animate as a
    // falling-coin stream before the stuck coin locks in.
    const { grid: newGrid, stuck: newStuck, dropped } = spinCoinRound(coinStuckRef.current);
    const droppingReels = new Set(dropped.map((d) => Number(d.split('-')[0])));
    setCoinDroppingReels(droppingReels);
    // Falling-coin stream window, then lock the stuck coin in.
    const t = setTimeout(() => {
      coinStuckRef.current = newStuck;
      setCoinStuck(newStuck);
      setCoinDropped(new Set(dropped));
      setGrid(newGrid);
      setSpinning(false);
      setCoinDroppingReels(new Set());
      playValueCoinSound();
      if (dropped.length > 0) {
        coinSpinsRef.current = COIN_SPINS_START;
        setCoinSpins(COIN_SPINS_START);
        setMessage(`COIN +${dropped.length} · 3 SPINS`);
      } else {
        const nc = coinSpinsRef.current - 1;
        coinSpinsRef.current = nc;
        setCoinSpins(nc);
        if (nc <= 0) { endCoinRound(newStuck); return; }
        setMessage(`${nc} SPINS LEFT`);
      }
      if (dropped.length > 0 || coinSpinsRef.current > 0) {
        const t2 = setTimeout(() => coinSpin(), turboRef.current ? 380 : 1000);
        timers.current.push(t2);
      }
    }, turboRef.current ? 300 : 520);
    timers.current.push(t);
  }, [endCoinRound]);

  const startCoinRound = useCallback((finalGrid) => {
    const stuck = collectCoins(finalGrid);
    coinStuckRef.current = stuck;
    coinSpinsRef.current = COIN_SPINS_START;
    coinModeRef.current = true;
    setCoinStuck(stuck);
    setCoinSpins(COIN_SPINS_START);
    setCoinMode(true);
    setCoinDropped(new Set());
    setCoinTriggerCount(Object.keys(stuck).length);
    setWinningPositions(new Set());
    // Build the coin-mode board: locked coins stay; all other cells are empty
    // placeholders (null) — no regular symbols in the coin round.
    const coinGrid = Array.from({ length: REELS }, (_, r) =>
      Array.from({ length: ROWS }, (_, row) => {
        const k = `${r}-${row}`;
        return stuck[k] ? valueCoinKey(stuck[k]) : null;
      })
    );
    setGrid(coinGrid);
    // Show the Golden Fleece trigger banner; clicking it starts the spins.
    setShowCoinBanner(true);
    setMessage('COIN FEATURE · TAP TO START');
    playCoinFeatureSound();
  }, []);

  // Called when the player taps the trigger banner — begins the first coin spin.
  const beginCoinSpins = useCallback(() => {
    setShowCoinBanner(false);
    const t = setTimeout(() => coinSpin(), turboRef.current ? 400 : 600);
    timers.current.push(t);
  }, [coinSpin]);

  const settle = useCallback((finalGrid, usingFree, serverWin = 0) => {
    clearPendingRound('argonauts');
    setGrid(finalGrid);
    setSpinningReels(new Set([0, 1, 2, 3, 4]));
    const { wins, scatterCount, scatterPay, bonusCount, lineWin } = evaluate(finalGrid, lineBet, bet);
    // Fixed mode: the SERVER's pre-decided win_amount is the authoritative win.
    // When the server decided a loss (serverWin = 0), do NOT highlight winning
    // positions/lines — the grid may have natural wins after the suppression
    // attempts, but the balance gets 0, so the visual must match.
    const baseWin = serverWin;
    const positions = new Set();
    if (baseWin > 0) wins.forEach((w) => w.positions.forEach((p) => positions.add(p)));
    setWinningPositions(positions);
    setWinningLines(baseWin > 0 ? wins.map((w) => ({ line: w.line, symbol: w.symbol, count: w.count, pay: w.pay })) : []);

    // Only play win sounds when the server decided a win — a server loss must
    // not play win sounds even if the grid has natural wins after suppression.
    if (baseWin > 0) {
      if (wins.some((w) => w.symbol === 'dove')) playDoveSound();
      if (wins.some((w) => w.symbol === 'cup')) playAmphoraSound();
      if (wins.some((w) => w.symbol === 'harp')) playLyreSound();
      if (wins.some((w) => w.symbol === 'jason')) playSpartanSound();
      if (wins.some((w) => w.symbol === 'atlanta')) playGoddessSound();
      if (wins.some((w) => w.symbol === 'lizard')) playDragonSound();
      if (wins.some((w) => w.symbol === 'bow')) playBowSound();
      if (wins.some((w) => w.symbol === 'potion')) playPotionSound();
      const wildInWin = wins.some((w) =>
        w.positions.some((pos) => {
          const [r, row] = pos.split('-');
          return finalGrid[Number(r)][Number(row)] === 'wild';
        })
      );
      if (wildInWin) playWildSound();
    }

    // (baseWin already declared above from serverWin)

    // Value-coin hold-and-spin trigger (base game only)
    const coinTrig = !usingFree && coinTriggered(finalGrid);
    if (coinTrig) {
      settlePromiseRef.current = settleBet(bet, baseWin, 'argonauts', false);
      settlePromiseRef.current.then(() => { settlePromiseRef.current = null; }).catch(() => {});
      if (baseWin > 0) {
        setLastWin(baseWin);
        setTotalWin((t) => t + baseWin);
      }
      setMessage(baseWin > 0 ? `WIN $${baseWin.toFixed(2)} · COIN FEATURE!` : 'COIN FEATURE!');
      setSpinning(false);
      // Don't log the base spin separately — the coin round's endCoinRound
      // will log the combined base + coin win as a single entry (the bet was
      // only deducted once). Stash the base win so endCoinRound can add it.
      coinBaseWinRef.current = baseWin;
      startCoinRound(finalGrid);
      return;
    }

    let awardedFree = false;
    if (scatterCount >= 3) {
      awardedFree = true;
      setFreeSpins((f) => f + FREE_SPINS_AWARD);
      if (!usingFree) setShowFreeSpinStart(true);
      playScatterWinSound();
    }

    if (baseWin > 0) {
      setLastWin(baseWin);
      setTotalWin((t) => t + baseWin);
      if (usingFree) {
        settlePromiseRef.current = settleBet(bet, baseWin, 'argonauts', true);
        settlePromiseRef.current.then(() => { settlePromiseRef.current = null; }).catch(() => {});
        setMessage(awardedFree ? `WIN $${baseWin.toFixed(2)} · +${FREE_SPINS_AWARD} FREE` : `WIN $${baseWin.toFixed(2)}`);
      } else {
        // Settle immediately — credit the win to the balance right away,
        // no TAKE/RISK hold step.
        settlePromiseRef.current = settleBet(bet, baseWin, 'argonauts', false);
        settlePromiseRef.current.then(() => { settlePromiseRef.current = null; }).catch(() => {});
        setMessage(awardedFree ? `WIN $${baseWin.toFixed(2)} · +${FREE_SPINS_AWARD} FREE` : `WIN $${baseWin.toFixed(2)}`);
      }
    } else {
      if (!usingFree) {
        settlePromiseRef.current = settleBet(bet, 0, 'argonauts', false);
        settlePromiseRef.current.then(() => { settlePromiseRef.current = null; }).catch(() => {});
      }
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
  }, [lineBet, bet, setBalance, settleBet, startCoinRound]);

  const spin = useCallback(async () => {
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
    setSpinningReels(new Set());
    setAnticipateReels(new Set());
    setSlowMoReels(new Set());
    // Await the previous round's settlement BEFORE starting the new round.
    // Without this, settleBet and beginRound race: settleBet clears
    // uncommittedDelta then overwrites committedBalance mid-flight, while
    // beginRound's setBalance(-bet) runs against a stale committedBalance —
    // causing the balance to flicker (bet appears double-deducted or the
    // previous win briefly vanishes).
    if (riskActive && pendingWin > 0) await settleBet(bet, pendingWin, 'argonauts', false);
    setPendingWin(0);
    setRiskActive(false);
    // Wait for any pending settleBet from the previous regular spin too.
    if (settlePromiseRef.current) {
      await settlePromiseRef.current;
      settlePromiseRef.current = null;
    }
    // Start the server round and AWAIT the decision before generating the grid.
    // The server pre-decides win/loss based on RTP (cap mode). The client's grid
    // MUST match that decision — otherwise the screen shows winning lines but the
    // server credits 0 (cap = min(client win, server win)), so the balance never
    // increases. This was the root cause of "win not adding to balance".
    const serverRound = await beginRound(bet, 'argonauts', usingFree, 'fixed');
    if (serverRound.failed) {
      setSpinning(false);
      setMessage('Connection error — try again');
      return;
    }
    if (!usingFree) {
      setTotalWin(0);
    } else {
      setFreeSpins((f) => f - 1);
    }
    setMessage('Spinning...');

    // Use the SERVER's pre-decided outcome to generate the grid — not a
    // client-side random. If the server says loss, ensure no line win so the
    // screen matches the balance.
    const serverWin = Number(serverRound.win_amount ?? 0);
    const serverIsWin = serverWin > 0;
    let finalGrid;
    if (usingFree) {
      finalGrid = generateGrid(true);
      if (!serverIsWin) {
        let attempts = 0;
        while (attempts < 5 && evaluate(finalGrid, lineBet, bet).lineWin > 0) {
          finalGrid = generateGrid(true);
          attempts++;
        }
      }
    } else if (serverIsWin) {
      finalGrid = forceWinGrid();
    } else {
      finalGrid = generateGrid(false);
      let attempts = 0;
      while (attempts < 5 && evaluate(finalGrid, lineBet, bet).lineWin > 0) {
        finalGrid = generateGrid(false);
        attempts++;
      }
    }

    // Persist the already-determined outcome so a mid-spin exit can be
    // recovered on return. Cleared at settle.
    {
      const _ev = evaluate(finalGrid, lineBet, bet);
      const _baseWin = _ev.lineWin + _ev.scatterPay;
      savePendingRound('argonauts', {
        win: _baseWin,
        bet,
        state: {
          freeSpins: usingFree ? Math.max(0, freeSpins - 1) : 0,
          freeSpinsActive: usingFree,
        },
      });
    }

    const baseGap = turbo ? 300 : 460;
    const slowGap = turbo ? 900 : 1400;
    const reelHasScatter = (r) => finalGrid[r].some((s) => s === 'scatter');
    const stopReel = (i, slowMo) => {
      const gap = slowMo ? slowGap : baseGap;
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
        if (slowMo) setSlowMoReels((prev) => new Set(prev).add(i));
        playReelLandSound();
        if (finalGrid[i].some(isValueCoin)) playValueCoinSound();
        if (finalGrid[i].some((s) => s === 'bonus')) playValueCoinSound();
        if (finalGrid[i].some((s) => s === 'scatter')) playScatterSound();
        // Count scatters landed so far (reels 0..i)
        let scattersSoFar = 0;
        for (let r = 0; r <= i; r++) if (reelHasScatter(r)) scattersSoFar++;
        // Check if any remaining reel has a scatter (potential for 3rd)
        let remainingHasScatter = false;
        for (let r = i + 1; r < REELS; r++) if (reelHasScatter(r)) { remainingHasScatter = true; break; }
        // Enter slow motion if 2+ scatters landed and remaining reels could have another
        const enterSlowMo = !slowMo && scattersSoFar >= 2 && remainingHasScatter;
        if (enterSlowMo) playScatterLongSound();
        setAnticipateReels((prev) => {
          const n = new Set(prev);
          n.delete(i);
          if (enterSlowMo) for (let r = i + 1; r < REELS; r++) n.add(r);
          return n;
        });
        if (i < REELS - 1) {
          stopReel(i + 1, enterSlowMo || slowMo);
        } else {
          if (enterSlowMo || slowMo) {
            stopScatterLongSound();
            setAnticipateReels(new Set());
          }
          const t2 = setTimeout(() => {
            settle(finalGrid, usingFree, serverWin);
          }, turbo ? 150 : 320);
          timers.current.push(t2);
        }
      }, gap);
      timers.current.push(t);
    };
    stopReel(0, false);
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
      if (totalWin > 0) setFreeSpinEnd({ total: totalWin });
    }
  }, [freeSpinsActive, spinning, freeSpins, showFreeSpinStart, bonusActive, coinMode, turbo, spin, totalWin]);

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
    settlePromiseRef.current = settleBet(bet, bonusPrize, 'argonauts', true);
    settlePromiseRef.current.then(() => { settlePromiseRef.current = null; }).catch(() => {});
    setLastWin(bonusPrize);
    setTotalWin((t) => t + bonusPrize);
    setMessage(`GOLDEN FLEECE · WON $${bonusPrize.toFixed(2)}${bonusExtra ? ' · ULTRA JACKPOT!' : ''}`);
    setSpinning(false);
    setBonusPrize(0);
    setBonusExtra(false);
  }, [bonusPrize, bonusExtra, setBalance, settleBet, bet]);

  // Gamble (risk) feature — card based
  const startRisk = useCallback(() => {
    if (pendingWin <= 0) return;
    setRiskMode(true);
    setRiskActive(false);
    setRiskStep(0);
    setRiskHistory([]);
    setRiskResult(null);
    setDealerCard(dealDealer());
    setPlayerCards(dealFour());
    setRevealedIdx(null);
    setRiskOutcome(null);
  }, [pendingWin]);

  const riskPick = useCallback((idx) => {
    if (riskResult || riskOutcome) return;
    const card = playerCards[idx];
    setRevealedIdx(idx);
    setRiskHistory((h) => [...h, card]);
    const pv = rankVal(card);
    const dv = rankVal(dealerCard);
    if (card === 'JOKER' || pv > dv) {
      setRiskOutcome('win');
      setPendingWin((w) => w * 2);
      setRiskStep((s) => {
        const ns = s + 1;
        if (ns >= MAX_RISK_STEPS) setRiskResult('maxed');
        return ns;
      });
    } else if (pv === dv) {
      setRiskOutcome('draw');
    } else {
      setRiskOutcome('lose');
      setRiskResult('lose');
    }
  }, [riskResult, riskOutcome, playerCards, dealerCard]);

  // Re-deal for the next attempt after a win or draw (pot unchanged on draw)
  const riskContinue = useCallback(() => {
    if (riskResult) return;
    setDealerCard(dealDealer());
    setPlayerCards(dealFour());
    setRevealedIdx(null);
    setRiskOutcome(null);
  }, [riskResult]);

  const collectRisk = useCallback(() => {
    settlePromiseRef.current = settleBet(bet, pendingWin, 'argonauts', false);
    settlePromiseRef.current.then(() => { settlePromiseRef.current = null; }).catch(() => {});
    setLastWin(pendingWin);
    setMessage(`RISK WIN · COLLECTED $${pendingWin.toFixed(2)}`);
    setRiskMode(false);
    setRiskActive(false);
    setPendingWin(0);
    setRiskHistory([]);
    setRiskResult(null);
    setDealerCard(null);
    setPlayerCards([]);
    setRevealedIdx(null);
    setRiskOutcome(null);
    setSpinning(false);
  }, [pendingWin, setBalance, settleBet, bet]);

  const loseRisk = useCallback(() => {
    setMessage('RISK GAME · LOST');
    setRiskMode(false);
    setRiskActive(false);
    setPendingWin(0);
    setRiskHistory([]);
    setRiskResult(null);
    setDealerCard(null);
    setPlayerCards([]);
    setRevealedIdx(null);
    setRiskOutcome(null);
    setSpinning(false);
    settlePromiseRef.current = settleBet(bet, 0, 'argonauts', false);
    settlePromiseRef.current.then(() => { settlePromiseRef.current = null; }).catch(() => {});
  }, [bet, settleBet]);

  const dismissCoinWin = useCallback(() => setCoinWin(null), []);
  const dismissFreeSpinEnd = useCallback(() => setFreeSpinEnd(null), []);

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
    setCoinDropped(new Set());
    setCoinDroppingReels(new Set());
    setShowCoinBanner(false);
    setCoinTriggerCount(0);
    setCoinWin(null);
    setFreeSpinEnd(null);
    coinModeRef.current = false;
    coinStuckRef.current = {};
    coinSpinsRef.current = 0;
    setMessage('Balance reset');
  };

  return {
    grid, balance, bet, spinning, spinningReels,
    lastWin, totalWin, message, winningPositions, winningLines,
    freeSpins, freeSpinsActive, showFreeSpinStart, startFreeSpins,
    bonusActive, bonusSteps, bonusPrize, bonusExtra, finishBonus,
    autoSpin, turbo, setBet, setTurbo, setAutoSpin,
    riskActive, riskMode, riskStep, riskHistory, riskResult, pendingWin,
    dealerCard, playerCards, revealedIdx, riskOutcome,
    startRisk, riskPick, riskContinue, collectRisk, loseRisk,
    coinMode, coinSpins, coinStuck, coinDropped, coinDroppingReels, showCoinBanner, coinTriggerCount, beginCoinSpins,
    coinWin, dismissCoinWin,
    freeSpinEnd, dismissFreeSpinEnd,
    anticipateReels, slowMoReels,
    spin, reset,
  };
}