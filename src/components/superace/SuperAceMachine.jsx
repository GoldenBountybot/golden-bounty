import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, DollarSign, Share2, Check, Settings, Zap, Repeat, Minus, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import CardTile from '@/components/superace/CardTile';
import FlyingWilds from '@/components/superace/FlyingWilds';
import MultiplierBar from '@/components/superace/MultiplierBar';
import WinOverlay from '@/components/superace/WinOverlay';
import FreeSpinStart from '@/components/superace/FreeSpinStart';
import {
  COLS, ROWS, TOTAL, BASE_MULTS, FREE_MULTS, FREE_SPINS_AWARD, RETRIGGER_AWARD,
  BUY_BONUS_MULT, MAX_WIN_CAP, makeGrid, makeCell, evaluate, cascade, nudgeForWin,
  multiplierFor, PAYS, SCATTER_PAY, findWildTargets,
} from '@/lib/superaceEngine';
import {
  playSpinStart, playReelLand, playComboWin, playCascade, playScatter,
  playBigWin, playLose, playClick,
} from '@/lib/superaceSounds';

const W = { fontFamily: 'Rye, Georgia, serif' };
const BETS = [0.1, 1, 5, 10];

const woodBtn = (active) => ({
  border: '1px solid rgba(190,140,55,0.85)',
  background: active
    ? 'linear-gradient(to bottom, rgba(255,210,120,0.95), rgba(200,150,60,0.95))'
    : 'linear-gradient(to bottom, rgba(58,40,18,0.95), rgba(26,18,9,0.95))',
  boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.3), inset 0 0 0 1px rgba(46,30,12,0.6), 0 2px 5px rgba(0,0,0,0.55)',
  color: active ? '#1a1206' : 'rgba(255,220,150,0.92)',
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function SuperAceMachine() {
  const { balance, setBalance } = useCasinoBalance();
  const { rtp } = useGameSettings('fullhouse');
  const logActivity = useLogActivity();

  const [betIdx, setBetIdx] = useState(1);
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
  const [spinning, setSpinning] = useState(false);
  const [newCells, setNewCells] = useState(new Set()); // cells that just dropped (for anim)
  const [showFreeStart, setShowFreeStart] = useState(false);
  const [shatterCells, setShatterCells] = useState(new Set());
  const [flipCells, setFlipCells] = useState(new Set());
  const [goldenWildIdx, setGoldenWildIdx] = useState(null);
  const [flyingWilds, setFlyingWilds] = useState([]);

  // refs for async orchestration
  const betRef = useRef(BETS[betIdx]);
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

  useEffect(() => { betRef.current = BETS[betIdx]; }, [betIdx]);
  useEffect(() => { rtpRef.current = rtp; }, [rtp]);
  useEffect(() => { turboRef.current = turbo; }, [turbo]);
  useEffect(() => { autoRef.current = autoSpin; }, [autoSpin]);
  useEffect(() => { doSpinRef.current = doSpin; });

  const bet = BETS[betIdx];
  const mults = inFree ? FREE_MULTS : BASE_MULTS;

  const share = () => {
    try { navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch {}
  };

  const changeBet = (d) => {
    if (busyRef.current) return;
    playClick();
    setBetIdx((i) => Math.max(0, Math.min(BETS.length - 1, i + d)));
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
    setGoldenWildIdx(null);
    if (!inFreeRef.current) {
      setBalance((x) => x - b);
      setMessage(`Spinning…`);
    } else {
      setMessage(`Free Spin · ${freeSpinsLeftRef.current} left`);
    }
    playSpinStart();

    let g = makeGrid();
    const ev0 = evaluate(g, b);
    if (ev0.pay === 0 && ev0.scatterCount < 3 && Math.random() < (rtpRef.current / 100)) {
      g = nudgeForWin(g);
    }
    setGrid(g.map((c) => ({ ...c })));
    await sleep(turboRef.current ? 320 : 620);
    setSpinning(false);
    playReelLand();
    await sleep(150);

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
      await sleep(turboRef.current ? 380 : 560);

      // golden winners: glow -> card-back -> flip -> wild (stay in place, no drop)
      if (ev.goldenToWild.size > 0) {
        setFlipCells(new Set(ev.goldenToWild));
        await sleep(turboRef.current ? 520 : 680);
      }

      // remaining winning cards blast/shatter then vanish
      const shatterSet = new Set([...ev.winCells].filter((i) => !ev.goldenToWild.has(i)));
      setShatterCells(shatterSet);
      await sleep(turboRef.current ? 280 : 340);

      const dropped = new Set([...ev.winCells].filter((i) => !ev.goldenToWild.has(i)));
      g = cascade(g, ev.winCells, ev.goldenToWild);
      setGrid(g.map((c) => ({ ...c })));
      setWinningCells(new Set());
      setShatterCells(new Set());
      setFlipCells(new Set());
      setFloatWin(null);
      setNewCells(dropped);
      playCascade();
      await sleep(turboRef.current ? 220 : 400);
      setNewCells(new Set());

      // Golden Wild (0.01%): a transformed wild spreads to near-win positions,
      // flying there in animation, while staying at its original spot.
      if (ev.goldenToWild.size > 0 && goldenWildIdxRef.current == null && Math.random() < 0.0001) {
        const sourceIdx = [...ev.goldenToWild][0];
        const targets = findWildTargets(g, sourceIdx).slice(0, 2);
        if (targets.length > 0) {
          goldenWildIdxRef.current = sourceIdx;
          setGoldenWildIdx(sourceIdx);
          playScatter();
          setFlyingWilds(targets.map((t) => ({ sourceIdx, targetIdx: t })));
          await sleep(760);
          const ng = g.map((c) => ({ ...c }));
          targets.forEach((t) => { ng[t] = { sym: 'W', golden: false, id: makeCell().id }; });
          g = ng;
          setGrid(g.map((c) => ({ ...c })));
          setFlyingWilds([]);
        }
      }
      // clear the golden-wild visual if its source cell got removed
      if (goldenWildIdxRef.current != null && g[goldenWildIdxRef.current].sym !== 'W') {
        goldenWildIdxRef.current = null;
        setGoldenWildIdx(null);
      }
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
    <div className="min-h-screen text-amber-100 flex flex-col relative" style={{ background: 'radial-gradient(circle at 50% 0%, #0e2a2a 0%, #07191a 55%, #04090a 100%)', ...W }}>
      {/* damask-ish overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, rgba(120,80,30,0.18), transparent 45%), radial-gradient(circle at 75% 70%, rgba(120,80,30,0.14), transparent 45%)" }} />

      {/* Header */}
      <header className="sticky top-0 z-30" style={{ borderBottom: '1px solid rgba(190,140,55,0.55)', background: 'linear-gradient(to bottom, rgba(74,28,16,0.96), rgba(38,16,10,0.97))' }}>
        <div className="max-w-md mx-auto px-3 py-2.5 flex items-center gap-2.5">
          <Link to="/" className="w-9 h-9 flex items-center justify-center rounded-md" style={{ ...woodBtn(false) }}>
            <ChevronLeft className="w-5 h-5" style={{ color: '#f3e2b3' }} />
          </Link>
          <div className="flex-1 text-center">
            <span className="text-xl font-black italic" style={{ color: '#f5c542', fontFamily: 'Rye, Georgia, serif', textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(245,197,66,0.4)' }}>SuperAce</span>
          </div>
          <button onClick={buyBonus} disabled={busyRef.current || inFreeRef.current} className="px-2.5 py-1.5 rounded-full text-[10px] font-black italic disabled:opacity-50" style={{ background: 'radial-gradient(circle at 50% 35%, #ef4444, #991b1b)', border: '1.5px solid #f5c542', color: '#fde68a', boxShadow: '0 0 8px rgba(239,68,68,0.6), inset 0 1px 0 rgba(255,255,255,0.3)', ...W }}>
            BUY<br />BONUS
          </button>
          <button onClick={share} className="w-9 h-9 flex items-center justify-center rounded-md" style={{ ...woodBtn(false) }}>
            {copied ? <Check className="w-[14px] h-[14px]" style={{ color: '#f5c542' }} /> : <Share2 className="w-[14px] h-[14px]" style={{ color: '#f3e2b3' }} />}
          </button>
        </div>
      </header>

      <main className="max-w-md w-full mx-auto px-3 pt-3 pb-6 flex flex-col gap-3 flex-1 relative z-10">
        {/* Multiplier + hint */}
        <div className="flex flex-col items-center gap-1.5">
          <MultiplierBar mults={mults} combo={combo} inFree={inFree} freeSpinsLeft={freeSpinsLeft} />
          <p className="text-[10px] text-amber-200/70" style={W}>
            {inFree ? 'Up to 10× puzzle multiplier in Free Game' : 'Get a Golden Card → turns Wild · 3 SCATTER = 10 Free Games'}
          </p>
        </div>

        {/* Grid */}
        <div
          className="relative rounded-xl p-2.5"
          style={{
            background: 'linear-gradient(to bottom, rgba(10,40,40,0.92), rgba(6,20,22,0.95))',
            border: '1.5px solid rgba(190,140,55,0.6)',
            boxShadow: 'inset 0 0 0 1px rgba(46,30,12,0.5), inset 0 0 18px rgba(0,0,0,0.6), 0 4px 14px rgba(0,0,0,0.55)',
          }}
        >
          <div className="relative">
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
              {grid.map((cell, idx) => (
                <div key={cell.id + '-' + idx} className="aspect-[3/4]">
                  <CardTile cell={cell} idx={idx} isWin={winningCells.has(idx)} shatter={shatterCells.has(idx)} flip={flipCells.has(idx)} goldenWild={goldenWildIdx === idx} spinning={spinning} isNew={newCells.has(idx)} />
                </div>
              ))}
            </div>
            <FlyingWilds items={flyingWilds} />
          </div>

          {/* Overlays */}
          <WinOverlay floatWin={floatWin} combo={combo} />

          {/* WIN display */}
          <div className="mt-2 text-center">
            <span className="text-[10px] tracking-widest" style={{ color: '#f5c542', ...W }}>WIN</span>{' '}
            <span className="text-lg font-black tabular-nums" style={{ color: winThisSpin > 0 ? '#fde68a' : 'rgba(255,235,180,0.5)', fontFamily: 'Georgia, serif', textShadow: winThisSpin > 0 ? '0 0 10px rgba(245,197,66,0.6)' : 'none' }}>
              ${winThisSpin.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Message */}
        <div className="text-center py-1">
          <span className="text-xs italic" style={{ color: '#f3e2b3', ...W }}>{message}</span>
        </div>

        {/* Control bar */}
        <div className="flex items-center justify-between gap-2 px-1 py-2 rounded-xl" style={{ background: 'linear-gradient(to bottom, rgba(58,40,18,0.92), rgba(26,18,9,0.95))', border: '1px solid rgba(190,140,55,0.6)', boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.25), 0 2px 6px rgba(0,0,0,0.5)' }}>
          {/* settings */}
          <button onClick={() => { playClick(); setShowPay((s) => !s); }} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ ...woodBtn(false) }}>
            <Settings className="w-5 h-5" style={{ color: '#d9b97a' }} />
          </button>

          {/* bet down */}
          <button onClick={() => changeBet(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ ...woodBtn(false) }}>
            <Minus className="w-4 h-4" style={{ color: '#d9b97a' }} />
          </button>

          <div className="flex flex-col items-center min-w-[64px]">
            <span className="text-[8px] tracking-widest" style={{ color: '#f5c542', ...W }}>BET</span>
            <span className="text-sm font-black tabular-nums" style={{ color: '#fde68a', fontFamily: 'Georgia, serif' }}>${bet.toFixed(2)}</span>
          </div>

          <button onClick={() => changeBet(1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ ...woodBtn(false) }}>
            <Plus className="w-4 h-4" style={{ color: '#d9b97a' }} />
          </button>

          {/* SPIN */}
          <button
            onClick={() => { if (!busyRef.current) { playClick(); doSpin(); } }}
            disabled={busyRef.current}
            className="relative w-16 h-16 rounded-full flex items-center justify-center disabled:opacity-70"
            style={{
              background: 'radial-gradient(circle at 50% 40%, #fff3c4, #f5c542 45%, #c8881e 85%)',
              border: '3px solid #fde68a',
              boxShadow: '0 0 14px rgba(245,197,66,0.8), inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -3px 6px rgba(120,70,10,0.5)',
            }}
          >
            <span className="absolute inset-1 rounded-full" style={{ border: '1.5px dashed rgba(90,40,10,0.45)', animation: busyRef.current ? 'saSpinRotate 0.8s linear infinite' : 'none' }} />
            <span className="text-[11px] font-black italic relative" style={{ color: '#5a1010', fontFamily: 'Rye, Georgia, serif' }}>SPIN</span>
          </button>

          {/* auto */}
          <button onClick={toggleAuto} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ ...woodBtn(autoSpin) }}>
            <Repeat className="w-4 h-4" style={{ color: autoSpin ? '#1a1206' : '#d9b97a' }} />
          </button>

          {/* turbo */}
          <button onClick={toggleTurbo} className="w-10 h-10 rounded-full flex items-center justify-center relative" style={{ ...woodBtn(turbo) }}>
            <Zap className="w-5 h-5" style={{ color: turbo ? '#1a1206' : '#d9b97a', filter: turbo ? 'drop-shadow(0 0 4px rgba(245,197,66,0.8))' : 'none' }} />
            <span className="absolute -bottom-3.5 text-[7px] font-black" style={{ color: turbo ? '#f5c542' : 'rgba(255,220,150,0.5)', ...W }}>TURBO</span>
          </button>
        </div>

        {/* Balance + Buy Bonus mini */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ ...woodBtn(false) }}>
            <DollarSign className="w-4 h-4" style={{ color: '#f5c542' }} />
            <span className="text-[10px] tracking-widest" style={{ color: '#f5c542', ...W }}>BALANCE</span>
            <span className="text-sm font-black tabular-nums" style={{ color: '#fde68a', fontFamily: 'Georgia, serif' }}>${balance.toFixed(2)}</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] tracking-widest block" style={{ color: '#f5c542', ...W }}>LAST WIN</span>
            <span className="text-sm font-black tabular-nums" style={{ color: lastWin > 0 ? '#fde68a' : 'rgba(255,235,180,0.4)', fontFamily: 'Georgia, serif' }}>${lastWin.toFixed(2)}</span>
          </div>
        </div>

        {/* Bet chips */}
        <div className="grid grid-cols-4 gap-1.5">
          {BETS.map((b, i) => (
            <button
              key={b}
              onClick={() => { if (!busyRef.current) { playClick(); setBetIdx(i); } }}
              className="py-2 rounded-md text-xs font-bold italic"
              style={{ ...woodBtn(betIdx === i), ...W }}
            >
              ${b}
            </button>
          ))}
        </div>

        {/* Buy Bonus button (full) */}
        <button
          onClick={buyBonus}
          disabled={busyRef.current || inFreeRef.current || balance < BUY_BONUS_MULT * bet}
          className="w-full py-3 rounded-xl text-sm font-black italic disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(to bottom, #ef4444, #991b1b)', border: '1.5px solid #f5c542', color: '#fde68a', boxShadow: '0 0 10px rgba(239,68,68,0.5), inset 0 1px 0 rgba(255,255,255,0.3)', ...W }}
        >
          <Sparkles className="w-4 h-4" /> BUY BONUS · ${(BUY_BONUS_MULT * bet).toFixed(2)} → 10 Free Spins
        </button>

        {/* Payout panel (toggle) */}
        {showPay && (
          <div className="rounded-xl p-3" style={{ ...woodBtn(false) }}>
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
      </main>

      {showFreeStart && (
        <FreeSpinStart
          spins={FREE_SPINS_AWARD}
          onStart={() => { playClick(); freeStartResolverRef.current && freeStartResolverRef.current(); }}
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