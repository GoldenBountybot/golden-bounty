import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Volume2, Check, Settings, Zap, Minus, Plus, RotateCw, Coins, History, Gem, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import GameTitleBar from '@/components/GameTitleBar';
import GemTile from '@/components/fortunegems/GemTile';
import {
  COLS, ROWS, TOTAL, SYMBOLS, SYMBOL_IDS, WILD, SCATTER, PAYLINES, MULTIPLIERS,
  FREE_SPINS_AWARD, RETRIGGER_AWARD,
  makeGrid, makeCell, evaluate, randomMultiplier, freeSpinMultiplier, nudgeForWin, forceScatters, countScatters,
} from '@/lib/fortuneGemsEngine';
import {
  playSpinStart, playReelStop, playWin, playBigWin, playLose, playClick, playMultiplier,
  playBonusTrigger, playFreeSpinStart,
  startAmbient, stopAmbient,
} from '@/lib/fortuneGemsSounds';
import { incBet, decBet } from '@/lib/betStepper';

const BG_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/04d5cab51_generated_image.png';
const FRAME_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/6a4cccd4a_generated_image.png';
const QUICK_BETS = [0.10, 1, 10, 100];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const metalBtn = (active) => ({
  background: active
    ? 'linear-gradient(145deg, #f3d77a, #c8932e 45%, #7a4f17 78%, #4a2f10)'
    : 'linear-gradient(145deg, #5a3a1a, #2e1d0e 50%, #3a2818)',
  border: '2px solid rgba(190,140,55,0.7)',
  boxShadow: active
    ? 'inset 0 2px 3px rgba(255,240,180,0.6), inset 0 -3px 5px rgba(0,0,0,0.4), 0 0 12px rgba(255,200,80,0.55)'
    : 'inset 0 1px 0 rgba(255,210,120,0.2), 0 2px 4px rgba(0,0,0,0.65)',
});

const spinBtnStyle = {
  background: 'radial-gradient(circle at 35% 30%, #ffe066, #d4a017 40%, #8b6914 70%, #5a4400)',
  border: '3px solid rgba(70,45,15,0.9)',
  boxShadow: 'inset 0 3px 4px rgba(255,240,180,0.7), inset 0 -4px 6px rgba(0,0,0,0.5), 0 0 20px rgba(255,190,40,0.6), 0 4px 14px rgba(0,0,0,0.8)',
};

