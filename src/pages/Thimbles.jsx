import React, { useState, useEffect, useRef } from 'react';
import { Menu, History, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
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
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();
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
      {/* Saloon background image — 35% opacity */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/47b6716b5_file_000000001a38820bbc8591d3888ea292.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.35,
          zIndex: 0,
        }}
      />
      {!loaded && <GameLoadingScreen title="Thimbles" onDone={() => setLoaded(true)} />}
      <GameHeader title="Thimbles" balance={balance} />

      <main className="max-w-md w-full mx-auto px-3 py-1 flex flex-col gap-1 flex-1 relative z-10" style={{ marginTop: '-60px' }}>
        {/* Betting controls bar — ornate gilded banner with baked-in - / + buttons */}
        <div className="relative w-full">
          <img src={BET_BANNER_IMG} alt="Total Bet" draggable={false} className="w-full h-auto select-none block" />
          {/* Center text inside the wooden panel */}
          <div className="absolute flex flex-col items-center justify-center pointer-events-none" style={{ left: '18%', right: '18%', top: 0, bottom: 0, transform: 'translateY(-20px)' }}>
            <span className="text-[10px] tracking-[0.2em]" style={{ color: '#c8b890' }}>TOTAL BET</span>
            <span className="text-xl font-black tabular-nums leading-tight" style={{ color: '#ffe8a0' }}>{bet.toFixed(2)} USDT</span>
          </div>
          {/* Minus button — left end */}
          <button onClick={() => adjustBet(-BET_STEP)} className="absolute left-0 top-0 h-full w-[18%] transition-transform active:scale-90" title="Minus" />
          {/* Plus button — right end */}
          <button onClick={() => adjustBet(BET_STEP)} className="absolute right-0 top-0 h-full w-[18%] transition-transform active:scale-90" title="Plus" />
        </div>

        {/* Game area — ornate gilded wood table with three barrels (full width edge-to-edge) */}
        <div className="relative overflow-hidden flex-1 flex flex-col justify-center" style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginTop: '-50px', backgroundImage: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/156d0d0e6_file_00000000647481fab85bdbbf2ac788cc.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>

          {/* Three barrels */}
          <div className="relative w-full max-w-[380px] mx-auto px-4" style={{ height: '200px' }}>
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

        {/* Multiplier banners — 1 ball / 2 balls selectors side-by-side */}
        <div className="flex items-stretch gap-2" style={{ marginTop: '-50px' }}>
          <button
            onClick={() => phase === 'idle' && setMode('single')}
            className="flex-1 transition-all active:scale-95"
            style={{ opacity: mode === 'single' ? 1 : 0.45 }}
          >
            <img src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/1fd7f6441_file_0000000066e081f7a29c25fb6bde36e0.png" alt="1 BALL X 2.88" draggable={false} className="w-full h-auto select-none" />
          </button>
          <button
            onClick={() => phase === 'idle' && setMode('two')}
            className="flex-1 transition-all active:scale-95"
            style={{ opacity: mode === 'two' ? 1 : 0.45, marginTop: '9px' }}
          >
            <img src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/de25c864e_file_00000000c2f081f79b316882b62f9e13.png" alt="2 BALLS X 1.44" draggable={false} className="w-full h-auto select-none" />
          </button>
        </div>

        {/* Win / Loss result banner — sits in the gap between multiplier and spin */}
        <div className="relative w-full" style={{ marginTop: '-54px', marginBottom: '-40px' }}>
          <img src={WIN_BANNER_IMG} alt="result" draggable={false} className="w-full h-auto select-none block" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: 'translateY(-17px)' }}>
            {phase === 'over' ? (
              <span className="text-lg font-black tabular-nums italic" style={{ color: '#ffe8a0', fontFamily: 'Georgia, serif' }}>
                {won ? `+${lastWin.toFixed(2)} USDT` : `-${bet.toFixed(2)} USDT`}
              </span>
            ) : (
              <span className="text-sm font-bold tracking-[0.2em] italic" style={{ color: '#ffe8a0', fontFamily: 'Georgia, serif' }}>
                {phase === 'idle' ? 'GOOD LUCK' : '…'}
              </span>
            )}
          </div>
        </div>

        {/* Spin / New Game button */}
        {(phase === 'idle' || phase === 'over') && (
          <button
            onClick={phase === 'over' ? newGame : start}
            disabled={phase === 'idle' && balance < bet}
            className="w-full transition-all disabled:opacity-40"
          >
            <img
              src={SPIN_IMG}
              alt="SPIN"
              draggable={false}
              className="w-full h-auto select-none"
              style={{
                WebkitMaskImage: `url(${SPIN_IMG})`,
                WebkitMaskMode: 'luminance',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskImage: `url(${SPIN_IMG})`,
                maskMode: 'luminance',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
              }}
            />
          </button>
        )}
        {(phase === 'peek' || phase === 'shuffling' || phase === 'picking') && (
          <div className="w-full py-2 text-center text-lg font-black" style={{ color: '#ffe8a0', fontFamily: 'Georgia, serif' }}>
            {phase === 'peek' ? 'WATCH…' : phase === 'shuffling' ? 'SHUFFLING…' : 'PICK A CUP'}
          </div>
        )}

        {/* History + Menu — right under the spin button */}
        <div className="w-full flex items-center justify-between" style={{ marginTop: '-51px' }}>
          <span style={{ width: '36px' }} />
          <button onClick={() => setShowHistory(true)} className="relative transition-transform active:scale-95" style={{ width: '42%' }}>
            <img src={HISTORY_IMG} alt="HISTORY" draggable={false} className="w-full h-auto select-none block" />
            <span className="absolute inset-0 flex items-center justify-center text-base font-black tracking-wide pointer-events-none" style={{ color: '#ffe8a0', fontFamily: 'Georgia, serif' }}>History</span>
          </button>
          <button onClick={() => navigate('/')} className="w-9 h-9 flex items-center justify-center transition-transform active:scale-90" title="Menu">
            <Menu className="w-5 h-5" style={{ color: '#e0d8c0' }} />
          </button>
        </div>
      </main>

      {/* Cash display */}
      <div className="w-full max-w-md mx-auto px-3 pb-1 relative z-10">
        <div className="flex items-center justify-end mt-1.5 px-1">
          <span className="text-[10px] font-bold tabular-nums" style={{ color: '#a09080' }}>Cash: {balance.toFixed(2)} USDT</span>
        </div>
      </div>

      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
    </div>
  );
}

