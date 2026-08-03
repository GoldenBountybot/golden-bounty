import { useState, useRef, useEffect, useCallback } from 'react';
import {
  REELS, ROWS, generateGrid, evaluate, resolveBonus, forceWinGrid,
  FREE_SPINS_AWARD, BONUS_TRIGGER_COUNT, MAX_RISK_STEPS,
  coinTriggered, collectCoins, spinCoinRound, coinTotal, COIN_SPINS_START,
  valueCoinKey, isValueCoin,
} from './argonautsEngine';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import { savePendingRound, clearPendingRound, usePendingRoundRecovery } from '@/lib/pendingRound';
import { playReelLandSound, playValueCoinSound, playDoveSound, playAmphoraSound, playLyreSound } from './argoSounds';

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
  const { balance, setBalance, reset: resetBalance } = useCasinoBalance();
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

  const settings = useGameSettings('argonauts');
  const logActivity = useLogActivity('argonauts');
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
    setCoinWin({ total, coins: { ...stuck }, bet: betRef.current });
    coinStuckRef.current = {};
    coinSpinsRef.current = 0;
    coinModeRef.current = false;
    setCoinMode(false);
    setCoinStuck({});
    setCoinSpins(0);
    setCoinDropped(new Set());
    setBalance((b) => b + total);
    setLastWin(total);
    setTotalWin((t) => t + total);
    setMessage(`COIN FEATURE · WON $${total.toFixed(2)}`);
    // Restore a normal symbol board so the maroon coin grid doesn't linger.
    setGrid(generateGrid(false));
    setSpinningReels(new Set([0, 1, 2, 3, 4]));
    logActivity('argonauts', betRef.current, total, 'win', 0);
  }, [setBalance, logActivity]);

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
        const t2 = setTimeout(() => coinSpin(), turboRef.current ? 380 : 620);
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
  }, []);

  // Called when the player taps the trigger banner — begins the first coin spin.
  const beginCoinSpins = useCallback(() => {
    setShowCoinBanner(false);
    const t = setTimeout(() => coinSpin(), turboRef.current ? 400 : 600);
    timers.current.push(t);
  }, [coinSpin]);

  const settle = useCallback((finalGrid, usingFree) => {
    clearPendingRound('argonauts');
    setGrid(finalGrid);
    setSpinningReels(new Set([0, 1, 2, 3, 4]));
    const { wins, scatterCount, scatterPay, bonusCount, lineWin } = evaluate(finalGrid, lineBet, bet);
    const positions = new Set();
    wins.forEach((w) => w.positions.forEach((p) => positions.add(p)));
    setWinningPositions(positions);
    setWinningLines(wins.map((w) => ({ line: w.line, symbol: w.symbol, count: w.count, pay: w.pay })));

    // Dove (pigeon) symbol line win → play the dove sound.
    if (wins.some((w) => w.symbol === 'dove')) playDoveSound();
    // Amphora (cup) symbol line win → play the amphora sound.
    if (wins.some((w) => w.symbol === 'cup')) playAmphoraSound();
    // Golden Lyre (harp) symbol line win → play the lyre sound.
    if (wins.some((w) => w.symbol === 'harp')) playLyreSound();

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

    const wantWin = Math.random() < (rtpRef.current / 200);
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
        playReelLandSound();
        if (finalGrid[i].some(isValueCoin)) playValueCoinSound();
        if (i < REELS - 1) stopReel(i + 1);
        else {
          const t2 = setTimeout(() => settle(finalGrid, usingFree), turbo ? 150 : 320);
          timers.current.push(t2);
        }
      }, baseGap);
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
    setBalance((b) => b + pendingWin);
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
    logActivity('argonauts', bet, pendingWin, 'win', 0);
  }, [pendingWin, setBalance, logActivity, bet]);

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
    logActivity('argonauts', bet, 0, 'loss', 0);
  }, [logActivity, bet]);

  const dismissCoinWin = useCallback(() => setCoinWin(null), []);

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
    spin, reset,
  };
}