export default function FortuneGemsMachine() {
  const { balance, setBalance } = useCasinoBalance();
  const { rtp } = useGameSettings('fortune-gems');
  const logActivity = useLogActivity();

  const [bet, setBet] = useState(0.10);
  const [grid, setGrid] = useState(() => makeGrid());
  const [winThisSpin, setWinThisSpin] = useState(0);
  const [winningCells, setWinningCells] = useState(new Set());
  const [spinning, setSpinning] = useState(false);
  const [spinningCols, setSpinningCols] = useState(new Set());
  const [centerMult, setCenterMult] = useState(1);
  const [showMult, setShowMult] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [message, setMessage] = useState('Place your bet and spin');
  const [showPay, setShowPay] = useState(false);
  const [showBets, setShowBets] = useState(false);
  const [floatWin, setFloatWin] = useState(null);
  const [copied, setCopied] = useState(false);
  const [newCells, setNewCells] = useState(new Set());
  const [inFree, setInFree] = useState(false);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [showFreeStart, setShowFreeStart] = useState(false);
  const [scatterCells, setScatterCells] = useState(new Set());

  const betRef = useRef(0.10);
  const rtpRef = useRef(rtp);
  const busyRef = useRef(false);
  const turboRef = useRef(false);
  const autoRef = useRef(false);
  const doSpinRef = useRef(null);
  const spinningColsRef = useRef(new Set());
  const inFreeRef = useRef(false);
  const freeSpinsLeftRef = useRef(0);
  const freeStartResolverRef = useRef(null);

  useEffect(() => { betRef.current = bet; }, [bet]);
  useEffect(() => { rtpRef.current = rtp; }, [rtp]);
  useEffect(() => { turboRef.current = turbo; }, [turbo]);
  useEffect(() => { autoRef.current = autoSpin; }, [autoSpin]);
  useEffect(() => { spinningColsRef.current = spinningCols; }, [spinningCols]);
  useEffect(() => { inFreeRef.current = inFree; }, [inFree]);
  useEffect(() => { freeSpinsLeftRef.current = freeSpinsLeft; }, [freeSpinsLeft]);
  useEffect(() => { doSpinRef.current = doSpin; });

  // Start ambient music on mount, stop on unmount
  useEffect(() => {
    startAmbient();
    return () => stopAmbient();
  }, []);

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
      setMessage('Not enough balance');
      if (autoRef.current) setAutoSpin(false);
      return;
    }
    busyRef.current = true;
    setWinThisSpin(0);
    setWinningCells(new Set());
    setFloatWin(null);
    setShowMult(false);
    setCenterMult(1);
    setNewCells(new Set());
    setScatterCells(new Set());
    if (!inFreeRef.current) {
      setBalance((x) => x - b);
    }
    setMessage(inFreeRef.current ? `Free Spin · ${freeSpinsLeftRef.current} left` : 'Spinning…');
    playSpinStart();

    // Generate final grid with RTP gate
    let g = makeGrid();
    const forceWin = Math.random() < (rtpRef.current / 100);
    // Free spin scatter trigger: 0.8% chance (separate from win gate)
    const scatterHit = Math.random() < 0.008;

    if (scatterHit) {
      g = forceScatters(g);
    } else if (forceWin) {
      const ev = evaluate(g, b);
      if (ev.pay === 0) g = nudgeForWin(g);
      // Strip any accidental scatters (only the 0.8% roll triggers free spins)
      const scIdxs = g.map((c, i) => (c.sym === SCATTER ? i : -1)).filter((i) => i >= 0);
      for (let k = 0; k < scIdxs.length; k++) {
        g[scIdxs[k]].sym = makeCell();
      }
    } else {
      let guard = 0;
      let ev = evaluate(g, b);
      while ((ev.pay > 0 || ev.scatterCount >= 3) && guard < 40) {
        g = makeGrid();
        ev = evaluate(g, b);
        guard++;
      }
    }
    const finalGrid = g;

    // Random center multiplier
    let mult = 1;
    if (inFreeRef.current) {
      mult = freeSpinMultiplier();
    } else {
      if (Math.random() < 0.20) {
        mult = randomMultiplier();
      }
    }

    // Start spinning all columns
    setSpinningCols(new Set([0, 1, 2]));
    setSpinning(true);

    // Cycle random symbols for spinning columns
    const spinInterval = setInterval(() => {
      setGrid((prevGrid) =>
        prevGrid.map((cell, i) => {
          const col = i % COLS;
          if (spinningColsRef.current.has(col)) {
            return { ...cell, sym: makeCell(), id: Math.random().toString(36).slice(2) };
          }
          return cell;
        })
      );
    }, 70);

    // Stop columns one by one (left to right)
    const colDelay = turboRef.current ? 180 : 380;
    for (let c = 0; c < COLS; c++) {
      await sleep(colDelay);
      setGrid((prevGrid) => {
        const newGrid = [...prevGrid];
        for (let r = 0; r < ROWS; r++) {
          newGrid[r * COLS + c] = { ...finalGrid[r * COLS + c] };
        }
        return newGrid;
      });
      setSpinningCols((prev) => {
        const next = new Set(prev);
        next.delete(c);
        return next;
      });
      playReelStop();
    }

    clearInterval(spinInterval);
    setSpinning(false);

    // Mark new cells for drop animation
    const newSet = new Set();
    for (let i = 0; i < TOTAL; i++) newSet.add(i);
    setNewCells(newSet);
    await sleep(turboRef.current ? 120 : 200);
    setNewCells(new Set());

    // Highlight scatter cells
    const scSet = new Set();
    finalGrid.forEach((c, i) => { if (c.sym === SCATTER) scSet.add(i); });
    if (scSet.size > 0) {
      setScatterCells(scSet);
      playBonusTrigger();
    }

    // Reveal multiplier
    if (mult > 1) {
      setCenterMult(mult);
      setShowMult(true);
      playMultiplier();
      await sleep(turboRef.current ? 300 : 500);
    }

    // Evaluate win
    const ev = evaluate(finalGrid, b);
    const win = ev.pay * mult;

    if (win > 0) {
      setWinningCells(new Set(ev.winCells));
      setWinThisSpin(win);
      setFloatWin({ value: win, key: Date.now() });
      setBalance((x) => x + win);
      if (mult > 1 || win > b * 10) playBigWin();
      else playWin();
      setMessage(`Won $${win.toFixed(2)}!${mult > 1 ? ` (${mult}×)` : ''}`);
      if (!inFreeRef.current) logActivity('fortune-gems', b, win, 'win');
      await sleep(turboRef.current ? 900 : 1400);
      setWinningCells(new Set());
      setFloatWin(null);
    } else {
      if (!inFreeRef.current) {
        playLose();
        setMessage('No win — spin again');
        logActivity('fortune-gems', b, 0, 'loss');
      }
    }

    // Check free spins trigger
    const scatterCount = countScatters(finalGrid);
    if (scatterCount >= 3) {
      if (inFreeRef.current) {
        const nl = freeSpinsLeftRef.current + RETRIGGER_AWARD;
        freeSpinsLeftRef.current = nl;
        setFreeSpinsLeft(nl);
        setMessage(`+${RETRIGGER_AWARD} Free Spins!`);
        playFreeSpinStart();
        await sleep(800);
      } else {
        inFreeRef.current = true;
        setInFree(true);
        freeSpinsLeftRef.current = FREE_SPINS_AWARD;
        setFreeSpinsLeft(FREE_SPINS_AWARD);
        setMessage(`${FREE_SPINS_AWARD} Free Spins!`);
        playFreeSpinStart();
        await new Promise((resolve) => { freeStartResolverRef.current = resolve; setShowFreeStart(true); });
        setShowFreeStart(false);
        freeStartResolverRef.current = null;
        await sleep(200);
      }
    }

    setScatterCells(new Set());
    setShowMult(false);

    // Free spins continuation
    if (inFreeRef.current) {
      const left = freeSpinsLeftRef.current - 1;
      freeSpinsLeftRef.current = left;
      setFreeSpinsLeft(left);
      if (left > 0) {
        busyRef.current = false;
        setMessage(`Free Spin · ${left} left · Won $${win.toFixed(2)}`);
        setTimeout(() => { doSpinRef.current && doSpinRef.current(); }, turboRef.current ? 500 : 900);
        return;
      } else {
        inFreeRef.current = false;
        setInFree(false);
        setMessage(`Free Spins ended · Total won $${win.toFixed(2)}`);
      }
    }

    busyRef.current = false;

    if (autoRef.current && !inFreeRef.current && balance + win >= b) {
      setTimeout(() => { doSpinRef.current && doSpinRef.current(); }, 700);
    }
  };

  const toggleTurbo = () => { playClick(); setTurbo((t) => !t); };
  const toggleAuto = () => {
    playClick();
    setAutoSpin((a) => {
      const next = !a;
      if (next && !busyRef.current) {
        setTimeout(() => { doSpinRef.current && doSpinRef.current(); }, 200);
      }
      return next;
    });
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: `linear-gradient(rgba(8,6,18,0.72), rgba(4,3,10,0.78)), url(${BG_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/85 backdrop-blur-xl border-b border-amber-700/30">
        <GameTitleBar
          title="FORTUNE GEMS"
          icon={
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shrink-0">
              <Gem className="w-4 h-4 text-stone-950" />
            </div>
          }
          left={
            <Link to="/" className="shrink-0">
              <span className="w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95" style={metalBtn(false)}>
                <ChevronLeft className="w-5 h-5 text-amber-300" strokeWidth={2.6} />
              </span>
            </Link>
          }
          right={
            <button onClick={share} className="shrink-0">
              <span className="w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95" style={metalBtn(false)}>
                {copied ? <Check className="w-4 h-4 text-yellow-300" /> : <Volume2 className="w-4 h-4 text-amber-300/85" />}
              </span>
            </button>
          }
        />
      </header>

      <main className="max-w-md mx-auto px-2 py-3">
        {/* Machine frame — luxury gold border */}
        <div
          className="w-full rounded-2xl relative p-[4px]"
          style={{
            background: 'linear-gradient(145deg, #f5d77a 0%, #c8932e 25%, #7a4f17 50%, #c8932e 75%, #f5d77a 100%)',
            boxShadow: '0 0 0 2px #2e1d0a, 0 0 0 5px rgba(200,150,60,0.35), 0 0 30px rgba(255,200,80,0.15), 0 16px 48px rgba(0,0,0,0.8)',
          }}
        >
          <span className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-amber-200 shadow-[0_0_6px_rgba(255,210,100,0.9)] z-20" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-200 shadow-[0_0_6px_rgba(255,210,100,0.9)] z-20" />
          <span className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-amber-200 shadow-[0_0_6px_rgba(255,210,100,0.9)] z-20" />
          <span className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-200 shadow-[0_0_6px_rgba(255,210,100,0.9)] z-20" />

          <div
            className="flex flex-col gap-2 rounded-[12px] overflow-hidden relative p-3"
            style={{
              background: inFree
                ? 'linear-gradient(160deg, rgba(50,20,60,0.97), rgba(20,8,30,0.99))'
                : 'linear-gradient(160deg, rgba(18,12,30,0.97), rgba(8,5,15,0.99))',
            }}
          >
            {/* Title */}
            <div className="text-center pt-1">
              <h1
                className="text-2xl font-black tracking-[0.2em]"
                style={{
                  fontFamily: 'Cinzel, Georgia, serif',
                  background: 'linear-gradient(to bottom, #ffe066 0%, #ffd700 40%, #d4a017 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6)) drop-shadow(0 0 8px rgba(255,200,50,0.3))',
                }}
              >
                FORTUNE GEMS
              </h1>
              <p className="text-[9px] tracking-widest text-amber-300/50 mt-0.5">
                {inFree ? '★ FREE SPINS ★' : '3 OF A KIND · 5 PAYLINES · UP TO 10× MULTIPLIER'}
              </p>
            </div>

            {/* Free spins badge */}
            {inFree && (
              <div className="flex items-center justify-center gap-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,180,50,0.15)', border: '1px solid rgba(255,180,50,0.4)' }}>
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-black text-yellow-300" style={{ fontFamily: 'Cinzel, Georgia, serif' }}>
                  FREE SPINS: {freeSpinsLeft}
                </span>
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </div>
            )}

            {/* Reel board — inner ornate frame with frame image overlay */}
            <div
              className="relative p-3 rounded-2xl"
              style={{
                background: 'linear-gradient(145deg, rgba(30,20,50,0.95), rgba(10,6,18,0.98))',
                boxShadow: '0 0 0 2px rgba(200,150,60,0.5), 0 0 0 4px rgba(120,80,30,0.4), inset 0 0 30px rgba(0,0,0,0.7)',
              }}
            >
              {/* Ornate frame overlay */}
              <img
                src={FRAME_URL}
                alt=""
                className="absolute inset-0 w-full h-full pointer-events-none z-30 rounded-2xl"
                style={{ mixBlendMode: 'screen', opacity: 0.85 }}
              />

              <div className="grid gap-2 relative z-10" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
                {grid.map((cell, idx) => (
                  <GemTile
                    key={cell.id + '-' + idx}
                    cell={cell}
                    idx={idx}
                    isWin={winningCells.has(idx)}
                    isColSpinning={spinningCols.has(idx % COLS)}
                    isNew={newCells.has(idx)}
                    showMult={showMult}
                    multiplier={centerMult}
                    isScatter={scatterCells.has(idx)}
                  />
                ))}
              </div>

              {/* Coin shower on win */}
              {floatWin && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-4 h-4 rounded-full"
                      style={{
                        left: `${8 + Math.random() * 84}%`,
                        top: '-8%',
                        background: 'radial-gradient(circle at 35% 30%, #ffe066, #d4a017 60%, #8b6914)',
                        boxShadow: '0 0 6px rgba(255,200,50,0.8), inset 0 1px 0 rgba(255,255,255,0.4)',
                        animation: `fgCoinFall 0.9s ease-in ${i * 0.06}s forwards`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Floating win overlay */}
              {floatWin && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                  <div className="text-center" style={{ animation: 'fgWinPop 0.5s ease-out' }}>
                    <p
                      className="text-4xl font-black tabular-nums"
                      style={{
                        color: '#ffd700',
                        textShadow: '0 0 12px rgba(255,215,0,0.9), 0 0 24px rgba(255,180,0,0.6), 0 2px 6px rgba(0,0,0,0.8)',
                        fontFamily: 'Cinzel, Georgia, serif',
                      }}
                    >
                      ${floatWin.value.toFixed(2)}
                    </p>
                    {centerMult > 1 && (
                      <p
                        className="text-lg font-black mt-1"
                        style={{ color: '#ff8c00', textShadow: '0 0 8px rgba(255,140,0,0.8)', fontFamily: 'Cinzel, Georgia, serif' }}
                      >
                        {centerMult}× MULTIPLIER
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Win + Balance row */}
            <div className="flex items-center justify-between px-2">
              <div className="text-center">
                <span className="text-[9px] tracking-widest text-amber-200/60">WIN</span>
                <p
                  className="text-lg font-black tabular-nums"
                  style={{
                    color: winThisSpin > 0 ? '#fde68a' : 'rgba(255,235,180,0.4)',
                    fontFamily: 'Cinzel, Georgia, serif',
                    textShadow: winThisSpin > 0 ? '0 0 10px rgba(245,197,66,0.6)' : 'none',
                  }}
                >
                  $ {winThisSpin.toFixed(2)}
                </p>
              </div>
              <div className="text-center flex-1 mx-3">
                <p className="text-[10px] text-amber-200/50 italic truncate">{message}</p>
              </div>
              <div className="text-center">
                <span className="text-[9px] tracking-widest text-amber-200/60">BALANCE</span>
                <p className="text-lg font-black tabular-nums text-yellow-200" style={{ fontFamily: 'Cinzel, Georgia, serif' }}>
                  $ {balance.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Control panel — JILI metallic style */}
            <div className="px-2 py-3 border-t" style={{ borderTop: '1px solid rgba(190,140,55,0.5)' }}>
              <div className="flex items-end justify-between gap-1">
                <button onClick={() => { playClick(); setShowPay((s) => !s); }} className="flex flex-col items-center gap-1">
                  <span className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95" style={metalBtn(false)}>
                    <Settings className="w-5 h-5 text-amber-300" strokeWidth={2.2} />
                  </span>
                </button>

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

                <button onClick={() => { if (!busyRef.current) { playClick(); doSpin(); } }} disabled={busyRef.current} className="flex flex-col items-center gap-1 disabled:opacity-80">
                  <span className="relative w-20 h-20 rounded-full flex items-center justify-center transition-transform active:scale-95" style={spinBtnStyle}>
                    <RotateCw className={`absolute w-16 h-16 text-amber-900/30 ${busyRef.current ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                    <span className="relative text-sm font-black tracking-wider" style={{ fontFamily: 'Cinzel, Georgia, serif', color: '#ffd700', textShadow: '0 1px 2px rgba(0,0,0,0.6), 0 0 8px rgba(255,200,50,0.4)' }}>SPIN</span>
                  </span>
                </button>

                <button onClick={toggleAuto} disabled={busyRef.current && !autoSpin} className="flex flex-col items-center gap-1 disabled:opacity-60">
                  <span className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95" style={metalBtn(autoSpin)}>
                    <History className={`w-5 h-5 ${autoSpin ? 'text-yellow-300' : 'text-amber-300/85'}`} strokeWidth={2.2} />
                  </span>
                </button>

                <button onClick={toggleTurbo} className="flex flex-col items-center gap-0.5">
                  <span className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95" style={metalBtn(turbo)}>
                    <Zap className={`w-5 h-5 ${turbo ? 'text-yellow-300' : 'text-amber-300/85'}`} fill={turbo ? 'currentColor' : 'none'} strokeWidth={2.4} />
                  </span>
                  <span className="text-[9px] font-black italic leading-none" style={{ color: '#ff8c00', textShadow: '0 0 4px rgba(255,140,0,0.6)' }}>TURBO</span>
                </button>
              </div>
            </div>

            {/* Quick bet panel */}
            {showBets && (
              <div className="px-2 pb-2 flex items-center gap-1.5">
                <button onClick={() => changeBet(-1)} disabled={busyRef.current} className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40 shrink-0" style={metalBtn(false)}>
                  <Minus className="w-4 h-4 text-amber-300" strokeWidth={2.6} />
                </button>
                {QUICK_BETS.map((qb) => (
                  <button
                    key={qb}
                    onClick={() => { if (!busyRef.current) { playClick(); setBet(qb); } }}
                    className="flex-1 py-2 rounded-md text-xs font-bold"
                    style={metalBtn(Math.abs(bet - qb) < 0.001)}
                  >
                    ${qb}
                  </button>
                ))}
                <button onClick={() => changeBet(1)} disabled={busyRef.current} className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40 shrink-0" style={metalBtn(false)}>
                  <Plus className="w-4 h-4 text-amber-300" strokeWidth={2.6} />
                </button>
              </div>
            )}

            {/* Paytable */}
            {showPay && (
              <div className="mx-2 mb-2 rounded-xl p-3" style={{ background: 'rgba(20,15,30,0.9)', border: '1px solid rgba(190,140,55,0.4)' }}>
                <p className="text-[10px] tracking-widest text-center mb-2 text-amber-300" style={{ fontFamily: 'Cinzel, Georgia, serif' }}>PAYOUT TABLE · 3 of a kind × bet</p>
                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  {SYMBOL_IDS.filter((s) => s !== SCATTER).map((s) => (
                    <div key={s} className="rounded-lg py-1.5 px-1 flex flex-col items-center gap-1" style={{ border: '1px solid rgba(190,140,55,0.3)', background: 'rgba(10,8,18,0.6)' }}>
                      <img src={SYMBOLS[s].img} alt={SYMBOLS[s].name} className="w-10 h-10 object-contain" style={{ mixBlendMode: 'screen' }} />
                      <span className="text-amber-200 font-bold text-[9px]">{SYMBOLS[s].name}{s === WILD ? ' ★' : ''}</span>
                      <span className="text-yellow-300 font-black">{SYMBOLS[s].pay3}×</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2 mt-2 pt-2" style={{ borderTop: '1px solid rgba(190,140,55,0.2)' }}>
                  <img src={SYMBOLS[SCATTER].img} alt="Bonus" className="w-8 h-8 object-contain" style={{ mixBlendMode: 'screen' }} />
                  <span className="text-[9px] text-amber-200/70">3 BONUS = {FREE_SPINS_AWARD} Free Spins</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Free Spin start interstitial */}
      {showFreeStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div
            className="relative max-w-xs w-full mx-4 rounded-2xl p-6 text-center"
            style={{
              background: 'linear-gradient(145deg, rgba(50,30,70,0.98), rgba(20,10,30,0.99))',
              border: '2px solid rgba(255,200,80,0.6)',
              boxShadow: '0 0 40px rgba(255,200,80,0.3), 0 16px 48px rgba(0,0,0,0.8)',
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-6 h-6 text-yellow-300" />
              <h2 className="text-2xl font-black text-yellow-300" style={{ fontFamily: 'Cinzel, Georgia, serif' }}>FREE SPINS</h2>
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <p className="text-5xl font-black text-amber-200 mb-2" style={{ fontFamily: 'Cinzel, Georgia, serif' }}>{FREE_SPINS_AWARD}</p>
            <p className="text-sm text-amber-200/70 mb-4">Free Spins Awarded!<br />Multipliers are guaranteed in Free Spins!</p>
            <button
              onClick={() => { playClick(); freeStartResolverRef.current && freeStartResolverRef.current(); }}
              className="w-full py-3 rounded-xl text-lg font-black"
              style={spinBtnStyle}
            >
              START
            </button>
          </div>
        </div>
      )}
    </div>
  );
}