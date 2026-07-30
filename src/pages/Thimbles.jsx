import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Menu, History, Minus, Plus, ChevronsLeft, ChevronsRight } from 'lucide-react';
import GameHeader from '@/components/GameHeader';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import GameLoadingScreen from '@/components/GameLoadingScreen';

const MIN_BET = 0.1;
const MAX_BET = 500;
const DEFAULT_BET = 1;
const BET_STEP = 0.1;
const SINGLE_MULT = 2.88;
const TWO_MULT = 1.44;
const SHUFFLE_SWAPS = 13;
const SHUFFLE_MS = 320;

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
  const [message, setMessage] = useState('Press SPIN to start');
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
    setMessage('Press SPIN to start');
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

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden relative" style={{ background: 'linear-gradient(to bottom, #1a191e, #100f14)', fontFamily: 'Georgia, serif' }}>
      {!loaded && <GameLoadingScreen title="Thimbles" onDone={() => setLoaded(true)} />}
      <GameHeader title="Thimbles" balance={balance} />

      <main className="max-w-md w-full mx-auto px-3 py-3 flex flex-col gap-3 flex-1 relative z-10">
        {/* Betting controls bar */}
        <div className="rounded-xl py-4 px-5 flex items-center justify-between" style={{ backgroundImage: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/29e26897b_generated_image.png')", backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', boxShadow: '0 3px 10px rgba(0,0,0,0.55)' }}>
          <button onClick={() => setBet(MIN_BET)} className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform active:scale-90" style={{ background: 'linear-gradient(to bottom, #6a5a4a, #3a2e22)', border: '1px solid rgba(180,140,80,0.6)' }} title="Min">
            <ChevronsLeft className="w-5 h-5" style={{ color: '#e0d8c0' }} />
          </button>
          <button onClick={() => adjustBet(-BET_STEP)} className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform active:scale-90" style={{ background: 'linear-gradient(to bottom, #6a5a4a, #3a2e22)', border: '1px solid rgba(180,140,80,0.6)' }}>
            <Minus className="w-5 h-5" style={{ color: '#e0d8c0' }} />
          </button>
          <div className="flex flex-col items-center px-3">
            <span className="text-[10px] tracking-widest" style={{ color: '#b0a890' }}>TOTAL BET</span>
            <span className="text-xl font-black tabular-nums" style={{ color: '#ffe8a0' }}>{bet.toFixed(2)} USDT</span>
          </div>
          <button onClick={() => adjustBet(BET_STEP)} className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform active:scale-90" style={{ background: 'linear-gradient(to bottom, #6a5a4a, #3a2e22)', border: '1px solid rgba(180,140,80,0.6)' }}>
            <Plus className="w-5 h-5" style={{ color: '#e0d8c0' }} />
          </button>
          <button onClick={() => setBet(MAX_BET)} className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform active:scale-90" style={{ background: 'linear-gradient(to bottom, #6a5a4a, #3a2e22)', border: '1px solid rgba(180,140,80,0.6)' }} title="Max">
            <ChevronsRight className="w-5 h-5" style={{ color: '#e0d8c0' }} />
          </button>
        </div>
        <p className="text-center text-[11px]" style={{ color: '#8a8270' }}>MIN {MIN_BET} USDT - MAX {MAX_BET} USDT</p>

        {/* Game area — ornate wood table with three barrels (full width edge-to-edge) */}
        <div className="relative overflow-hidden flex-1 flex flex-col justify-center" style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', backgroundImage: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/63f730da2_file_00000000a08482079b6365566218e339.png')", backgroundSize: 'cover', backgroundPosition: 'center', borderTop: '2px solid rgba(180,140,80,0.4)', borderBottom: '2px solid rgba(180,140,80,0.4)', boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.5)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 60%, rgba(0,0,0,0.15), rgba(0,0,0,0.35))' }} />

          {/* Ornate golden frame border around the table */}
          <div className="absolute inset-0 pointer-events-none" style={{ border: '4px solid transparent', borderImage: 'linear-gradient(135deg, #c89020 0%, #ffe890 25%, #b88010 50%, #ffe890 75%, #c89020 100%) 1', boxShadow: 'inset 0 0 0 2px rgba(60,40,10,0.7), inset 0 0 0 6px rgba(255,225,140,0.18), inset 0 0 18px rgba(0,0,0,0.55), 0 0 14px rgba(200,150,60,0.35)' }} />
          <div className="absolute inset-1 pointer-events-none" style={{ border: '1px solid rgba(255,225,140,0.45)', boxShadow: 'inset 0 0 0 3px rgba(40,28,8,0.5)' }} />
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
            <div className="px-4 py-1.5 rounded-full text-sm font-bold" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(180,140,80,0.4)', color: won ? '#ffe066' : '#e0d8c0' }}>
              {message}
            </div>
          </div>

          {/* Three barrels */}
          <div className="relative w-full max-w-[380px] mx-auto px-4" style={{ height: '240px' }}>
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

        {/* Game config panel — 1 ball / 2 balls selectors */}
        <div className="rounded-xl py-4 px-5 flex items-center justify-around" style={{ backgroundImage: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/7e2a98220_generated_image.png')", backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', boxShadow: '0 3px 10px rgba(0,0,0,0.55)' }}>
          <button
            onClick={() => phase === 'idle' && setMode('single')}
            className="flex flex-col items-center gap-1 transition-transform active:scale-95"
            style={{ opacity: mode === 'single' ? 1 : 0.5 }}
          >
            <span className="text-[11px] font-bold tracking-widest" style={{ color: mode === 'single' ? '#ffe8a0' : '#a09080' }}>1 BALL</span>
            <span className="text-lg font-black tabular-nums" style={{ color: mode === 'single' ? '#ffe066' : '#8a7a60', textShadow: mode === 'single' ? '0 0 8px rgba(255,210,100,0.6)' : 'none' }}>X {SINGLE_MULT}</span>
          </button>
          <div className="w-px h-12" style={{ background: 'rgba(180,140,80,0.3)' }} />
          <button
            onClick={() => phase === 'idle' && setMode('two')}
            className="flex flex-col items-center gap-1 transition-transform active:scale-95"
            style={{ opacity: mode === 'two' ? 1 : 0.5 }}
          >
            <span className="text-[11px] font-bold tracking-widest" style={{ color: mode === 'two' ? '#ffe8a0' : '#a09080' }}>2 BALLS</span>
            <span className="text-lg font-black tabular-nums" style={{ color: mode === 'two' ? '#ffe066' : '#8a7a60', textShadow: mode === 'two' ? '0 0 8px rgba(255,210,100,0.6)' : 'none' }}>X {TWO_MULT}</span>
          </button>
        </div>

        {/* Spin / New Game button */}
        {(phase === 'idle' || phase === 'over') && (
          <button
            onClick={phase === 'over' ? newGame : start}
            disabled={phase === 'idle' && balance < bet}
            className="w-full py-5 px-4 rounded-xl text-lg font-black transition-all disabled:opacity-40 flex items-center justify-center"
            style={{
              backgroundImage: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/fc546bfd1_generated_image.png')",
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              color: '#1a1206',
              textShadow: '0 1px 2px rgba(255,240,200,0.6)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            {phase === 'over' ? 'NEW GAME' : 'SPIN'}
          </button>
        )}
        {(phase === 'peek' || phase === 'shuffling' || phase === 'picking') && (
          <div className="w-full py-4 rounded-xl text-center text-lg font-black" style={{ background: 'linear-gradient(to bottom, #4a3a2a, #2e2218)', color: '#8a7a60', border: '1px solid rgba(180,140,80,0.3)' }}>
            {phase === 'peek' ? 'WATCH…' : phase === 'shuffling' ? 'SHUFFLING…' : 'PICK A CUP'}
          </div>
        )}
      </main>

      {/* Bottom action bar */}
      <div className="w-full max-w-md mx-auto px-3 pb-2 relative z-10">
        <div className="rounded-xl py-2.5 px-4 flex items-center justify-between" style={{ background: 'linear-gradient(to bottom, #2e2218, #1a1208)', border: '1px solid rgba(180,140,80,0.4)' }}>
          <button className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(180,140,80,0.15)' }}>
            <ChevronLeft className="w-5 h-5" style={{ color: '#e0d8c0' }} />
          </button>
          <button className="flex items-center gap-2 px-5 py-2 rounded-lg" style={{ backgroundImage: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f6b605161_generated_image.png')", backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
            <History className="w-4 h-4" style={{ color: '#ffe8a0' }} />
            <span className="text-sm font-bold" style={{ color: '#ffe8a0' }}>History</span>
          </button>
          <button className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(180,140,80,0.15)' }}>
            <Menu className="w-5 h-5" style={{ color: '#e0d8c0' }} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[9px] tabular-nums truncate max-w-[60%]" style={{ color: '#6a6258' }}>HASH: {hash.substring(0, 28)}…</span>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: '#a09080' }}>Cash: {balance.toFixed(2)} USDT</span>
        </div>
      </div>
    </div>
  );
}

const BARREL_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/35b2a44e4_file_00000000149481fa80aa6a96e6a047f9.png';

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

const BALL_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/8a7398106_file_00000000fdcc81fa9090dcaff6ecfea6.png';

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