const BET_BANNER_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/2c9406808_file_000000003fc481fab86dd38fbe7b4787.png';
const SPIN_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/06b6ee99c_file_000000003c488211a7ea3420ca9b6b25.png';
const BARREL_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f1d422732_file_000000002c8c81f789fe32b56de1dcdf.png';
const HISTORY_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/4fcee62b8_file_000000001a688230909747b265fab779.png';
const WIN_BANNER_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/6b98787a0_file_00000000eee082308b42773bcc9edee4.png';

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
          filter: won ? 'brightness(1.1)' : 'none',
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
        filter: 'none',
      }}
    />
  );
}

function fmtDate(d) {
  if (!d) return '';
  try {
    const dt = new Date(d);
    return dt.toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return String(d); }
}

function HistoryModal({ onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await base44.entities.PlayerActivity.filter({ game_id: 'thimbles' }, '-created_date', 60);
        if (active) setRows((list || []).filter((r) => (r.bet || 0) > 0));
      } catch { if (active) setRows([]); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  const totalBet = rows.reduce((s, r) => s + (r.bet || 0), 0);
  const totalWin = rows.reduce((s, r) => s + (r.win || 0), 0);
  const net = totalWin - totalBet;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ border: '1px solid rgba(214,178,98,0.5)', background: 'linear-gradient(to bottom, #1a191e, #100f14)', fontFamily: 'Georgia, serif' }}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(214,178,98,0.22)' }}>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" style={{ color: '#ffe8a0' }} />
            <h3 className="text-sm font-black italic" style={{ color: '#ffe8a0' }}>Thimbles History</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ border: '1px solid rgba(214,178,98,0.45)', background: 'rgba(20,17,13,0.6)', color: '#ffe8a0' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 px-4 py-3 text-center" style={{ borderBottom: '1px solid rgba(214,178,98,0.22)' }}>
          <div>
            <div className="text-[9px] font-bold tracking-wider" style={{ color: '#a09080' }}>TOTAL BET</div>
            <div className="text-sm font-black text-white tabular-nums">{totalBet.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[9px] font-bold tracking-wider" style={{ color: '#a09080' }}>TOTAL WIN</div>
            <div className="text-sm font-black tabular-nums" style={{ color: '#7ee787' }}>{totalWin.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[9px] font-bold tracking-wider" style={{ color: '#a09080' }}>NET</div>
            <div className={`text-sm font-black tabular-nums ${net >= 0 ? '' : ''}`} style={{ color: net >= 0 ? '#7ee787' : '#ff6b6b' }}>{net >= 0 ? '+' : ''}{net.toFixed(2)}</div>
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 rounded-full animate-spin" style={{ border: '2px solid rgba(214,178,98,0.3)', borderTopColor: '#ffe8a0' }} />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm italic" style={{ color: '#6a6258' }}>No history yet</div>
          ) : (
            rows.map((r) => {
              const profit = (r.win || 0) - (r.bet || 0);
              const odds = Number(r.multiplier) || 0;
              return (
                <div key={r.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 px-4 py-2 text-xs" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex flex-col">
                    <span className="font-bold" style={{ color: '#ffe8a0' }}>Thimbles</span>
                    <span className="text-[10px]" style={{ color: '#6a6258' }}>{fmtDate(r.created_date)}</span>
                  </div>
                  <span className="text-right tabular-nums" style={{ color: '#c8b890' }}>{odds > 0 ? `×${odds.toFixed(2)}` : '—'}</span>
                  <span className="text-right tabular-nums" style={{ color: '#a09080' }}>{(r.win || 0).toFixed(2)}</span>
                  <span className="text-right font-bold tabular-nums" style={{ color: profit >= 0 ? '#7ee787' : '#ff6b6b' }}>
                    {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2 text-[9px] font-bold tracking-wider" style={{ borderTop: '1px solid rgba(214,178,98,0.22)', color: '#6a6258' }}>
          <span>GAME</span>
          <span className="text-right">ODDS</span>
          <span className="text-right">WIN</span>
          <span className="text-right">NET</span>
        </div>
      </div>
    </div>
  );
}