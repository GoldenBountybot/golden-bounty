import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, ChevronsRight, History, BarChart3, Info } from 'lucide-react';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import GameLoadingScreen from '@/components/GameLoadingScreen';
import BottomNav from '@/components/BottomNav';

const MIN_BET = 0.1;
const MAX_BET = 500;
const DEFAULT_BET = 1;
const BET_STEP = 0.1;
const SINGLE_MULT = 2.88;
const TWO_MULT = 1.44;
const SHUFFLE_SWAPS = 13;
const SHUFFLE_MS = 320;

const BARREL_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/35b2a44e4_file_00000000149481fa80aa6a96e6a047f9.png';
const BALL_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/8a7398106_file_00000000fdcc81fa9090dcaff6ecfea6.png';
const EMBLEM_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/91a580c0d_generated_image.png';
const SPIN_FRAME_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/329b548f9_generated_image.png';
const CHEST_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/8478d880f_generated_image.png';
const GIFT_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/1b1c32d32_generated_image.png';
const TROPHY_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c38cb3a73_generated_image.png';

const goldText = {
  color: '#ffe890',
  textShadow: '0 1px 0 #6a4810, 0 0 10px rgba(255,210,100,0.5)',
};
const woodPanel = {
  background: 'linear-gradient(to bottom, #3e2723, #2a1a0d)',
  border: '2px solid #d4af37',
  boxShadow: 'inset 0 1px 0 rgba(255,220,160,0.18), inset 0 0 14px rgba(0,0,0,0.55), 0 4px 14px rgba(0,0,0,0.6)',
};
const goldBtn = {
  background: 'linear-gradient(to bottom, #ffe890, #d4af37 45%, #b8860b)',
  border: '1px solid #ffe890',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(120,80,20,0.6), 0 2px 5px rgba(0,0,0,0.5)',
};
const ornateFrame = {
  border: '3px solid transparent',
  borderImage: 'linear-gradient(135deg, #bf953f, #ffe890, #d4af37, #8a6010, #ffe890, #bf953f) 1',
  boxShadow: 'inset 0 0 0 1px rgba(60,40,10,0.8), inset 0 0 16px rgba(0,0,0,0.6), 0 0 14px rgba(200,150,60,0.3)',
};

let _actx = null;
function actx() {
  if (typeof window === 'undefined') return null;
  if (!_actx) {
    try { _actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { _actx = null; }
  }
  return _actx;
}
function playTone(freq, t0, dur, type = 'triangle', gain = 0.12) {
  const ac = actx(); if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type; o.frequency.value = freq;
  o.connect(g); g.connect(ac.destination);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
function playShuffle() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  playTone(180, t, 0.07, 'sawtooth', 0.06);
  playTone(140, t + 0.04, 0.07, 'sawtooth', 0.05);
}
function playLift() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  playTone(320, t, 0.1, 'sine', 0.08);
}
function playWin() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  playTone(660, t, 0.14);
  playTone(880, t + 0.08, 0.16);
  playTone(1175, t + 0.18, 0.22);
}
function playLose() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  playTone(300, t, 0.18, 'sawtooth', 0.1);
  playTone(200, t + 0.12, 0.22, 'sawtooth', 0.08);
}

function genHash() {
  const chars = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < 40; i++) s += chars[Math.floor(Math.random() * 16)];
  return s;
}

