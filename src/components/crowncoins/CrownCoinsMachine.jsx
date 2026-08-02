import React, { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import { savePendingRound, clearPendingRound, getPendingRound } from '@/lib/pendingRound';
import { useToast } from '@/components/ui/use-toast';
import { SYMBOLS, JACKPOTS, spinGrid, evaluateGrid, runBonus, symbolByKey, cellValue, VALUE_COIN_IMG, JACKPOT_COINS, isValueCoin, valueCoinMult, isTierCoin, tierCoinLabel, isFreeSpinTrigger, spinFreeAccum, freeTotal } from '@/lib/crownCoinsEngine';
import { incBet, decBet } from '@/lib/betStepper';

import RoyalTreasuryBanner from './RoyalTreasuryBanner';
import BetTierBanners from './BetTierBanners';
import { Info, Zap, Plus, Minus, Play, RotateCw, Menu, DollarSign, X, Crown } from 'lucide-react';

// Falling-money backdrop used inside each reel strip so screen-blended symbols
// have a real backdrop to blend against even while the strip's transform
// animation isolates its stacking context during a spin.
const MONEY_BG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f28be6c98_.jpg';

const DiamondBG = (
  <div
    className="absolute inset-0 -z-10"
    style={{ background: 'radial-gradient(ellipse at center, #a01828 0%, #7a0e1c 45%, #4a0008 100%)' }}
  >
    <div
      className="absolute inset-0 opacity-30"
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(0,0,0,0.25) 0, rgba(0,0,0,0.25) 1px, transparent 1px, transparent 18px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.25) 0, rgba(0,0,0,0.25) 1px, transparent 1px, transparent 18px)',
      }}
    />
  </div>
);

function JackpotBadge({ tier, amount, color }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg px-2 py-1 w-full"
      style={{
        border: '2px solid #d4af37',
        background: `linear-gradient(to bottom, ${color}, rgba(0,0,0,0.5))`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 1px 3px rgba(0,0,0,0.6)',
      }}
    >
      <span className="text-[9px] font-black tracking-wider text-yellow-300" style={{ fontFamily: 'Georgia, serif' }}>{tier}</span>
      <span className="text-[11px] font-black text-white tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${amount.toFixed(2)}</span>
    </div>
  );
}

