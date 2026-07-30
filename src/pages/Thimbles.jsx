import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Menu, History } from 'lucide-react';
import GameHeader from '@/components/GameHeader';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import GameLoadingScreen from '@/components/GameLoadingScreen';
import ThimblesBetPanel from '@/components/thimbles/ThimblesBetPanel';
import ThimblesGameTable from '@/components/thimbles/ThimblesGameTable';
import ThimblesMultiplierPanel from '@/components/thimbles/ThimblesMultiplierPanel';
import ThimblesSideControls from '@/components/thimbles/ThimblesSideControls';
import ThimblesBottomNav from '@/components/thimbles/ThimblesBottomNav';
import ThimblesPromoBanners from '@/components/thimbles/ThimblesPromoBanners';

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

const SPIN_FRAME = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/fc546bfd1_generated_image.png';
const HISTORY_FRAME = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f6b605161_generated_image.png';

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

  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden relative"
      style={{ background: '#000000', fontFamily: 'Georgia, serif' }}
    >
      {!loaded && <GameLoadingScreen title="Thimbles" onDone={() => setLoaded(true)} />}
      <GameHeader title="Thimbles" balance={balance} />

      <main className="max-w-md w-full mx-auto px-3 py-3 flex flex-col gap-3 flex-1 relative z-10">
        <ThimblesBetPanel
          bet={bet}
          MIN_BET={MIN_BET}
          MAX_BET={MAX_BET}
          BET_STEP={BET_STEP}
          adjustBet={adjustBet}
          setBet={setBet}
        />

        <ThimblesGameTable
          phase={phase}
          positions={positions}
          ballCups={ballCups}
          picked={picked}
          won={won}
          message={message}
          pick={pick}
          slotLeft={slotLeft}
          SHUFFLE_MS={SHUFFLE_MS}
        />

        <ThimblesMultiplierPanel
          mode={mode}
          setMode={setMode}
          phase={phase}
          SINGLE_MULT={SINGLE_MULT}
          TWO_MULT={TWO_MULT}
        />

        <ThimblesSideControls
          onSpin={phase === 'over' ? newGame : start}
          onBetMax={() => setBet(MAX_BET)}
          onClearBet={() => setBet(MIN_BET)}
          phase={phase}
        />

        {/* Big main SPIN / NEW GAME button */}
        {(phase === 'idle' || phase === 'over') && (
          <button
            onClick={phase === 'over' ? newGame : start}
            disabled={phase === 'idle' && balance < bet}
            className="w-full py-5 px-4 rounded-xl text-lg font-black transition-all disabled:opacity-40 flex items-center justify-center"
            style={{
              backgroundImage: `url('${SPIN_FRAME}')`,
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
          <div
            className="w-full py-4 rounded-xl text-center text-lg font-black"
            style={{ background: 'linear-gradient(to bottom, #4a3a2a, #2e2218)', color: '#8a7a60', border: '1px solid rgba(180,140,80,0.3)' }}
          >
            {phase === 'peek' ? 'WATCH…' : phase === 'shuffling' ? 'SHUFFLING…' : 'PICK A CUP'}
          </div>
        )}

        <ThimblesBottomNav />

        <ThimblesPromoBanners />
      </main>

      {/* Bottom action bar */}
      <div className="w-full max-w-md mx-auto px-3 pb-2 relative z-10">
        <div
          className="rounded-xl py-2.5 px-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(to bottom, #2e2218, #1a1208)', border: '1px solid rgba(180,140,80,0.4)' }}
        >
          <button className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(180,140,80,0.15)' }}>
            <ChevronLeft className="w-5 h-5" style={{ color: '#e0d8c0' }} />
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2 rounded-lg"
            style={{ backgroundImage: `url('${HISTORY_FRAME}')`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
          >
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