export default function Thimbles() {
  const { balance, setBalance } = useCasinoBalance();
  const [loaded, setLoaded] = useState(false);
  const { rtp } = useGameSettings('thimbles');
  const [bet, setBet] = useState(DEFAULT_BET);
  const [mode, setMode] = useState('single');
  const [phase, setPhase] = useState('idle');
  const [positions, setPositions] = useState([0, 1, 2]);
  const [ballCups, setBallCups] = useState(new Set([0]));
  const [picked, setPicked] = useState(null);
  const [won, setWon] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [message, setMessage] = useState('PRESS SPIN TO START');
  const [hash] = useState(genHash);
  const logActivity = useLogActivity();
  const timers = useRef([]);
  const pendingWin = useRef(false);

  const mult = mode === 'single' ? SINGLE_MULT : TWO_MULT;
  const winChance = rtp / 100;

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const start = () => {
    if (phase !== 'idle' && phase !== 'over') return;
    if (!bet || bet < MIN_BET) { setMessage(`Min bet is ${MIN_BET} USDT`); return; }
    if (balance < bet) { setMessage('Not enough balance'); return; }
    setBalance((b) => b - bet);

    const numBalls = mode === 'single' ? 1 : 2;
    const cups = new Set();
    while (cups.size < numBalls) cups.add(Math.floor(Math.random() * 3));
    setBallCups(cups);
    setPicked(null);
    setWon(false);
    setLastWin(0);
    setPositions([0, 1, 2]);
    setMessage('Watch the ball…');
    setPhase('peek');
    playLift();

    const t1 = setTimeout(() => {
      setPhase('shuffling');
      setMessage('Shuffling…');
      runShuffle();
    }, 1200);
    timers.current.push(t1);
  };

  const runShuffle = () => {
    let cur = [0, 1, 2];
    let swaps = 0;
    const doSwap = () => {
      if (swaps >= SHUFFLE_SWAPS) {
        setPositions([...cur]);
        const t = setTimeout(() => {
          setPhase('picking');
          setMessage('Pick a cup!');
        }, 200);
        timers.current.push(t);
        return;
      }
      const a = Math.floor(Math.random() * 3);
      let b = Math.floor(Math.random() * 3);
      while (b === a) b = Math.floor(Math.random() * 3);
      const cupA = cur.indexOf(a);
      const cupB = cur.indexOf(b);
      cur = cur.map((slot, cup) => (cup === cupA ? b : cup === cupB ? a : slot));
      setPositions([...cur]);
      playShuffle();
      swaps++;
      const t = setTimeout(doSwap, SHUFFLE_MS);
      timers.current.push(t);
    };
    const t0 = setTimeout(doSwap, 200);
    timers.current.push(t0);
  };

  const pick = (cupIdx) => {
    if (phase !== 'picking') return;
    clearTimers();
    setPicked(cupIdx);
    setPhase('over');
    playLift();

    const willWin = Math.random() < winChance;
    const numBalls = mode === 'single' ? 1 : 2;

    let cups;
    if (willWin) {
      cups = new Set([cupIdx]);
      while (cups.size < numBalls) cups.add(Math.floor(Math.random() * 3));
    } else {
      const others = [0, 1, 2].filter((c) => c !== cupIdx);
      cups = new Set();
      const shuffled = others.sort(() => Math.random() - 0.5);
      const count = Math.min(numBalls, others.length);
      for (let i = 0; i < count; i++) cups.add(shuffled[i]);
    }
    setBallCups(cups);

    if (willWin) {
      const win = bet * mult;
      setBalance((b) => b + win);
      setLastWin(win);
      setWon(true);
      setMessage(`You found it! +${win.toFixed(2)} (${mult}x)`);
      playWin();
      logActivity('thimbles', bet, win, 'win', mult);
    } else {
      setLastWin(0);
      setWon(false);
      setMessage('Wrong cup! Try again');
      playLose();
      logActivity('thimbles', bet, 0, 'loss', 0);
    }
  };

  const newGame = () => {
    clearTimers();
    setPhase('idle');
    setPicked(null);
    setBallCups(new Set([Math.floor(Math.random() * 3)]));
    setPositions([0, 1, 2]);
    setWon(false);
    setLastWin(0);
    setMessage('PRESS SPIN TO START');
  };

  useEffect(() => {
    if (loaded) {
      setBallCups(new Set([Math.floor(Math.random() * 3)]));
    }
  }, [loaded]);

  const adjustBet = (delta) => {
    setBet((b) => Math.min(MAX_BET, Math.max(MIN_BET, b + delta)));
  };

  const slotLeft = (slot) => `${2.5 + slot * 32.5}%`;
  const cupsLifted = phase === 'peek';
  const pickedLifted = phase === 'over';

  const ctrlBtn = (bg) => ({
    background: bg,
    border: '2px solid #d4af37',
    boxShadow: 'inset 0 1px 0 rgba(255,235,150,0.4), inset 0 0 0 1px rgba(60,40,10,0.6), 0 3px 8px rgba(0,0,0,0.55)',
  });

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden relative" style={{ background: '#0b0b0b', fontFamily: 'Georgia, serif' }}>
      {!loaded && <GameLoadingScreen title="Thimbles" onDone={() => setLoaded(true)} />}

      {/* Header */}
      <header className="sticky top-0 z-30" style={{ background: 'linear-gradient(to bottom, #1a1208, #0b0b0b)', borderBottom: '2px solid', borderImage: 'linear-gradient(90deg, #8a6010, #ffe890, #d4af37, #ffe890, #8a6010) 1', boxShadow: '0 4px 14px rgba(0,0,0,0.6)' }}>
        <div className="max-w-md mx-auto px-3 py-2.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-transform active:scale-95" style={goldBtn}>
            <ChevronLeft className="w-4 h-4" style={{ color: '#3a2410' }} />
            <span className="text-xs font-black tracking-widest" style={{ color: '#3a2410' }}>BACK</span>
          </Link>
          <h1 className="text-2xl font-black tracking-[0.2em]" style={goldText}>THIMBLES</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={woodPanel}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black" style={{ background: 'radial-gradient(circle at 30% 30%, #ffe890, #c89020)', border: '1px solid #8a6010', color: '#6a4810' }}>$</span>
              <span className="text-sm font-bold tabular-nums" style={goldText}>{balance.toFixed(2)}</span>
            </div>
            <Link to="/pay" className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90" style={goldBtn}>
              <Plus className="w-4 h-4" style={{ color: '#3a2410' }} />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-md w-full mx-auto px-3 py-3 flex flex-col gap-3 flex-1 relative z-10 pb-24">
        {/* Bet panel */}
        <div className="rounded-xl py-3 px-4 flex items-center justify-between" style={woodPanel}>
          <button onClick={() => adjustBet(-BET_STEP)} className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform active:scale-90" style={goldBtn}>
            <Minus className="w-5 h-5" style={{ color: '#3a2410' }} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] tracking-[0.25em] font-bold" style={{ color: '#b0a890' }}>TOTAL BET</span>
            <span className="text-xl font-black tabular-nums" style={goldText}>{bet.toFixed(2)} USDT</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => adjustBet(BET_STEP)} className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform active:scale-90" style={goldBtn}>
              <Plus className="w-5 h-5" style={{ color: '#3a2410' }} />
            </button>
            <button onClick={() => setBet(MAX_BET)} className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform active:scale-90" style={goldBtn} title="Max">
              <ChevronsRight className="w-5 h-5" style={{ color: '#3a2410' }} />
            </button>
          </div>
        </div>
        <p className="text-center text-[11px] -mt-1 tracking-wide" style={{ color: '#8a7a60' }}>MIN {MIN_BET} USDT – MAX {MAX_BET} USDT</p>

        {/* Game area — premium wooden table with carved gold frame */}
        <div className="relative rounded-lg overflow-hidden flex flex-col justify-center" style={{ ...woodPanel, minHeight: '270px', borderImage: 'linear-gradient(135deg, #bf953f, #ffe890, #d4af37, #8a6010, #ffe890, #bf953f) 1', borderWidth: '3px', borderStyle: 'solid' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 60%, rgba(0,0,0,0.1), rgba(0,0,0,0.4))' }} />
          {/* Inner gold trim */}
          <div className="absolute inset-1.5 pointer-events-none rounded" style={{ border: '1px solid rgba(255,225,140,0.4)', boxShadow: 'inset 0 0 0 2px rgba(40,28,8,0.5)' }} />
          {/* Corner ornaments */}
          {[
            { top: 0, left: 0, borderTop: '4px solid #ffe890', borderLeft: '4px solid #ffe890' },
            { top: 0, right: 0, borderTop: '4px solid #ffe890', borderRight: '4px solid #ffe890' },
            { bottom: 0, left: 0, borderBottom: '4px solid #ffe890', borderLeft: '4px solid #ffe890' },
            { bottom: 0, right: 0, borderBottom: '4px solid #ffe890', borderRight: '4px solid #ffe890' },
          ].map((c, i) => (
            <div key={i} className="absolute w-7 h-7 pointer-events-none" style={{ ...c, filter: 'drop-shadow(0 0 4px rgba(255,210,100,0.7))' }} />
          ))}

          {/* Message banner */}
          <div className="absolute top-3 left-0 right-0 flex justify-center z-20">
            <div className="px-4 py-1.5 rounded-full text-xs font-black tracking-widest" style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid #d4af37', color: won ? '#ffe066' : '#ffe890', textShadow: '0 1px 0 #6a4810' }}>
              {message}
            </div>
          </div>

          {/* Three barrels */}
          <div className="relative w-full max-w-[380px] mx-auto px-4" style={{ height: '230px' }}>
            <div className="absolute bottom-2 left-4 right-4 h-[3px] rounded-full" style={{ background: 'linear-gradient(to right, transparent, rgba(180,140,80,0.4), transparent)' }} />
            {[0, 1, 2].map((cupIdx) => {
              const slot = positions[cupIdx];
              const isPicked = picked === cupIdx;
              const hasBall = ballCups.has(cupIdx);
              const lifted = cupsLifted || (pickedLifted && isPicked);
              return (
                <button
                  key={cupIdx}
                  onClick={() => pick(cupIdx)}
                  disabled={phase !== 'picking'}
                  className="absolute bottom-2 transition-all"
                  style={{
                    left: slotLeft(slot),
                    width: '30%',
                    height: '100%',
                    transitionDuration: phase === 'shuffling' ? `${SHUFFLE_MS}ms` : '350ms',
                    transitionTimingFunction: 'ease-in-out',
                  }}
                >
                  <Barrel lifted={lifted} hasBall={hasBall} reveal={lifted} won={won && isPicked} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Multiplier panel with golden emblem */}
        <div className="rounded-xl py-3 px-4 flex items-center justify-between" style={woodPanel}>
          <button
            onClick={() => phase === 'idle' && setMode('single')}
            className="flex flex-col items-center gap-1 transition-transform active:scale-95"
            style={{ opacity: mode === 'single' ? 1 : 0.45 }}
          >
            <span className="text-[11px] font-bold tracking-[0.2em]" style={{ color: mode === 'single' ? '#ffe8a0' : '#a09080' }}>1 BALL</span>
            <span className="text-lg font-black tabular-nums" style={{ color: mode === 'single' ? '#ffe066' : '#8a7a60', textShadow: mode === 'single' ? '0 0 8px rgba(255,210,100,0.6)' : 'none' }}>X {SINGLE_MULT}</span>
          </button>
          <img src={EMBLEM_IMG} alt="emblem" draggable={false} className="select-none" style={{ width: 56, height: 'auto', mixBlendMode: 'screen', filter: 'drop-shadow(0 0 8px rgba(255,210,100,0.6))' }} />
          <button
            onClick={() => phase === 'idle' && setMode('two')}
            className="flex flex-col items-center gap-1 transition-transform active:scale-95"
            style={{ opacity: mode === 'two' ? 1 : 0.45 }}
          >
            <span className="text-[11px] font-bold tracking-[0.2em]" style={{ color: mode === 'two' ? '#ffe8a0' : '#a09080' }}>2 BALLS</span>
            <span className="text-lg font-black tabular-nums" style={{ color: mode === 'two' ? '#ffe066' : '#8a7a60', textShadow: mode === 'two' ? '0 0 8px rgba(255,210,100,0.6)' : 'none' }}>X {TWO_MULT}</span>
          </button>
        </div>

        {/* Control buttons — AUTO PLAY / BET MAX / CLEAR BET */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => phase === 'idle' && setBet(DEFAULT_BET)}
            className="py-3 rounded-lg text-xs font-black tracking-widest transition-transform active:scale-95"
            style={ctrlBtn('linear-gradient(to bottom, #1a3a6e, #0d2247)')}
          >
            <span style={{ color: '#ffe890', textShadow: '0 1px 1px rgba(0,0,0,0.6)' }}>AUTO PLAY</span>
          </button>
          <button
            onClick={() => phase === 'idle' && setBet(MAX_BET)}
            className="py-3 rounded-lg text-xs font-black tracking-widest transition-transform active:scale-95"
            style={ctrlBtn('linear-gradient(to bottom, #880e4f, #5a0830)')}
          >
            <span style={{ color: '#ffe890', textShadow: '0 1px 1px rgba(0,0,0,0.6)' }}>BET MAX</span>
          </button>
          <button
            onClick={() => phase === 'idle' && setBet(MIN_BET)}
            className="py-3 rounded-lg text-xs font-black tracking-widest transition-transform active:scale-95"
            style={ctrlBtn('linear-gradient(to bottom, #5a3a1a, #3a2410)')}
          >
            <span style={{ color: '#ffe890', textShadow: '0 1px 1px rgba(0,0,0,0.6)' }}>CLEAR BET</span>
          </button>
        </div>

        {/* Info buttons — HISTORY / STATISTICS / RULES */}
        <div className="grid grid-cols-3 gap-2">
          <button className="py-3 rounded-lg flex flex-col items-center gap-1 transition-transform active:scale-95" style={woodPanel}>
            <History className="w-5 h-5" style={{ color: '#ffe890' }} />
            <span className="text-[10px] font-bold tracking-widest" style={{ color: '#ffe890' }}>HISTORY</span>
          </button>
          <button className="py-3 rounded-lg flex flex-col items-center gap-1 transition-transform active:scale-95" style={woodPanel}>
            <BarChart3 className="w-5 h-5" style={{ color: '#ffe890' }} />
            <span className="text-[10px] font-bold tracking-widest" style={{ color: '#ffe890' }}>STATISTICS</span>
          </button>
          <button className="py-3 rounded-lg flex flex-col items-center gap-1 transition-transform active:scale-95" style={woodPanel}>
            <Info className="w-5 h-5" style={{ color: '#ffe890' }} />
            <span className="text-[10px] font-bold tracking-widest" style={{ color: '#ffe890' }}>RULES</span>
          </button>
        </div>

        {/* Main SPIN button — mahogany with gold floral */}
        {(phase === 'idle' || phase === 'over') && (
          <button
            onClick={phase === 'over' ? newGame : start}
            disabled={phase === 'idle' && balance < bet}
            className="w-full py-4 rounded-xl text-2xl font-black tracking-[0.3em] transition-all disabled:opacity-40 flex items-center justify-center"
            style={{
              backgroundImage: `url(${SPIN_FRAME_IMG})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              color: '#ffe890',
              textShadow: '0 2px 0 #6a4810, 0 0 14px rgba(255,210,100,0.7)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
            }}
          >
            {phase === 'over' ? 'NEW GAME' : 'SPIN'}
          </button>
        )}
        {(phase === 'peek' || phase === 'shuffling' || phase === 'picking') && (
          <div className="w-full py-4 rounded-xl text-center text-lg font-black tracking-widest" style={woodPanel}>
            <span style={{ color: '#8a7a60' }}>{phase === 'peek' ? 'WATCH…' : phase === 'shuffling' ? 'SHUFFLING…' : 'PICK A CUP'}</span>
          </div>
        )}

        <span className="text-[9px] tabular-nums truncate px-1" style={{ color: '#5a5248' }}>HASH: {hash.substring(0, 28)}…</span>

        {/* Promotional banners */}
        <div className="grid grid-cols-1 gap-3 mt-1">
          <PromoCard img={CHEST_IMG} title="DAILY BONUS" sub="UP TO 100 USDT" cta="CLAIM NOW" to="/dashboard?tab=bonus" />
          <PromoCard img={GIFT_IMG} title="WEEKEND REWARD" sub="UP TO 500 USDT" cta="GET NOW" to="/dashboard?tab=bonus" />
          <PromoCard img={TROPHY_IMG} title="VIP EXCLUSIVE" sub="HIGHER REWARDS" cta="JOIN VIP" to="/dashboard?tab=vip" />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function PromoCard({ img, title, sub, cta, to }) {
  return (
    <Link to={to} className="rounded-xl overflow-hidden flex items-stretch transition-transform active:scale-[0.98]" style={woodPanel}>
      <div className="w-24 h-24 flex items-center justify-center shrink-0" style={{ background: '#000' }}>
        <img src={img} alt={title} draggable={false} className="select-none" style={{ width: 88, height: 'auto', mixBlendMode: 'screen', filter: 'drop-shadow(0 0 6px rgba(255,210,100,0.5))' }} />
      </div>
      <div className="flex-1 p-3 flex flex-col justify-center gap-1">
        <span className="text-sm font-black tracking-widest" style={goldText}>{title}</span>
        <span className="text-xs font-bold" style={{ color: '#b0a890' }}>{sub}</span>
        <span className="mt-1 self-start px-3 py-1 rounded-md text-[11px] font-black tracking-widest" style={goldBtn}>
          <span style={{ color: '#3a2410' }}>{cta}</span>
        </span>
      </div>
    </Link>
  );
}

function Barrel({ lifted, hasBall, reveal, won }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-end">
      {/* Ball under the barrel — visible when lifted/revealed and barrel has it */}
      <div className="absolute left-1/2 -translate-x-1/2 transition-all duration-300" style={{ bottom: lifted && reveal && hasBall ? '40px' : '4px', opacity: lifted && reveal && hasBall ? 1 : 0, zIndex: 1 }}>
        <GoldenBall size={28} />
      </div>

      {/* Barrel body — image asset on black bg, screen blend drops the black */}
      <img
        src={BARREL_IMG}
        alt="barrel"
        draggable={false}
        className="relative transition-transform duration-300 select-none"
        style={{
          width: '120px',
          height: 'auto',
          transform: lifted ? 'translateY(-52px)' : 'translateY(0)',
          zIndex: 2,
          mixBlendMode: 'screen',
          filter: won ? 'drop-shadow(0 0 10px rgba(255,210,100,0.7)) brightness(1.1)' : 'drop-shadow(0 3px 5px rgba(0,0,0,0.6))',
        }}
      />
    </div>
  );
}

function GoldenBall({ size = 28 }) {
  return (
    <img
      src={BALL_IMG}
      alt="gold ball"
      draggable={false}
      className="select-none"
      style={{
        width: size,
        height: 'auto',
        mixBlendMode: 'screen',
        filter: 'drop-shadow(0 0 8px rgba(255,210,120,0.85))',
      }}
    />
  );
}