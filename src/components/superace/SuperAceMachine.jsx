import React, { useState, useRef, useEffect } from 'react';
import { Settings, Zap, Minus, Plus, Play, RotateCw, Wallet, Coins, Trophy, History, ChevronLeft, Volume2, VolumeX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import CardTile from '@/components/superace/CardTile';
import FlyingWilds from '@/components/superace/FlyingWilds';
import MultiplierBar from '@/components/superace/MultiplierBar';
import WinOverlay from '@/components/superace/WinOverlay';
import FreeSpinStart from '@/components/superace/FreeSpinStart';
import SuperWinBanner from '@/components/superace/SuperWinBanner';
import MegaWinBanner from '@/components/superace/MegaWinBanner';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import GameTitleBar from '@/components/GameTitleBar';
import AnimatedNumber from '@/components/AnimatedNumber';
import WesternStatBanner from '@/components/wildbounty/WesternStatBanner';
import {
  COLS, ROWS, TOTAL, BASE_MULTS, FREE_MULTS, FREE_SPINS_AWARD, RETRIGGER_AWARD,
  BUY_BONUS_MULT, MAX_WIN_CAP, makeGrid, makeCell, evaluate, cascade, nudgeForWin,
  multiplierFor, PAYS, SCATTER_PAY, findWildTargets, findGoldenWildConfig, PAY_SYMBOLS,
} from '@/lib/superaceEngine';
import {
  playSpinStart, playReelLand, playComboWin, playCascade, playScatter,
  playBigWin, playLose, playClick, announceWin, playCardDrop, playScatterLand,
  startAmbient, stopAmbient,
} from '@/lib/superaceSounds';
import { incBet, decBet } from '@/lib/betStepper';

const W = { fontFamily: 'Rye, Georgia, serif' };
const QUICK_BETS = [0.10, 1, 10, 100];

const woodBtn = (active) => ({
  background: active
    ? 'linear-gradient(145deg, #f3d77a, #c8932e 45%, #7a4f17 78%, #4a2f10)'
    : 'linear-gradient(145deg, #3a2a1a, #1c140c 60%, #2e2114)',
  border: '1px solid rgba(190,140,55,0.8)',
  color: active ? '#1a1206' : '#f3e2b3',
  boxShadow: active
    ? 'inset 0 1px 0 rgba(255,240,180,0.6), inset 0 -2px 3px rgba(0,0,0,0.4), 0 0 12px rgba(255,200,80,0.55)'
    : 'inset 0 1px 0 rgba(255,210,120,0.2), 0 0 0 1px rgba(46,30,12,0.6), 0 2px 4px rgba(0,0,0,0.65)',
});

const emboss = (onGold) => ({
  filter: onGold
    ? 'drop-shadow(0 1px 0 rgba(255,240,180,0.55)) drop-shadow(0 -1px 0 rgba(0,0,0,0.45))'
    : 'drop-shadow(0 1px 0 rgba(0,0,0,0.65)) drop-shadow(0 -1px 0 rgba(255,220,140,0.25))',
});

// Metallic circular button base (matches JILI reference)
const metalBtn = (active) => ({
  background: active
    ? 'linear-gradient(145deg, #f3d77a, #c8932e 45%, #7a4f17 78%, #4a2f10)'
    : 'linear-gradient(145deg, #5a3a1a, #2e1d0e 50%, #3a2818)',
  border: '2px solid rgba(190,140,55,0.7)',
  boxShadow: active
    ? 'inset 0 2px 3px rgba(255,240,180,0.6), inset 0 -3px 5px rgba(0,0,0,0.4), 0 0 12px rgba(255,200,80,0.55)'
    : 'inset 0 1px 0 rgba(255,210,120,0.2), 0 2px 4px rgba(0,0,0,0.65)',
});

// Large JILI spin button — thick metallic gold
const spinBtnStyle = {
  background: 'radial-gradient(circle at 35% 30%, #ffe066, #d4a017 40%, #8b6914 70%, #5a4400)',
  border: '3px solid rgba(70,45,15,0.9)',
  boxShadow: 'inset 0 3px 4px rgba(255,240,180,0.7), inset 0 -4px 6px rgba(0,0,0,0.5), 0 0 20px rgba(255,190,40,0.6), 0 4px 14px rgba(0,0,0,0.8)',
};

const Stud = ({ pos }) => (
  <span className={`absolute ${pos} w-1 h-1 rounded-full bg-amber-200 shadow-[0_0_3px_rgba(255,210,120,0.9)]`} />
);

function Medallion({ size, active, children }) {
  return (
    <span className={`relative ${size} rounded-full flex items-center justify-center transition-transform active:scale-95`} style={woodBtn(active)}>
      <Stud pos="top-0.5 left-0.5" />
      <Stud pos="top-0.5 right-0.5" />
      <Stud pos="bottom-0.5 left-0.5" />
      <Stud pos="bottom-0.5 right-0.5" />
      {children}
    </span>
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function SuperAceMachine() {
  const { balance, setBalance } = useCasinoBalance();
  const { rtp } = useGameSettings('fullhouse');
  const logActivity = useLogActivity();

  const [bet, setBet] = useState(0.10);
  const [grid, setGrid] = useState(() => makeGrid());
  const [combo, setCombo] = useState(0);
  const [winThisSpin, setWinThisSpin] = useState(0);
  const [lastWin, setLastWin] = useState(0);
  const [floatWin, setFloatWin] = useState(null);
  const [winningCells, setWinningCells] = useState(new Set());
  const [phase, setPhase] = useState('idle'); // idle | spinning
  const [inFree, setInFree] = useState(false);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [turbo, setTurbo] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [message, setMessage] = useState('Place yer bet an\' spin');
  const [copied, setCopied] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showBets, setShowBets] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [newCells, setNewCells] = useState(new Set()); // cells that just dropped (for anim)
  const [showFreeStart, setShowFreeStart] = useState(false);
  const [superWin, setSuperWin] = useState(null); // { amount, multiplier }
  const [megaWin, setMegaWin] = useState(null); // { amount, multiplier }
  const [shatterCells, setShatterCells] = useState(new Set());
  const [flipCells, setFlipCells] = useState(new Set());
  const [flyingWilds, setFlyingWilds] = useState([]);
  const [teaseCols, setTeaseCols] = useState(new Set());
  const [teaseStart, setTeaseStart] = useState(-1);
  const [muted, setMuted] = useState(false);
  const [scatterLand, setScatterLand] = useState(new Set());

  // refs for async orchestration
  const betRef = useRef(0.10);
  const rtpRef = useRef(rtp);
  const inFreeRef = useRef(false);
  const freeSpinsLeftRef = useRef(0);
  const winThisSpinRef = useRef(0);
  const busyRef = useRef(false);
  const scatterAwardRef = useRef(0);
  const freeTriggerRef = useRef(false);
  const freeStartResolverRef = useRef(null);
  const turboRef = useRef(false);
  const autoRef = useRef(false);
  const doSpinRef = useRef(null);
  const goldenWildIdxRef = useRef(null);
  const goldenTargetsRef = useRef([]);
  const normalWildSpawnedRef = useRef(false);
  const announcedFirstRef = useRef(false);
  const maxMultRef = useRef(0);
  const superWinResolverRef = useRef(null);
  const megaWinResolverRef = useRef(null);

  useEffect(() => { betRef.current = bet; }, [bet]);
  useEffect(() => { rtpRef.current = rtp; }, [rtp]);
  useEffect(() => { turboRef.current = turbo; }, [turbo]);
  useEffect(() => { autoRef.current = autoSpin; }, [autoSpin]);
  useEffect(() => { doSpinRef.current = doSpin; });

  // Start the background gaming ambient when the machine mounts; stop on unmount.
  useEffect(() => {
    startAmbient();
    return () => stopAmbient();
  }, []);

  const mults = inFree ? FREE_MULTS : BASE_MULTS;

  const share = () => {
    try { navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch {}
  };

  const changeBet = (d) => {
    if (busyRef.current) return;
    playClick();
    setBet((b) => (d > 0 ? incBet(b) : decBet(b)));
  };

  const doSpin = async () => {
    if (busyRef.current) return;
    const b = betRef.current;
    if (!inFreeRef.current && balance < b) {
      setMessage('Not enough gold, partner');
      if (autoRef.current) setAutoSpin(false);
      return;
    }
    busyRef.current = true;
    setPhase('spinning');
    setSpinning(true);
    setCombo(0);
    setWinThisSpin(0); winThisSpinRef.current = 0;
    setFloatWin(null);
    setWinningCells(new Set());
    scatterAwardRef.current = 0;
    freeTriggerRef.current = false;
    setShatterCells(new Set());
    setFlipCells(new Set());
    setFlyingWilds([]);
    goldenWildIdxRef.current = null;
    maxMultRef.current = 0;
    goldenTargetsRef.current = [];
    normalWildSpawnedRef.current = false;
    if (!inFreeRef.current) {
      setBalance((x) => x - b);
      setMessage(`Spinning…`);
    } else {
      setMessage(`Free Spin · ${freeSpinsLeftRef.current} left`);
    }
    playSpinStart();

    // 3-scatter free-spin trigger is an independent 0.1% roll, separate from the
    // 10% line-win gate. The win gate controls line wins; scatters are gated here.
    const forceWin = Math.random() < (rtpRef.current / 100);
    const scatterHit = Math.random() < 0.001; // 0.1%
    let g = makeGrid();
    let ev0 = evaluate(g, b);
    if (scatterHit) {
      // Force exactly 3 scatters on random pay-symbol cells → free spins.
      const payIdxs = g.map((c, i) => (PAY_SYMBOLS.includes(c.sym) ? i : -1)).filter((i) => i >= 0);
      for (let i = payIdxs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [payIdxs[i], payIdxs[j]] = [payIdxs[j], payIdxs[i]];
      }
      for (let k = 0; k < Math.min(3, payIdxs.length); k++) {
        g[payIdxs[k]].sym = 'SC';
        g[payIdxs[k]].golden = false;
      }
    } else if (forceWin) {
      if (ev0.pay === 0 && ev0.scatterCount < 3) {
        g = nudgeForWin(g);
      } else if (ev0.scatterCount >= 3) {
        // strip extras so only the 0.1% roll triggers free spins
        const scIdxs = g.map((c, i) => (c.sym === 'SC' ? i : -1)).filter((i) => i >= 0);
        for (let k = 2; k < scIdxs.length; k++) {
          g[scIdxs[k]].sym = makeCell().sym;
          g[scIdxs[k]].golden = false;
        }
      }
    } else {
      let guard = 0;
      while ((ev0.pay > 0 || ev0.scatterCount >= 3) && guard < 40) {
        g = makeGrid();
        ev0 = evaluate(g, b);
        guard++;
      }
    }
    // Golden Wild: drops only when the spin is a forced win AND it (+ flying copies) achieves a big win.
    const goldenCfg = forceWin && !scatterHit ? findGoldenWildConfig(g, b) : null;
    if (goldenCfg) {
      g[goldenCfg.sourceIdx] = { sym: 'W', golden: false, goldenWild: true, pending: true, id: makeCell().id };
      goldenWildIdxRef.current = goldenCfg.sourceIdx;
      goldenTargetsRef.current = goldenCfg.targets;
    }
    // Anticipation: 2 early scatters → remaining columns slow-mo under a golden beam.
    const scatterColList = [];
    for (let c = 0; c < COLS; c++) {
      let has = false;
      for (let r = 0; r < ROWS; r++) { if (g[r * COLS + c].sym === 'SC') { has = true; break; } }
      if (has) scatterColList.push(c);
    }
    let teaseStart = -1;
    const teaseSet = new Set();
    if (scatterColList.length >= 2) {
      teaseStart = scatterColList[1] + 1;
      for (let c = teaseStart; c < COLS; c++) teaseSet.add(c);
    }
    setTeaseStart(teaseStart);
    setTeaseCols(teaseSet);
    setGrid(g.map((c) => ({ ...c })));
    const baseSpin = turboRef.current ? 320 : 620;
    let spinDur = baseSpin;
    if (teaseSet.size > 0) {
      const landMs = (0.3 + (COLS - 1 - teaseStart) * 0.4 + 2.4) * 1000;
      spinDur = turboRef.current ? Math.max(baseSpin, landMs * 0.5) : Math.max(baseSpin, landMs + 200);
    }
    await sleep(spinDur);
    setSpinning(false);
    setTeaseCols(new Set());
    playReelLand();
    // Each scatter that lands plays its own luxury coin sound + burst, staggered.
    const scatterIdxs = g
      .map((c, i) => (c.sym === 'SC' ? i : -1))
      .filter((i) => i >= 0)
      .sort((a, b) => (a % COLS) - (b % COLS));
    scatterIdxs.forEach((idx, i) => {
      setTimeout(() => {
        playScatterLand();
        setScatterLand(new Set([idx]));
        setTimeout(() => setScatterLand(new Set()), 700);
      }, i * 300);
    });

    // Announce the win immediately as the reels land — no delay.
    announcedFirstRef.current = false;
    const evImm = evaluate(g, betRef.current);
    if (evImm.pay > 0 && evImm.winSymbols && evImm.winSymbols.length > 0) {
      announceWin(evImm.winSymbols, multiplierFor(0, inFreeRef.current));
      announcedFirstRef.current = true;
    }

    await sleep(150);

    // Golden Wild: flip to reveal, then fly copies to win-line positions.
    if (goldenWildIdxRef.current != null) {
      const sourceIdx = goldenWildIdxRef.current;
      g = g.map((c) => ({ ...c, pending: false }));
      setGrid(g.map((c) => ({ ...c })));
      setFlipCells(new Set([sourceIdx]));
      playScatter();
      await sleep(turboRef.current ? 520 : 680);
      setFlipCells(new Set());
      const targets = goldenTargetsRef.current || [];
      if (targets.length > 0) {
        setFlyingWilds(targets.map((t) => ({ sourceIdx, targetIdx: t })));
        await sleep(820);
        const ng = g.map((c) => ({ ...c }));
        targets.forEach((t) => { ng[t] = { sym: 'W', golden: false, goldenWild: true, id: makeCell().id }; });
        g = ng;
        setGrid(g.map((c) => ({ ...c })));
        setFlyingWilds([]);
      }
    }

    const finalGrid = await resolveCascades(g);

    // 3+ scatters collected at any point during the round (initial or via cascades)
    // trigger free spins once the round ends. Scatters persist across cascades.
    const finalSc = finalGrid.filter((c) => c.sym === 'SC').length;
    if (finalSc >= 3) {
      scatterAwardRef.current = SCATTER_PAY_LOOKUP(finalSc) * b;
      freeTriggerRef.current = true;
    }

    if (freeTriggerRef.current) {
      if (inFreeRef.current) {
        const nl = freeSpinsLeftRef.current + RETRIGGER_AWARD;
        freeSpinsLeftRef.current = nl; setFreeSpinsLeft(nl);
        setMessage(`+${RETRIGGER_AWARD} Free Spins!`);
        playScatter(); playBigWin();
        await sleep(800);
      } else {
        inFreeRef.current = true; setInFree(true);
        freeSpinsLeftRef.current = FREE_SPINS_AWARD; setFreeSpinsLeft(FREE_SPINS_AWARD);
        setMessage(`${FREE_SPINS_AWARD} Free Spins Awarded!`);
        playScatter(); playBigWin();
        // Pause on the Western "Start Free Spin" interstitial until the player taps start.
        await new Promise((resolve) => { freeStartResolverRef.current = resolve; setShowFreeStart(true); });
        setShowFreeStart(false);
        freeStartResolverRef.current = null;
        await sleep(200);
      }
    }

    await settle();
    busyRef.current = false;
  };

  const resolveCascades = async (g) => {
    let comboCount = 0;
    while (true) {
      const ev = evaluate(g, betRef.current);
      if (ev.pay === 0) break;
      const mult = multiplierFor(comboCount, inFreeRef.current);
      if (mult > maxMultRef.current) maxMultRef.current = mult;
      let win = ev.pay * mult;
      // cap
      if (winThisSpinRef.current + win > MAX_WIN_CAP * betRef.current) {
        win = Math.max(0, MAX_WIN_CAP * betRef.current - winThisSpinRef.current);
      }
      comboCount++; setCombo(comboCount);
      winThisSpinRef.current += win; setWinThisSpin(winThisSpinRef.current);
      setWinningCells(new Set(ev.winCells));
      setFloatWin({ value: win, key: comboCount + '-' + Date.now() + Math.random() });
      playComboWin(comboCount);
      // Skip the first announce if it was already spoken when the reels landed.
      if (announcedFirstRef.current) {
        announcedFirstRef.current = false;
      } else {
        announceWin(ev.winSymbols, mult);
      }
      await sleep(turboRef.current ? 380 : 560);

      // Multiplier gate: each extra cascade is increasingly unlikely to chain,
      // so higher multipliers (2×,3×,5×) trigger far less often.
      const stopChance = [0, 0.66, 0.87, 0.96][Math.min(comboCount, 3)] || 0.99;
      if (Math.random() < stopChance) {
        // shatter the winning cells and end the round without further cascades
        const shatterSet = new Set(ev.winCells);
        setShatterCells(shatterSet);
        await sleep(turboRef.current ? 280 : 340);
        g = cascade(g, ev.winCells, new Set());
        setGrid(g.map((c) => ({ ...c })));
        setWinningCells(new Set());
        setShatterCells(new Set());
        setFlipCells(new Set());
        setFloatWin(null);
        setNewCells(shatterSet);
        playCascade(); playCardDrop();
        await sleep(turboRef.current ? 220 : 400);
        setNewCells(new Set());
        break;
      }

      // When a Golden Wild is active this spin, normal wilds never appear:
      // golden cards just shatter like ordinary winners.
      let gw = goldenWildIdxRef.current != null ? new Set() : ev.goldenToWild;
      // Only 1 normal wild per round — keep the first golden card; the rest shatter.
      if (goldenWildIdxRef.current == null && gw.size > 0) {
        if (normalWildSpawnedRef.current) {
          gw = new Set();
        } else {
          gw = new Set([gw.values().next().value]);
          normalWildSpawnedRef.current = true;
        }
      }
      if (gw.size > 0) {
        setFlipCells(new Set(gw));
        await sleep(turboRef.current ? 520 : 680);
      }

      // remaining winning cards blast/shatter then vanish
      const shatterSet = new Set([...ev.winCells].filter((i) => !gw.has(i)));
      setShatterCells(shatterSet);
      await sleep(turboRef.current ? 280 : 340);

      const dropped = new Set([...ev.winCells].filter((i) => !gw.has(i)));
      g = cascade(g, ev.winCells, gw);
      setGrid(g.map((c) => ({ ...c })));
      setWinningCells(new Set());
      setShatterCells(new Set());
      setFlipCells(new Set());
      setFloatWin(null);
      setNewCells(dropped);
      playCascade(); playCardDrop();
      await sleep(turboRef.current ? 220 : 400);
      setNewCells(new Set());
    }
    return g;
  };

  const settle = async () => {
    const total = winThisSpinRef.current;
    const sc = scatterAwardRef.current;
    const grand = total + sc;
    if (grand > 0) {
      setBalance((x) => x + grand);
      setLastWin(grand);
      if (total > 0) playBigWin();
    } else if (!inFreeRef.current) {
      playLose();
    }
    if (!inFreeRef.current) {
      logActivity('fullhouse', betRef.current, grand, grand > 0 ? 'win' : 'loss');
    }

    // Mega Win banner: x8+ multiplier reached. Super Win banner: x5+ (but <8)
    // or a big payout (≥ 15× bet). Mega Win takes priority when both qualify.
    const maxMult = maxMultRef.current;
    const isMega = maxMult >= 8;
    const isSuper = !isMega && (maxMult >= 5 || (grand >= betRef.current * 15 && grand > 0));
    if (isMega && !inFreeRef.current) {
      setMegaWin({ amount: grand, multiplier: maxMult });
      await new Promise((resolve) => { megaWinResolverRef.current = resolve; });
      megaWinResolverRef.current = null;
    } else if (isSuper && !inFreeRef.current) {
      setSuperWin({ amount: grand, multiplier: maxMult });
      await new Promise((resolve) => { superWinResolverRef.current = resolve; });
      superWinResolverRef.current = null;
    }

    if (inFreeRef.current) {
      const left = freeSpinsLeftRef.current - 1;
      freeSpinsLeftRef.current = left;
      setFreeSpinsLeft(left);
      if (left > 0) {
        setPhase('idle');
        setMessage(`Free Spin · ${left} left · Won $${total.toFixed(2)}`);
          setTimeout(() => { doSpinRef.current && doSpinRef.current(); }, turboRef.current ? 500 : 950);
          return;
      } else {
        inFreeRef.current = false; setInFree(false);
        setMessage(`Free Spins ended · Total $${total.toFixed(2)}`);
      }
    } else {
      setMessage(grand > 0 ? `Won $${grand.toFixed(2)}!` : 'No win — spin again');
    }
    setPhase('idle');
    if (autoRef.current && !inFreeRef.current && balance + grand >= betRef.current) {
      setTimeout(() => { doSpinRef.current && doSpinRef.current(); }, 700);
    }
    };

  const buyBonus = () => {
    if (busyRef.current || inFreeRef.current) return;
    const cost = BUY_BONUS_MULT * betRef.current;
    if (balance < cost) { setMessage('Not enough for Buy Bonus'); return; }
    playClick();
    setBalance((x) => x - cost);
    inFreeRef.current = true; setInFree(true);
    freeSpinsLeftRef.current = FREE_SPINS_AWARD; setFreeSpinsLeft(FREE_SPINS_AWARD);
    setMessage(`Buy Bonus · ${FREE_SPINS_AWARD} Free Spins!`);
    playScatter(); playBigWin();
    setTimeout(() => { doSpinRef.current && doSpinRef.current(); }, 600);
  };

  const toggleMute = () => {
    playClick();
    setMuted((m) => {
      if (m) startAmbient(); else stopAmbient();
      return !m;
    });
  };

  const toggleTurbo = () => { playClick(); setTurbo((t) => !t); };
  const toggleAuto = () => {
    playClick();
    setAutoSpin((a) => {
      const next = !a;
      if (next && !busyRef.current && phase === 'idle' && !inFreeRef.current) {
        setTimeout(() => doSpinRef.current && doSpinRef.current(), 200);
      }
      return next;
    });
  };

  return (
    <div
      className="min-h-screen"
      style={{
        ...W,
        backgroundImage: 'linear-gradient(rgba(6,10,22,0.35), rgba(4,8,18,0.45)), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/6ff3eec42_generated_image.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 bg-stone-950/70 backdrop-blur-xl border-b border-amber-700/30">
        <GameTitleBar
          title="Super Ace"
          left={
            <Link to="/" className="shrink-0">
              <span className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-95" style={metalBtn(false)}>
                <ChevronLeft className="w-5 h-5 text-amber-300" strokeWidth={2.6} />
              </span>
            </Link>
          }
          right={
            <>
              <span
                id="game-balance-chip"
                className="flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[11px] font-bold tabular-nums text-yellow-100"
                style={{ border: '1px solid rgba(214,178,98,0.45)', background: 'rgba(20,17,13,0.6)' }}
              >
                <Wallet className="w-3.5 h-3.5 text-yellow-300" />
                <AnimatedNumber value={balance} prefix="$" />
              </span>
              <button onClick={toggleMute} className="shrink-0">
                <span className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-95" style={metalBtn(false)}>
                  {muted ? <VolumeX className="w-4 h-4 text-amber-300/60" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
                </span>
              </button>
            </>
          }
        />
      </header>

      <main className="max-w-md mx-auto px-2 py-2">
        {/* Machine card — Western gold frame */}
        <div className="w-full rounded-2xl relative p-[3px]" style={{ background: 'linear-gradient(145deg, #e0b34a, #7a4f17 38%, #c8932e 68%, #5e3d12)', boxShadow: '0 0 0 2px #2e1d0a, 0 0 0 4px rgba(200,150,60,0.4), 0 16px 48px rgba(0,0,0,0.75)' }}>
          <div className="flex flex-col gap-2 rounded-[13px] overflow-hidden relative" style={{ backgroundImage: 'linear-gradient(rgba(10,15,30,0.82), rgba(8,12,25,0.88)), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/6ff3eec42_generated_image.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {/* Multiplier + hint */}
            <div className="pt-1.5 px-2 flex items-start gap-2">
              <button onClick={buyBonus} disabled={busyRef.current || inFreeRef.current} className="shrink-0 px-2 py-1 rounded-md text-[9px] font-black italic disabled:opacity-50" style={{ background: 'linear-gradient(to bottom, #ef4444, #991b1b)', border: '1px solid rgba(245,197,66,0.8)', color: '#fde68a', boxShadow: '0 0 8px rgba(239,68,68,0.5), inset 0 1px 0 rgba(255,255,255,0.3)', ...W }}>
                BUY<br />BONUS
              </button>
              <div className="flex-1 flex flex-col items-center gap-1">
                <MultiplierBar mults={mults} combo={combo} inFree={inFree} freeSpinsLeft={freeSpinsLeft} />
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-amber-200/70" style={W}>
                    {inFree ? 'Up to 10× multiplier in Free Game' : 'Golden Card → Wild · 3 SCATTER = 10 Free Games'}
                  </p>
                  <button onClick={() => { playClick(); setShowPay((s) => !s); }} className="text-amber-300/80 hover:text-yellow-300" title="Payout Table">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Reel board — bronze western frame */}
            <div className="relative px-3 py-3 mx-1 rounded-2xl" style={{ backgroundImage: 'linear-gradient(rgba(15,18,29,0.35), rgba(10,12,20,0.45)), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/eb5c5abd9_generated_image.png)', backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 0 0 5px rgba(74,44,26,0.95), 0 0 0 8px rgba(40,24,14,0.9), 0 0 0 11px rgba(74,44,26,0.8), 0 0 0 13px rgba(30,18,10,0.95), 0 0 0 15px rgba(90,56,30,0.5), 0 18px 52px rgba(0,0,0,0.85)' }}>
              <div className="relative">
                {spinning && teaseCols.size > 0 && (
                  <div className="absolute inset-0 pointer-events-none z-0">
                    {[...teaseCols].map((c) => (
                      <div
                        key={'beam-' + c}
                        className="absolute top-0 bottom-0"
                        style={{
                          left: `${(c / COLS) * 100}%`,
                          width: `${100 / COLS}%`,
                          background: 'linear-gradient(to right, rgba(255,245,180,0.95) 0%, rgba(255,235,160,0) 14%, rgba(255,235,160,0) 86%, rgba(255,245,180,0.95) 100%), linear-gradient(to bottom, rgba(255,220,120,0) 0%, rgba(255,235,160,0.4) 50%, rgba(255,220,120,0) 100%)',
                          boxShadow: '0 0 26px rgba(255,210,120,0.65), 0 0 12px rgba(255,245,180,0.85), inset 0 0 18px rgba(255,235,160,0.5)',
                          animation: 'saBeamPulse 0.9s ease-in-out infinite',
                        }}
                      />
                    ))}
                  </div>
                )}
                <div className="grid gap-1.5 relative z-10" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
                  {grid.map((cell, idx) => (
                    <div key={cell.id + '-' + idx} className="aspect-[3/4]">
                      <CardTile cell={cell} idx={idx} isWin={winningCells.has(idx)} shatter={shatterCells.has(idx)} flip={flipCells.has(idx)} goldenWild={!!cell.goldenWild} spinning={spinning} isNew={newCells.has(idx)} tease={teaseCols.has(idx % COLS)} teaseStart={teaseStart} scatterLand={scatterLand.has(idx)} />
                    </div>
                  ))}
                </div>
                <FlyingWilds items={flyingWilds} />
              </div>

              <WinOverlay floatWin={floatWin} combo={combo} />
            </div>

            {/* Free spins badge */}
            {inFree && (
              <WesternFrame glow className="flex items-center justify-center gap-1.5 py-1 mx-2 rounded-md">
                <span className="text-xs font-bold italic text-amber-200 tracking-[0.15em]" style={W}>★ FREE SPINS: {freeSpinsLeft} ★</span>
              </WesternFrame>
            )}

            {/* WIN display — centered above controls */}
            <div className="px-2 py-1 text-center">
              <span className="text-[10px] tracking-widest" style={{ color: '#f5c542', ...W }}>WIN</span>{' '}
              <span className="text-lg font-black tabular-nums" style={{ color: winThisSpin > 0 ? '#fde68a' : 'rgba(255,235,180,0.5)', fontFamily: 'Rye, Georgia, serif', textShadow: winThisSpin > 0 ? '0 0 10px rgba(245,197,66,0.6)' : 'none' }}>
                $ {winThisSpin.toFixed(2)}
              </span>
            </div>

            {/* Control panel — JILI style matching reference */}
            <div className="px-2 py-3 border-t" style={{ background: 'linear-gradient(to bottom, rgba(30,20,12,0.95), rgba(20,14,8,0.98))', borderTop: '1px solid rgba(190,140,55,0.5)' }}>
              <div className="flex items-end justify-between gap-1">
                {/* Settings (gear) */}
                <button onClick={() => { playClick(); setShowPay((s) => !s); }} className="flex flex-col items-center gap-1">
                  <span className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95" style={metalBtn(false)}>
                    <Settings className="w-5 h-5 text-amber-300" strokeWidth={2.2} />
                  </span>
                </button>

                {/* Bet (chips +) */}
                <button onClick={() => { playClick(); setShowBets((s) => !s); }} className="flex flex-col items-center gap-0.5">
                  <span className="relative w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95" style={metalBtn(false)}>
                    <Coins className="w-5 h-5 text-amber-300" strokeWidth={2} />
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #f3d77a, #c8932e)', border: '1px solid rgba(46,30,12,0.8)' }}>
                      <Plus className="w-2.5 h-2.5 text-stone-900" strokeWidth={3} />
                    </span>
                  </span>
                  <span className="text-[9px] text-white font-bold leading-none">Bet</span>
                  <span className="text-[10px] text-yellow-300 font-black leading-none">$ {bet.toFixed(2)}</span>
                </button>

                {/* SPIN — luxury premium button image */}
                <button onClick={() => { if (!busyRef.current) { playClick(); doSpin(); } }} disabled={busyRef.current} className="flex flex-col items-center gap-1 disabled:opacity-80">
                  <span
                    className="relative w-[88px] h-[88px] flex items-center justify-center"
                    style={{
                      transform: busyRef.current ? 'scale(1.12)' : 'scale(1)',
                      transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    <img
                      src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/4c5d3e4ce_file_00000000541c8211a6dd57b4e4dcf69f.png"
                      alt="SPIN"
                      className="w-full h-full object-contain"
                      style={{ mixBlendMode: 'screen' }}
                    />
                  </span>
                </button>

                {/* Auto/History */}
                <button onClick={toggleAuto} disabled={busyRef.current && !autoSpin} className="flex flex-col items-center gap-1 disabled:opacity-60">
                  <span className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95" style={metalBtn(autoSpin)}>
                    <History className={`w-5 h-5 ${autoSpin ? 'text-yellow-300' : 'text-amber-300/85'}`} strokeWidth={2.2} />
                  </span>
                </button>

                {/* Turbo */}
                <button onClick={toggleTurbo} className="flex flex-col items-center gap-0.5">
                  <span className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95" style={metalBtn(turbo)}>
                    <Zap className={`w-5 h-5 ${turbo ? 'text-yellow-300' : 'text-amber-300/85'}`} fill={turbo ? 'currentColor' : 'none'} strokeWidth={2.4} />
                  </span>
                  <span className="text-[9px] font-black italic leading-none" style={{ color: '#ff8c00', textShadow: '0 0 4px rgba(255,140,0,0.6)' }}>TURBO</span>
                  <span className="text-[7px] text-white/60 leading-none">Press turbo spin</span>
                </button>
              </div>
            </div>

            {/* Balance — centered below controls */}
            <div className="px-2 py-1 text-center">
              <span className="text-[10px] tracking-widest text-amber-200/70" style={W}>Balance</span>{' '}
              <span className="text-sm font-bold tabular-nums text-yellow-200" style={{ fontFamily: 'Rye, Georgia, serif' }}>$ {balance.toFixed(2)}</span>
            </div>

            {/* Quick bet panel (toggleable via Bet button) */}
            {showBets && (
              <div className="px-2 pb-2 flex items-center gap-1.5">
                <button onClick={() => changeBet(-1)} disabled={busyRef.current} className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40 shrink-0" style={metalBtn(false)}>
                  <Minus className="w-4 h-4 text-amber-300" strokeWidth={2.6} />
                </button>
                {QUICK_BETS.map((b) => (
                  <button
                    key={b}
                    onClick={() => { if (!busyRef.current) { playClick(); setBet(b); } }}
                    className="flex-1 py-2 rounded-md text-xs font-bold italic"
                    style={{ ...woodBtn(Math.abs(bet - b) < 0.001), ...W }}
                  >
                    ${b}
                  </button>
                ))}
                <button onClick={() => changeBet(1)} disabled={busyRef.current} className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40 shrink-0" style={metalBtn(false)}>
                  <Plus className="w-4 h-4 text-amber-300" strokeWidth={2.6} />
                </button>
              </div>
            )}

            {/* Payout panel (toggle) */}
            {showPay && (
              <div className="mx-2 mb-2 rounded-xl p-3" style={{ ...woodBtn(false) }}>
                <p className="text-[10px] tracking-widest text-center mb-2" style={{ color: '#f5c542', ...W }}>PAYOUT TABLE · per way × bet</p>
                <div className="grid grid-cols-4 gap-1 text-center text-[9px]" style={{ color: '#f3e2b3', fontFamily: 'Georgia, serif' }}>
                  {['A', 'K', 'Q', 'J', 'S', 'H', 'D', 'C'].map((s) => (
                    <div key={s} className="rounded py-1" style={{ border: '1px solid rgba(190,140,55,0.4)' }}>
                      <p className="font-black" style={{ color: '#fde68a' }}>{s}</p>
                      <p>3:{PAYS_SHOW(s, 3)}</p>
                      <p>4:{PAYS_SHOW(s, 4)}</p>
                      <p>5:{PAYS_SHOW(s, 5)}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-center mt-2" style={{ color: '#f3e2b3', fontFamily: 'Georgia, serif' }}>3 SCATTER = 10 Free Spins + 2× bet · 4 = 10× · 5 = 50×</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {showFreeStart && (
        <FreeSpinStart
          spins={FREE_SPINS_AWARD}
          onStart={() => { playClick(); freeStartResolverRef.current && freeStartResolverRef.current(); }}
        />
      )}

      {superWin && (
        <SuperWinBanner
          amount={superWin.amount}
          multiplier={superWin.multiplier}
          onDone={() => { setSuperWin(null); superWinResolverRef.current && superWinResolverRef.current(); }}
        />
      )}

      {megaWin && (
        <MegaWinBanner
          amount={megaWin.amount}
          multiplier={megaWin.multiplier}
          onDone={() => { setMegaWin(null); megaWinResolverRef.current && megaWinResolverRef.current(); }}
        />
      )}
    </div>
  );
}

// helper to read pays
function PAYS_SHOW(s, run) {
  const v = PAYS[s] && PAYS[s][run];
  return v ? v + '×' : '-';
}
function SCATTER_PAY_LOOKUP(n) {
  return SCATTER_PAY[n] || SCATTER_PAY[5];
}