function Tile({ symKey, win, dim, bet, amount }) {
  const isCoin = symKey === 'coin';
  const isVC = isValueCoin(symKey);
  const s = isVC ? null : (symbolByKey(symKey) || SYMBOLS[0]);
  const vcVal = isVC ? valueCoinMult(symKey) * bet : 0;
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden w-full h-full"
      style={{
        background: 'transparent',
        border: win ? '2px solid #ffd24a' : 'none',
        boxShadow: win
          ? '0 0 12px rgba(255,210,80,0.9), inset 0 0 0 2px rgba(255,235,150,0.9)'
          : 'none',
        opacity: dim ? 0.5 : 1,
        transition: 'opacity .2s',
      }}
    >
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        style={{ background: 'transparent' }}
      >
        {isVC ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img src={VALUE_COIN_IMG} alt="coin" className="w-full h-full object-contain" draggable={false} style={{ mixBlendMode: 'screen' }} />
            <span className="absolute font-black text-yellow-100" style={{ fontSize: isTierCoin(symKey) ? '9px' : '10px', textShadow: '0 1px 2px #000, 0 0 3px rgba(0,0,0,0.85)', fontFamily: 'Georgia, serif' }}>{isTierCoin(symKey) ? tierCoinLabel(symKey) : `$${vcVal.toFixed(2)}`}</span>
          </div>
        ) : (
          <img
            src={s.image}
            alt={s.name}
            className="w-full h-full object-contain"
            draggable={false}
            style={{ mixBlendMode: 'screen' }}
          />
        )}
        {win && (
          <span
            className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: 'inset 0 0 12px rgba(255,220,120,0.8)', background: 'radial-gradient(circle at center, rgba(255,235,150,0.25), transparent 70%)' }}
          />
        )}
        {amount != null && (
          <span
            className="absolute pointer-events-none"
            style={{
              right: '2px',
              bottom: '2px',
              transform: 'none',
              fontFamily: 'Rye, Georgia, serif',
              fontWeight: 400,
              fontSize: 'clamp(10px, 3vw, 14px)',
              color: '#ffd24a',
              textShadow: '0 0 3px #000, 0 0 6px rgba(0,0,0,0.95), 0 1px 2px #5a3a06',
              animation: 'saWinPop 0.35s ease-out',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
            }}
          >
            ${Number(amount).toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}

// A single reel column — wild-bounty style: continuous downward reelFall loop
// while spinning (seamless because last block == first block, so no blur needed),
// then a reelLand bounce when it stops.
function ReelColumn({ result, phase, winMask, speed, bet, colIndex, amountCell, anticipate }) {
  // result: 3 keys (top, mid, bottom). phase: 'idle' | 'spin' | 'land'
  const [spinStrip, setSpinStrip] = useState(() => [...result]);

  useEffect(() => {
    if (phase === 'spin') {
      const r = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].key;
      const b0 = [r(), r(), r()];
      // 4 blocks of 3; last block == first block → seamless -75%→0 loop
      setSpinStrip([...b0, r(), r(), r(), r(), r(), r(), ...b0]);
    }
  }, [phase]);

  const showResult = phase !== 'spin';
  const strip = showResult ? [...result] : spinStrip;

  // Slow-motion drop for the anticipated reel: longer loop duration.
  const spinSpeed = anticipate ? speed * 2.6 : speed;
  const anim =
    phase === 'spin'
      ? `reelFall ${spinSpeed}s linear infinite`
      : phase === 'land'
      ? 'ccReelLand 0.45s ease-out'
      : 'none';

  const showGlow = anticipate && phase !== 'idle';

  return (
    <div className="relative flex-1 overflow-hidden" style={{ aspectRatio: '1 / 2.1', background: 'transparent', borderRight: colIndex < 2 ? '1px solid rgba(212,175,55,0.35)' : 'none' }}>
      {showGlow && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-2 z-30 pointer-events-none"
            style={{
              background: 'linear-gradient(to right, rgba(255,210,80,0.95), rgba(255,235,150,0.2) 70%, transparent)',
              boxShadow: '0 0 14px 2px rgba(255,210,80,0.9), inset 0 0 6px rgba(255,235,150,0.8)',
              animation: 'ccPulse 0.55s ease-in-out infinite',
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-2 z-30 pointer-events-none"
            style={{
              background: 'linear-gradient(to left, rgba(255,210,80,0.95), rgba(255,235,150,0.2) 70%, transparent)',
              boxShadow: '0 0 14px 2px rgba(255,210,80,0.9), inset 0 0 6px rgba(255,235,150,0.8)',
              animation: 'ccPulse 0.55s ease-in-out infinite',
            }}
          />
        </>
      )}
      <div className={showResult ? "absolute inset-0 grid grid-rows-3" : "flex flex-col w-full"} style={{ animation: anim, willChange: phase === 'spin' ? 'transform' : 'auto', backgroundImage: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${MONEY_BG})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {strip.map((k, i) => (
          <div key={i} className={showResult ? "overflow-hidden h-full" : ""} style={showResult ? {} : { width: '100%', aspectRatio: '1 / 0.7' }}>
            <Tile symKey={k} win={showResult && winMask[i]} dim={showResult && winMask.some(Boolean) && !winMask[i]} bet={bet} amount={amountCell && amountCell.col === colIndex && amountCell.row === i ? amountCell.amount : null} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CrownCoinsMachine() {
  const { balance, setBalance } = useCasinoBalance();
  const { rtp, loading: sLoading, minBet, maxBet } = useGameSettings('crown-coins');
  const logActivity = useLogActivity();
  const { toast } = useToast();

  // grid stored as 9 keys row-major; reels = 3 columns each 3 rows
  const [reels, setReels] = useState(() => [
    ['lemon', 'bell', 'plum'],
    ['watermelon', 'bar', 'cherry'],
    ['seven', 'plum', 'orange'],
  ]);
  const [phases, setPhases] = useState(['idle', 'idle', 'idle']);
  const [spinning, setSpinning] = useState(false);
  const [winMask, setWinMask] = useState(() => [[false, false, false], [false, false, false], [false, false, false]]);
  const [lastWin, setLastWin] = useState(0);
  const [amountCell, setAmountCell] = useState(null);
  const [bet, setBet] = useState(0.10);
  const [bonus, setBonus] = useState(null);
  const [revealStep, setRevealStep] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [freeSpins, setFreeSpins] = useState(0);
  const freeSpinsRef = useRef(0);
  const stuckRef = useRef(new Array(9).fill(null));
  const [stuckView, setStuckView] = useState(new Array(9).fill(null));
  const timers = useRef([]);
  const autoRef = useRef(false);
  const preBonusRef = useRef(null);
  const reelsRef = useRef(null);
  const bannerRef = useRef(null);
  const [flyCoins, setFlyCoins] = useState([]);
  const [triggerGlow, setTriggerGlow] = useState([]);
  const [showRoyalBanner, setShowRoyalBanner] = useState(false);
  const [royalWin, setRoyalWin] = useState(null);
  const [anticipateCol, setAnticipateCol] = useState(-1);

  const clearTimers = () => { timers.current.forEach(t => clearTimeout(t)); timers.current = []; };

  useEffect(() => () => clearTimers(), []);

  const doSpin = useCallback(async () => {
    if (spinning) return;
    const isFree = freeSpinsRef.current > 0;
    if (!isFree) {
      if (bet <= 0) { toast({ title: 'Set a bet amount' }); return; }
      if (balance < bet) { toast({ title: 'Insufficient balance' }); autoRef.current = false; setAutoSpin(false); return; }
    }
    setSpinning(true);
    setWinMask([[false,false,false],[false,false,false],[false,false,false]]);
    setLastWin(0);
    setAmountCell(null);
    if (!isFree) setBalance(b => Math.max(0, b - bet));
    clearTimers();

    // compute final result
    let resultGrid;
    let freeDropped = 0;
    if (isFree) {
      const r = spinFreeAccum(stuckRef.current);
      stuckRef.current = r.stuck;
      setStuckView(r.stuck);
      freeDropped = r.dropped;
      // Reels show regular symbols behind; stuck coins render via the overlay.
      const REG = ['cherry', 'lemon', 'orange', 'plum', 'watermelon', 'grape', 'bell', 'bar', 'seven'];
      resultGrid = r.grid.map((k, i) => (r.stuck[i] ? REG[Math.floor(Math.random() * REG.length)] : k));
    } else {
      resultGrid = spinGrid(rtp);
    }
    const cols = [
      [resultGrid[0], resultGrid[3], resultGrid[6]],
      [resultGrid[1], resultGrid[4], resultGrid[7]],
      [resultGrid[2], resultGrid[5], resultGrid[8]],
    ];

    // Pre-compute the full settle outcome now so a mid-spin exit can be
    // recovered exactly. The bonus re-roll is deterministic from this point.
    let preWin = 0;
    preBonusRef.current = null;
    let preTriggered = false;
    let postFreeSpins = 0;
    if (isFree) {
      postFreeSpins = freeDropped > 0 ? 3 : freeSpinsRef.current - 1;
    } else {
      const { totalMul, coins, scatterMul } = evaluateGrid(resultGrid);
      preWin = totalMul * (bet / 5) + scatterMul * bet;
      if (coins >= 3) { preBonusRef.current = runBonus(bet, rtp); preWin += preBonusRef.current.total; }
      preTriggered = isFreeSpinTrigger(resultGrid);
      postFreeSpins = preTriggered ? 3 : 0;
      if (preTriggered) {
        // Free spins start with the two triggering side value coins stuck.
        const stuck = new Array(9).fill(null);
        [0, 3, 6].forEach(i => { if (isValueCoin(resultGrid[i])) stuck[i] = resultGrid[i]; });
        [2, 5, 8].forEach(i => { if (isValueCoin(resultGrid[i])) stuck[i] = resultGrid[i]; });
        stuckRef.current = stuck;
        setStuckView(stuck);
      }
    }
    savePendingRound('crown-coins', {
      win: preWin,
      bet,
      state: {
        stuck: [...stuckRef.current],
        freeSpins: postFreeSpins,
      },
    });

    // Anticipation: a value coin in the first reel + a Crown Coin in the
    // center → the third reel drops in slow motion with golden side glow.
    const col0HasValue = [0, 3, 6].some(i => isValueCoin(resultGrid[i]));
    const centerCrown = resultGrid[4] === 'coin';
    const anticipate = !isFree && col0HasValue && centerCrown;
    setAnticipateCol(anticipate ? 2 : -1);

    // start all reels spinning
    setReels(cols);
    setPhases(['spin', 'spin', 'spin']);

    const base = turbo ? 420 : 720;
    const step = turbo ? 160 : 260;
    const landMs = 460;
    const anticiDelay = anticipate ? 900 : 0;

    // staggered land per reel; the anticipated third reel lingers longer
    cols.forEach((col, i) => {
      const extra = (i === 2 && anticipate) ? anticiDelay : 0;
      const t1 = setTimeout(() => {
        setPhases(prev => prev.map((p, idx) => (idx === i ? 'land' : p)));
      }, base + i * step + extra);
      timers.current.push(t1);
    });

    // after the last reel lands, settle + evaluate
    const settleAt = base + 2 * step + anticiDelay + landMs;
    const tEnd = setTimeout(async () => {
      setPhases(['idle', 'idle', 'idle']);

      // Free spins: coins accumulate and stick; no line wins, no flying coins.
      if (isFree) {
        const runningTotal = freeTotal(stuckRef.current, bet);
        const allFilled = stuckRef.current.every(k => !!k);
        // A value coin dropping this spin resets the 3-spin counter.
        // No drop → counter decrements; reaching 0 ends the free-spin round.
        if (freeDropped > 0) {
          freeSpinsRef.current = 3;
        } else {
          freeSpinsRef.current -= 1;
        }
        setFreeSpins(freeSpinsRef.current);
        setWinMask([[false,false,false],[false,false,false],[false,false,false]]);
        setLastWin(runningTotal);
        setSpinning(false);
        logActivity('crown-coins', 0, 0, 'push');
        try { base44.analytics.track({ eventName: 'crown_coins_free_spin', properties: { bet, stuck: runningTotal, remaining: freeSpinsRef.current, dropped: freeDropped } }); } catch {}

        if (freeSpinsRef.current > 0 && !allFilled) {
          const tNext = setTimeout(() => doSpin(), 700);
          timers.current.push(tNext);
        } else {
          // free spins ended — pay out accumulated total
          const total = +runningTotal.toFixed(2);
          if (total > 0) setBalance(b => b + total);
          setLastWin(total);
          stuckRef.current = new Array(9).fill(null);
          setStuckView(new Array(9).fill(null));
          setRoyalWin(total);
          setShowRoyalBanner(true);
          clearPendingRound('crown-coins');
        }
        return;
      }

      const { lines, totalMul, coins, scatterMul } = evaluateGrid(resultGrid);
      let win = totalMul * (bet / 5) + scatterMul * bet;

      // build win mask per reel (which rows are part of a winning line)
      const mask = cols.map(() => [false, false, false]);
      lines.forEach(ln => {
        ln.idxs.forEach(idx => {
          const col = idx % 3;
          const row = Math.floor(idx / 3);
          mask[col][row] = true;
        });
      });
      // Free spin trigger: Crown Coin in center + value coins in both side columns.
      let triggered = false;
      if (!isFree && isFreeSpinTrigger(resultGrid)) {
        triggered = true;
        mask[1][1] = true; // center Crown Coin glows
        [0, 3, 6].forEach(i => { if (isValueCoin(resultGrid[i])) mask[0][Math.floor(i / 3)] = true; });
        [2, 5, 8].forEach(i => { if (isValueCoin(resultGrid[i])) mask[2][Math.floor(i / 3)] = true; });
        freeSpinsRef.current = 3;
        setFreeSpins(3);
        // Free spins start with the two triggering side value coins already
        // stuck on the board; the Crown Coin itself does not carry over.
        const stuck = new Array(9).fill(null);
        [0, 3, 6].forEach(i => { if (isValueCoin(resultGrid[i])) stuck[i] = resultGrid[i]; });
        [2, 5, 8].forEach(i => { if (isValueCoin(resultGrid[i])) stuck[i] = resultGrid[i]; });
        stuckRef.current = stuck;
        setStuckView(stuck);
        const tIdxs = [4];
        [0, 3, 6].forEach(i => { if (isValueCoin(resultGrid[i])) tIdxs.push(i); });
        [2, 5, 8].forEach(i => { if (isValueCoin(resultGrid[i])) tIdxs.push(i); });
        setTriggerGlow(tIdxs);
        const tGlow = setTimeout(() => setTriggerGlow([]), 1300);
        timers.current.push(tGlow);
        setShowRoyalBanner(true);
      }
      setWinMask(mask);

      let bonusResult = preBonusRef.current;
      if (bonusResult) win += bonusResult.total;

      if (win > 0) setBalance(b => b + win);
      setLastWin(win);
      setSpinning(false);
      // Base game fully settled and no free-spin round started — clear the
      // pending record so recovery never double-pays. (On a trigger the round
      // continues; the saved stuck + freeSpins stays for recovery.)
      if (freeSpinsRef.current === 0) clearPendingRound('crown-coins');

      // Show the win amount on the first winning symbol (red stylized font).
      // Skip during free-spin triggers (coins stick) and bonus-only wins.
      if (win > 0 && !triggered && lines.length > 0) {
        let first = null;
        for (let c = 0; c < 3 && !first; c++) {
          for (let r = 0; r < 3 && !first; r++) {
            if (mask[c][r]) first = { col: c, row: r };
          }
        }
        if (first) setAmountCell({ ...first, amount: win });
      }

      // Value coins fly to the Crown Coins banner — visual + sound only, no balance change.
      // Skip on a trigger spin: the trigger coins stick instead of flying away.
      if (!triggered && reelsRef.current && bannerRef.current) {
        const rc = reelsRef.current.getBoundingClientRect();
        const bc = bannerRef.current.getBoundingClientRect();
        const cellW = rc.width / 3, cellH = rc.height / 3;
        const coins = [];
        resultGrid.forEach((k, i) => {
          if (isValueCoin(k)) {
            const col = i % 3, row = Math.floor(i / 3);
            const fx = rc.left + (col + 0.5) * cellW;
            const fy = rc.top + (row + 0.5) * cellH;
            coins.push({ id: i + '-' + Date.now(), fx, fy, dx: bc.left + bc.width / 2 - fx, dy: bc.top + bc.height / 2 - fy, mult: valueCoinMult(k), label: isTierCoin(k) ? tierCoinLabel(k) : null });
          }
        });
        if (coins.length) {
          setFlyCoins(coins);
          const tClear = setTimeout(() => setFlyCoins([]), 1950);
          timers.current.push(tClear);
        }
      }
      if (bonusResult) { setBonus(bonusResult); setRevealStep(0); autoRef.current = false; setAutoSpin(false); }
      logActivity('crown-coins', bet, win, win > 0 ? 'win' : 'loss');
      try { base44.analytics.track({ eventName: 'crown_coins_spin', properties: { bet, win: Math.round(win * 100) / 100, coins, free: isFree } }); } catch {}

      if (bonusResult) {
        // bonus modal open — pause
      } else if (triggered) {
        // free-spin round announced by the Royal Treasury banner —
        // wait for the player to click it before spinning starts.
      } else if (freeSpinsRef.current > 0) {
        const tNext = setTimeout(() => doSpin(), 700);
        timers.current.push(tNext);
      } else if (autoRef.current) {
        const tAuto = setTimeout(() => { if (autoRef.current) doSpin(); }, 500);
        timers.current.push(tAuto);
      }
    }, settleAt);
    timers.current.push(tEnd);
  }, [spinning, bet, balance, rtp, turbo, setBalance, logActivity, toast]);

  // Recover an interrupted round on mount: credit the pending win and, if the
  // player was inside a free-spin round, restore the stuck coins + remaining
  // spins and resume automatically.
  useEffect(() => {
    const r = getPendingRound('crown-coins');
    if (!r) return;
    clearPendingRound('crown-coins');
    const win = Number(r.win) || 0;
    if (win > 0) setBalance(b => b + win);
    const state = r.state;
    if (state && state.freeSpins > 0) {
      stuckRef.current = (state.stuck && state.stuck.length === 9)
        ? [...state.stuck]
        : new Array(9).fill(null);
      setStuckView(stuckRef.current);
      freeSpinsRef.current = state.freeSpins;
      setFreeSpins(state.freeSpins);
      setShowRoyalBanner(false);
      // Re-save a round-only snapshot (win already credited) so a second
      // refresh in the 600ms gap before doSpin fires still recovers the round.
      savePendingRound('crown-coins', { win: 0, bet, state: { stuck: [...stuckRef.current], freeSpins: state.freeSpins } });
      try { base44.analytics.track({ eventName: 'crown_coins_round_resumed', properties: { freeSpins: state.freeSpins, credited: win } }); } catch {}
      const t = setTimeout(() => doSpin(), 600);
      timers.current.push(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleAuto = () => {
    const next = !autoSpin;
    setAutoSpin(next);
    autoRef.current = next;
    if (next && !spinning) doSpin();
  };

  const closeBonus = () => { setBonus(null); setRevealStep(0); };
  const revealAll = () => setRevealStep(9);
  const continueRoyalBanner = () => {
    setShowRoyalBanner(false);
    if (royalWin != null) {
      setRoyalWin(null);
      if (autoRef.current) {
        const tAuto = setTimeout(() => { if (autoRef.current) doSpin(); }, 400);
        timers.current.push(tAuto);
      }
    } else {
      doSpin();
    }
  };

  const decBetLocal = () => setBet(b => decBet(b));
  const incBetLocal = () => setBet(b => incBet(b));

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      {DiamondBG}

      <div className="max-w-lg mx-auto px-3 pt-0 pb-4 flex flex-col gap-0">
        <div className="flex items-center justify-between -mb-6">
          <button onClick={() => setShowInfo(true)} className="w-6 h-6 rounded-full border border-white/70 flex items-center justify-center text-white/90 bg-black/20">
            <Info className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-bold tracking-widest text-yellow-300/80" style={{ fontFamily: 'Georgia, serif' }}>CROWN COINS</span>
          <span className="w-6" />
        </div>

        <div ref={bannerRef} className="relative flex items-center justify-center mt-1 mx-auto" style={{ width: '78%' }}>
          <BetTierBanners bet={bet} />
          <img
            src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/9e18b75a6_file_00000000700081fab7c3b36c02964e06.png"
            alt="Crown Coins"
            className="w-full relative z-0"
            style={{ mixBlendMode: 'screen', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.45))' }}
          />
        </div>

        <div
          className="relative rounded-lg p-1 overflow-hidden -mt-16 w-full"
          style={{
            border: '2px solid #d4af37',
            boxShadow: 'inset 0 2px 6px rgba(255,235,150,0.4), inset 0 0 0 1px #8a5a00, 0 4px 14px rgba(0,0,0,0.6)',
            background: 'linear-gradient(to bottom, #b8860b, #6b4a08)',
          }}
        >
          <img
            src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f28be6c98_.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
            style={{ opacity: 1 }}
          />
          <div ref={reelsRef} className="relative flex items-start rounded-md overflow-hidden" style={{ background: 'transparent' }}>
            {reels.map((col, i) => (
              <ReelColumn key={i} result={col} phase={phases[i]} winMask={winMask[i]} speed={turbo ? 0.24 : 0.5} bet={bet} colIndex={i} amountCell={amountCell} anticipate={anticipateCol === i} />
            ))}
            {stuckView.some(k => !!k) && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-20" style={{ gap: '0' }}>
                {stuckView.map((k, i) => (
                  <div key={i} className="flex items-center justify-center">
                    {k && (
                      <div
                        className="relative w-full h-full flex items-center justify-center"
                        style={{ animation: 'ccReelLand 0.45s ease-out' }}
                      >
                        {/* Western framed tile — gilt trim over dark money pattern (matches reels) */}
                        <div
                          className="absolute inset-0 rounded-[5px] pointer-events-none overflow-hidden"
                          style={{
                            border: '3px solid #6b4a08',
                            boxShadow:
                              'inset 0 0 0 2px #d4af37, 0 2px 5px rgba(0,0,0,0.6)',
                            backgroundImage: `linear-gradient(rgba(0,0,0,0.70), rgba(0,0,0,0.70)), url(${MONEY_BG})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                        {/* Inner gilt trim line */}
                        <div
                          className="absolute inset-[4px] rounded-[3px] pointer-events-none"
                          style={{
                            border: '1px solid rgba(212,175,55,0.55)',
                            boxShadow: 'inset 0 0 6px rgba(0,0,0,0.4)',
                            background: 'transparent',
                          }}
                        />
                        {/* Gilt corner studs */}
                        {[
                          { top: '3px', left: '3px' },
                          { top: '3px', right: '3px' },
                          { bottom: '3px', left: '3px' },
                          { bottom: '3px', right: '3px' },
                        ].map((p, s) => (
                          <span
                            key={s}
                            className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
                            style={{
                              ...p,
                              background: 'radial-gradient(circle at 35% 30%, #ffe9a8, #b8860b 60%, #5a3a06)',
                              boxShadow: '0 0 3px rgba(255,200,80,0.8), inset 0 0 0 1px #3a2400',
                            }}
                          />
                        ))}
                        <div
                          className="absolute inset-[5px] rounded-[3px] pointer-events-none"
                          style={{
                            border: '2px solid #d4af37',
                            borderRadius: '4px',
                            animation: 'ccFireFlicker 0.9s ease-in-out infinite',
                          }}
                        />
                        {/* Flame tongues licking along all four borders */}
                        {[
                          { side: 'bottom', left: '15%', delay: 0 },
                          { side: 'bottom', left: '45%', delay: 0.3 },
                          { side: 'bottom', left: '75%', delay: 0.6 },
                          { side: 'top',    left: '30%', delay: 0.15 },
                          { side: 'top',    left: '60%', delay: 0.45 },
                          { side: 'left',   top: '30%', delay: 0.25 },
                          { side: 'left',   top: '65%', delay: 0.55 },
                          { side: 'right',  top: '35%', delay: 0.1 },
                          { side: 'right',  top: '70%', delay: 0.4 },
                        ].map((f, e) => (
                          <span
                            key={e}
                            className="absolute pointer-events-none"
                            style={{
                              ...(f.side === 'bottom' ? { bottom: '-4px', left: f.left, transform: 'translateX(-50%)', width: '7px', height: '14px' } :
                                 f.side === 'top'    ? { top: '-4px',    left: f.left, transform: 'translateX(-50%)', width: '7px', height: '14px' } :
                                 f.side === 'left'   ? { left: '-4px',   top: f.top,   transform: 'translateY(-50%) rotate(-90deg)', width: '7px', height: '14px' } :
                                                        { right: '-4px',  top: f.top,   transform: 'translateY(-50%) rotate(90deg)', width: '7px', height: '14px' }),
                              transformOrigin: f.side === 'bottom' ? 'bottom center' : f.side === 'top' ? 'top center' : 'center center',
                              borderRadius: '50% 50% 30% 30%',
                              background: 'linear-gradient(to top, rgba(255,40,0,0.9), rgba(255,140,0,1) 45%, rgba(255,220,80,0.95) 85%, transparent)',
                              filter: 'blur(1.2px) drop-shadow(0 0 5px rgba(255,120,0,0.8))',
                              animation: `ccFlameTongue ${0.85 + e * 0.06}s ease-in-out ${f.delay}s infinite`,
                            }}
                          />
                        ))}
                        {/* Embers rising along the border */}
                        {[0, 1, 2, 3].map(e => (
                          <span
                            key={e}
                            className="absolute pointer-events-none rounded-full"
                            style={{
                              left: ['18%', '48%', '72%', '34%'][e],
                              bottom: '14%',
                              width: '3px',
                              height: '3px',
                              background: 'radial-gradient(circle, #ffd24a, rgba(255,120,0,0.8) 60%, transparent)',
                              animation: `ccFireEmber ${0.8 + e * 0.18}s ease-out ${e * 0.25}s infinite`,
                              '--ex': `${(e % 2 === 0 ? 1 : -1) * (4 + e * 2)}px`,
                            }}
                          />
                        ))}
                        <img src={k === 'coin' ? symbolByKey('coin').image : VALUE_COIN_IMG} alt="" className="relative w-full h-full object-contain" draggable={false} style={{ filter: 'drop-shadow(0 0 8px rgba(255,210,80,0.85))', mixBlendMode: 'screen' }} />
                        {k !== 'coin' && (
                          <span className="absolute font-black text-yellow-100 z-10" style={{ fontSize: isTierCoin(k) ? '10px' : '11px', textShadow: '0 1px 2px #000, 0 0 3px rgba(0,0,0,0.85)', fontFamily: 'Georgia, serif' }}>{isTierCoin(k) ? tierCoinLabel(k) : `$${(valueCoinMult(k) * bet).toFixed(2)}`}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {triggerGlow.length > 0 && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-30" style={{ gap: '0' }}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-center">
                    {triggerGlow.includes(i) && (
                      <div className="w-full h-full rounded-[2px]" style={{ animation: 'ccTriggerGlow 1.3s ease-out' }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {freeSpins > 0 && (
          <div className="flex items-center justify-center gap-1.5 -mt-1 mb-1">
            {[3, 2, 1].map(n => {
              const current = freeSpins === n;
              return (
                <div
                  key={n}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-black"
                  style={{
                    border: current ? '2px solid #ffd24a' : '1px solid rgba(212,175,55,0.4)',
                    background: current ? 'radial-gradient(circle at center, #fff2c0, #e8a93a 70%, #b8860b)' : 'rgba(0,0,0,0.5)',
                    color: current ? '#3a2400' : 'rgba(255,235,150,0.5)',
                    boxShadow: current ? '0 0 10px rgba(255,210,80,0.9), inset 0 0 0 1px #8a5a00' : 'none',
                    fontFamily: 'Georgia, serif',
                    transition: 'all .2s',
                  }}
                >
                  {n}
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="rounded-md bg-black/50 border border-yellow-700/40 py-1">
            <div className="text-[8px] text-yellow-300/70 font-bold tracking-wider">BET</div>
            <div className="text-xs font-black text-white tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${bet.toFixed(2)}</div>
          </div>
          <div className="rounded-md bg-black/50 border border-yellow-700/40 py-1">
            <div className="text-[8px] text-yellow-300/70 font-bold tracking-wider">LAST WIN</div>
            <div className={`text-xs font-black tabular-nums ${lastWin > 0 ? 'text-emerald-300' : 'text-white/60'}`} style={{ fontFamily: 'Georgia, serif' }}>${lastWin.toFixed(2)}</div>
          </div>
          <div className="rounded-md bg-black/50 border border-yellow-700/40 py-1">
            <div className="text-[8px] text-yellow-300/70 font-bold tracking-wider">FIXED LINES</div>
            <div className="text-xs font-black text-white tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>5</div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 py-1">
          <button onClick={() => setTurbo(t => !t)} className={`w-9 h-9 rounded-full flex items-center justify-center border ${turbo ? 'border-yellow-400 text-yellow-300 bg-yellow-500/20' : 'border-white/40 text-white/80 bg-black/30'}`}>
            <Zap className="w-5 h-5" />
          </button>
          <button onClick={decBetLocal} disabled={spinning} className="w-10 h-10 rounded-full flex items-center justify-center border border-yellow-600/60 text-yellow-200 bg-black/40 disabled:opacity-40">
            <Minus className="w-6 h-6" />
          </button>

          <button
            onClick={doSpin}
            disabled={spinning || sLoading || freeSpins > 0}
            className="relative w-16 h-16 rounded-full flex items-center justify-center disabled:opacity-60"
            style={{
              background: 'radial-gradient(circle at center, #fff2c0 0%, #e8a93a 55%, #b8860b 100%)',
              boxShadow: '0 0 18px rgba(255,210,80,0.8), inset 0 2px 4px rgba(255,255,255,0.6), inset 0 0 0 2px #8a5a00',
            }}
          >
            {spinning ? <RotateCw className="w-7 h-7 text-stone-900 animate-spin" /> : <Play className="w-7 h-7 text-stone-900 ml-1" />}
          </button>

          <button onClick={incBetLocal} disabled={spinning} className="w-10 h-10 rounded-full flex items-center justify-center border border-yellow-600/60 text-yellow-200 bg-black/40 disabled:opacity-40">
            <Plus className="w-6 h-6" />
          </button>
          <button onClick={toggleAuto} className={`w-9 h-9 rounded-full flex items-center justify-center border ${autoSpin ? 'border-yellow-400 text-yellow-300 bg-yellow-500/20' : 'border-white/40 text-white/80 bg-black/30'}`}>
            <RotateCw className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-[10px] font-bold tracking-widest text-yellow-200/80">{freeSpins > 0 ? `FREE SPINS: ${freeSpins}` : (spinning ? 'GOOD LUCK!' : 'PLACE YOUR BET')}</p>

        <div className="flex items-center justify-between px-1">
          <button className="w-8 h-8 flex items-center justify-center text-white/80"><Menu className="w-5 h-5" /></button>
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-yellow-300/70 font-bold tracking-wider">BALANCE</span>
            <span className="text-sm font-black text-yellow-200 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${balance.toFixed(2)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-yellow-300/70 font-bold tracking-wider">CURRENCY</span>
            <span className="text-xs font-black text-white" style={{ fontFamily: 'Georgia, serif' }}>USD</span>
          </div>
          <button className="w-8 h-8 rounded-full flex items-center justify-center border border-yellow-600/50 text-yellow-200 bg-black/40">
            <DollarSign className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl p-4 relative" style={{ border: '3px solid #d4af37', background: 'linear-gradient(to bottom, #2a0608, #140204)' }}>
            <button onClick={() => setShowInfo(false)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 border border-yellow-700/50 flex items-center justify-center text-yellow-100"><X className="w-4 h-4" /></button>
            <h3 className="text-lg font-black text-yellow-300 mb-2" style={{ fontFamily: 'Rye, Georgia, serif' }}>Paytable</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {SYMBOLS.map(s => (
                <div key={s.key} className="flex items-center gap-2 rounded-md p-1.5" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(212,175,55,0.3)' }}>
                  <img src={s.image} alt={s.name} className="w-9 h-9 object-cover rounded" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-yellow-100" style={{ fontFamily: 'Georgia, serif' }}>{s.name}</span>
                    <span className="text-[10px] text-yellow-300/80" style={{ fontFamily: 'Georgia, serif' }}>{s.bonus ? '3+ → Royal Treasury' : `${s.pay}× line`}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-yellow-200/70 italic text-center">5 fixed lines · 3-of-a-kind pays · 3+ Crown Coins trigger the Royal Treasury bonus</p>
          </div>
        </div>
      )}

      {bonus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl p-4 relative" style={{ border: '3px solid #d4af37', background: 'linear-gradient(to bottom, #2a0608, #140204)' }}>
            <button onClick={closeBonus} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 border border-yellow-700/50 flex items-center justify-center text-yellow-100"><X className="w-4 h-4" /></button>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-amber-300" />
              <h3 className="text-lg font-black text-yellow-300" style={{ fontFamily: 'Rye, Georgia, serif' }}>Royal Treasury</h3>
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <p className="text-center text-[10px] text-yellow-200/70 italic mb-3">{bonus.royal ? 'Royal Coin ×1.5 boost active!' : 'Tap coins to reveal the treasury'}</p>
            <div className="grid grid-cols-3 gap-1.5">
              {bonus.cells.map((cell, i) => {
                const revealed = revealStep > i;
                const isJackpot = cell.type === 'jackpot';
                const isRoyal = i >= 6;
                const coinImg = isJackpot ? JACKPOT_COINS[cell.tier] : VALUE_COIN_IMG;
                const val = cellValue(cell, bet);
                return (
                  <div
                    key={i}
                    onClick={() => setRevealStep(s => Math.max(s, i + 1))}
                    className="aspect-square flex items-center justify-center rounded-md cursor-pointer relative overflow-hidden"
                    style={{
                      border: `2px solid ${revealed ? (isJackpot ? '#ffd24a' : isRoyal ? '#e8c873' : '#d4af37') : 'rgba(190,140,55,0.35)'}`,
                      background: revealed ? (isJackpot ? 'linear-gradient(135deg,#7a0e1c,#2a0408)' : isRoyal ? 'linear-gradient(135deg,#7a5210,#2a1a06)' : 'linear-gradient(135deg,#4a3416,#211608)') : 'rgba(0,0,0,0.4)',
                      boxShadow: revealed && (isJackpot || isRoyal) ? '0 0 12px rgba(255,210,80,0.75)' : revealed ? '0 0 8px rgba(255,210,80,0.5)' : 'none',
                    }}
                  >
                    {revealed ? (
                      <div className="relative flex flex-col items-center justify-center w-full h-full">
                        <img src={coinImg} alt={isJackpot ? cell.tier : 'coin'} className="w-12 h-12 object-contain" style={{ mixBlendMode: 'screen' }} />
                        {isJackpot ? (
                          <span className="text-[10px] font-black text-yellow-300 mt-0.5" style={{ fontFamily: 'Rye, Georgia, serif' }}>{cell.tier}</span>
                        ) : (
                          <span className="text-[11px] font-black text-yellow-100 -mt-1" style={{ fontFamily: 'Georgia, serif' }}>${val.toFixed(2)}</span>
                        )}
                      </div>
                    ) : (
                      <img src={VALUE_COIN_IMG} alt="?" className="w-12 h-12 object-contain opacity-30" style={{ mixBlendMode: 'screen' }} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <button onClick={revealAll} className="px-3 py-1.5 rounded-md border border-yellow-700/50 text-yellow-100 text-xs font-bold italic" style={{ fontFamily: 'Georgia, serif', background: 'rgba(0,0,0,0.4)' }}>Reveal All</button>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-yellow-200/70 italic" style={{ fontFamily: 'Georgia, serif' }}>Total</span>
                <span className="text-xl font-black text-emerald-300 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${bonus.total.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={closeBonus} className="mt-3 w-full py-2 rounded-lg text-stone-950 font-black italic" style={{ fontFamily: 'Georgia, serif', background: 'linear-gradient(to bottom,#f5d590,#e8a93a)' }}>Collect</button>
          </div>
        </div>
      )}

      {showRoyalBanner && <RoyalTreasuryBanner onContinue={continueRoyalBanner} winAmount={royalWin} />}

      {flyCoins.map(c => (
        <div key={c.id} className="fixed pointer-events-none" style={{ left: c.fx, top: c.fy, transform: 'translate(-50%, -50%)' }}>
          <div className="relative" style={{ animation: 'ccCoinFly 1.8s ease-in forwards', '--dx': c.dx + 'px', '--dy': c.dy + 'px' }}>
            <div className="relative w-9 h-9 flex items-center justify-center">
              <img src={VALUE_COIN_IMG} alt="" className="w-full h-full object-contain" style={{ WebkitMaskImage: `url(${VALUE_COIN_IMG})`, maskImage: `url(${VALUE_COIN_IMG})`, WebkitMaskMode: 'luminance', maskMode: 'luminance', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskSize: 'contain', maskSize: 'contain' }} />
              <span className="absolute font-black text-yellow-100" style={{ fontSize: c.label ? '7px' : '8px', textShadow: '0 1px 2px #000', fontFamily: 'Georgia, serif' }}>{c.label || `$${(c.mult * bet).toFixed(2)}`}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}