import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, RotateCcw, ChevronDown, ChevronUp, Trophy, Eye } from 'lucide-react';
import GameHeader from '@/components/GameHeader';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import GameLoadingScreen from '@/components/GameLoadingScreen';

const MIN_BET = 0.05;
const BETS = [0.1, 1, 10, 50, 100, 500];
const RTP = 0.96;
const SINGLE_MULT = 3 * RTP;   // 2.88x
const TWO_MULT = 1.5 * RTP;    // 1.44x
const SHUFFLE_SWAPS = 7;
const SHUFFLE_MS = 280;

const W = { fontFamily: 'Rye, Georgia, serif' };

let _actx = null;
function actx() {
  if (typeof window === 'undefined') return null;
  if (!_actx) {
    try { _actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { _actx = null; }
  }
  return _actx;
}
function playTone(freq, t0, dur, type = 'triangle', gain = 0.15) {
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
  playTone(220, t, 0.08, 'sawtooth', 0.08);
  playTone(180, t + 0.05, 0.08, 'sawtooth', 0.06);
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
  playTone(300, t, 0.18, 'sawtooth', 0.12);
  playTone(200, t + 0.12, 0.22, 'sawtooth', 0.1);
}

const woodBtn = (active) => ({
  border: '1px solid rgba(190,140,55,0.85)',
  background: active
    ? 'linear-gradient(to bottom, rgba(255,210,120,0.95), rgba(200,150,60,0.95))'
    : 'linear-gradient(to bottom, rgba(58,40,18,0.95), rgba(26,18,9,0.95))',
  boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.3), inset 0 0 0 1px rgba(46,30,12,0.6), 0 2px 5px rgba(0,0,0,0.55)',
  color: active ? '#1a1206' : 'rgba(255,220,150,0.92)',
});

export default function Thimbles() {
  const { balance, setBalance } = useCasinoBalance();
  const [loaded, setLoaded] = useState(false);
  const { rtp } = useGameSettings('thimbles');
  const [betIdx, setBetIdx] = useState(0);
  const [customBet, setCustomBet] = useState('');
  const bet = customBet ? Math.max(MIN_BET, Number(customBet)) : BETS[betIdx];
  const [mode, setMode] = useState('single'); // 'single' | 'two'
  const [phase, setPhase] = useState('idle'); // idle | shuffling | picking | over
  const [positions, setPositions] = useState([0, 1, 2]); // cup index -> slot
  const [ballCups, setBallCups] = useState(new Set()); // cup indices hiding a ball
  const [picked, setPicked] = useState(null); // cup index the player picked
  const [won, setWon] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [message, setMessage] = useState('Place yer bet an\' pick a cup');
  const [shuffleKey, setShuffleKey] = useState(0);
  const logActivity = useLogActivity();
  const timers = useRef([]);

  const mult = mode === 'single' ? SINGLE_MULT : TWO_MULT;
  const winChance = rtp / 100;

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const start = () => {
    if (phase !== 'idle' && phase !== 'over') return;
    if (!bet || bet < MIN_BET) { setMessage('Min bet is $0.05'); return; }
    if (balance < bet) { setMessage('Not enough gold, partner'); return; }
    setBalance((b) => b - bet);

    // Decide outcome based on RTP win chance.
    const willWin = Math.random() < winChance;

    // Place ball(s). Cups are 0,1,2. In single mode 1 ball; in two mode 2 balls.
    const numBalls = mode === 'single' ? 1 : 2;
    // We'll place balls after the shuffle; for now pick random cups.
    // The picked cup will be decided by the player; we bias the ball placement
    // to match the pre-decided outcome after the player picks.
    setBallCups(new Set());
    setPicked(null);
    setWon(false);
    setLastWin(0);
    setPositions([0, 1, 2]);
    setMessage(mode === 'single' ? 'Find the golden ball!' : 'Find a golden ball!');
    setPhase('shuffling');
    setShuffleKey((k) => k + 1);

    // Run shuffle animation: swap positions several times.
    let cur = [0, 1, 2];
    let swaps = 0;
    const doSwap = () => {
      if (swaps >= SHUFFLE_SWAPS) {
        // After shuffle, go to picking phase.
        setPositions([...cur]);
        const t = setTimeout(() => {
          setPhase('picking');
          setMessage('Pick a cup!');
        }, 200);
        timers.current.push(t);
        return;
      }
      // pick two different slots to swap
      const a = Math.floor(Math.random() * 3);
      let b = Math.floor(Math.random() * 3);
      while (b === a) b = Math.floor(Math.random() * 3);
      // swap cups in slots a and b
      const cupA = cur.indexOf(a);
      const cupB = cur.indexOf(b);
      cur = cur.map((slot, cup) => (cup === cupA ? b : cup === cupB ? a : slot));
      setPositions([...cur]);
      playShuffle();
      swaps++;
      const t = setTimeout(doSwap, SHUFFLE_MS);
      timers.current.push(t);
    };
    // Small initial delay so the player sees the cups before they move.
    const t0 = setTimeout(doSwap, 300);
    timers.current.push(t0);

    // Store the willWin decision for the pick handler.
    // We use a ref-like approach via state since the pick happens later.
    pendingWin.current = willWin;
  };

  const pendingWin = useRef(false);

  const pick = (cupIdx) => {
    if (phase !== 'picking') return;
    clearTimers();
    setPicked(cupIdx);
    setPhase('over');

    const willWin = pendingWin.current;
    const numBalls = mode === 'single' ? 1 : 2;

    // Place balls to match the pre-decided outcome.
    let cups;
    if (willWin) {
      // Place a ball under the picked cup + random others.
      cups = new Set([cupIdx]);
      while (cups.size < numBalls) {
        cups.add(Math.floor(Math.random() * 3));
      }
    } else {
      // Place balls under cups that are NOT the picked cup.
      const others = [0, 1, 2].filter((c) => c !== cupIdx);
      cups = new Set();
      // For single mode: place 1 ball among the other 2 cups.
      // For two mode: place 2 balls — but we need the picked cup to lose, so
      // both balls go under the other 2 cups.
      const shuffled = others.sort(() => Math.random() - 0.5);
      const count = Math.min(numBalls, others.length);
      for (let i = 0; i < count; i++) cups.add(shuffled[i]);
      // If single mode and we still need the ball not under picked — done (1 of 2 others).
    }
    setBallCups(cups);

    if (willWin) {
      const win = bet * mult;
      setBalance((b) => b + win);
      setLastWin(win);
      setWon(true);
      setMessage(`Ya found it! +$${win.toFixed(2)} (${mult.toFixed(2)}x)`);
      playWin();
      logActivity('thimbles', bet, win, 'win', mult);
    } else {
      setLastWin(0);
      setWon(false);
      setMessage('Wrong cup! The ball got away');
      playLose();
      logActivity('thimbles', bet, 0, 'loss', 0);
    }
  };

  const newGame = () => {
    clearTimers();
    setPhase('idle');
    setPicked(null);
    setBallCups(new Set());
    setPositions([0, 1, 2]);
    setWon(false);
    setLastWin(0);
    setMessage('Place yer bet an\' pick a cup');
  };

  const halfBet = () => +(Math.max(MIN_BET, bet / 2)).toFixed(2);
  const doubleBet = () => +(bet * 2).toFixed(2);

  const slotLeft = (slot) => `${slot * 33.333}%`;

  return (
    <div className="min-h-screen text-amber-100 flex flex-col relative" style={{ background: 'linear-gradient(to bottom, #1a1108, #0d0905)', ...W }}>
      {!loaded && <GameLoadingScreen title="Thimbles" onDone={() => setLoaded(true)} />}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/7ad5415af_.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.4, mixBlendMode: 'screen' }} />
      <GameHeader title="Thimbles" balance={balance} />

      <main className="max-w-md w-full mx-auto px-4 py-5 flex flex-col gap-4 flex-1">
        {/* Balance / profit bar */}
        <WesternFrame className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: 'radial-gradient(circle, rgba(255,210,120,0.25), rgba(120,80,30,0.4))', border: '1px solid rgba(190,140,55,0.7)' }}>
              <DollarSign className="w-5 h-5 text-amber-300" />
            </span>
            <div>
              <p className="text-[10px] tracking-widest text-amber-300/70" style={W}>BALANCE</p>
              <p className="text-lg text-amber-200 tabular-nums" style={W}>${balance.toFixed(2)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-widest text-amber-300/70" style={W}>PROFIT</p>
            <p className={`text-sm tabular-nums ${lastWin > 0 ? 'text-amber-300' : 'text-amber-100/50'}`} style={W}>
              {lastWin > 0 ? `+$${lastWin.toFixed(2)}` : '$0.00'}
            </p>
          </div>
        </WesternFrame>

        {/* Game board — three cups */}
        <WesternFrame className="p-4">
          <div className="relative w-full" style={{ height: '180px' }}>
            {/* table surface line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(to right, transparent, rgba(190,140,55,0.5), transparent)' }} />
            {phase === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-amber-300/60 text-center px-4" style={W}>
                  {mode === 'single' ? 'One ball · 2.88x payout' : 'Two balls · 1.44x payout'}
                </p>
              </div>
            )}
            {phase !== 'idle' && [0, 1, 2].map((cupIdx) => {
              const slot = positions[cupIdx];
              const isPicked = picked === cupIdx;
              const hasBall = ballCups.has(cupIdx);
              const reveal = phase === 'over';
              return (
                <button
                  key={cupIdx}
                  onClick={() => pick(cupIdx)}
                  disabled={phase !== 'picking'}
                  className="absolute top-1/2 -translate-y-1/2 transition-all"
                  style={{
                    left: slotLeft(slot),
                    width: '33.333%',
                    transitionDuration: phase === 'shuffling' ? `${SHUFFLE_MS}ms` : '300ms',
                    transitionTimingFunction: 'ease-in-out',
                    opacity: phase === 'idle' ? 0 : 1,
                  }}
                >
                  <Cup revealed={reveal && (isPicked || hasBall)} hasBall={reveal && hasBall} picked={isPicked && reveal} won={won} disabled={phase !== 'picking'} />
                </button>
              );
            })}
          </div>
        </WesternFrame>

        {/* Message */}
        <div className="w-full rounded-xl py-3 text-center" style={{ background: '#1a1a1a', border: '1px solid #b8860b', boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
          <span className="text-sm" style={{ color: won ? '#ffd75a' : '#c5a059', ...W }}>{message}</span>
        </div>

        {/* Mode selector — only in idle */}
        {phase === 'idle' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('single')}
              className="rounded-xl py-3 px-2 transition-all"
              style={{ ...woodBtn(mode === 'single'), ...W }}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs">ONE BALL</span>
                <span className="text-base font-black">{SINGLE_MULT.toFixed(2)}x</span>
                <span className="text-[9px] opacity-70">1 in 3 chance</span>
              </div>
            </button>
            <button
              onClick={() => setMode('two')}
              className="rounded-xl py-3 px-2 transition-all"
              style={{ ...woodBtn(mode === 'two'), ...W }}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs">TWO BALLS</span>
                <span className="text-base font-black">{TWO_MULT.toFixed(2)}x</span>
                <span className="text-[9px] opacity-70">2 in 3 chance</span>
              </div>
            </button>
          </div>
        )}

        {/* Bet button */}
        {phase === 'idle' && (
          <button onClick={start} disabled={balance < bet} className="w-full py-4 rounded-xl text-base transition-all flex items-center justify-center gap-2 disabled:opacity-40" style={{ background: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/67ff4e03b_generated_image.png') center / cover, linear-gradient(to bottom, #4a2c1f, #2a160c)", border: '1px solid #b8860b', boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.35), 0 4px 12px rgba(0,0,0,0.6)', ...W }}>
            <Eye className="w-5 h-5" style={{ color: '#c5a059' }} />
            <span style={{ color: '#c5a059', textShadow: '0 1px 2px rgba(0,0,0,0.75)' }}>BET ${bet.toFixed(2)} · {mode === 'single' ? '1 BALL' : '2 BALLS'}</span>
          </button>
        )}

        {/* Bet controls */}
        {phase === 'idle' && (
          <WesternFrame className="p-4 flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-amber-200" style={W}>BET AMOUNT</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCustomBet(String(halfBet()))} className="w-7 h-7 rounded-md flex items-center justify-center" style={woodBtn(false)}><ChevronDown className="w-4 h-4" /></button>
                  <input
                    value={customBet || bet}
                    onChange={(e) => setCustomBet(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="w-24 text-center rounded-md py-1 text-sm tabular-nums outline-none"
                    style={{ border: '1px solid rgba(190,140,55,0.6)', background: 'rgba(20,13,6,0.9)', color: '#ffe6a8', ...W }}
                  />
                  <button onClick={() => setCustomBet(String(doubleBet()))} className="w-7 h-7 rounded-md flex items-center justify-center" style={woodBtn(false)}><ChevronUp className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {BETS.map((b, i) => (
                  <button
                    key={b}
                    onClick={() => { setBetIdx(i); setCustomBet(''); }}
                    className="py-1.5 rounded-md text-xs transition-colors"
                    style={{ ...woodBtn(!customBet && betIdx === i), ...W }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <StatBox label="PAYOUT" value={`${mult.toFixed(2)}x`} gold />
              <StatBox label="WIN" value={`$${(bet * mult).toFixed(2)}`} />
              <StatBox label="CHANCE" value={mode === 'single' ? '33%' : '67%'} />
            </div>
          </WesternFrame>
        )}

        {/* Result / new game */}
        {phase === 'over' && (
          <button onClick={newGame} className="w-full py-4 rounded-xl text-base transition-all flex items-center justify-center gap-2" style={{ ...woodBtn(true), ...W }}>
            <RotateCcw className="w-5 h-5" /> NEW GAME
          </button>
        )}
      </main>
    </div>
  );
}

function StatBox({ label, value, gold }) {
  return (
    <div className="rounded-lg py-2" style={{ border: '1px solid rgba(190,140,55,0.5)', background: 'rgba(20,13,6,0.85)' }}>
      <p className="text-[9px] tracking-widest text-amber-300/70" style={W}>{label}</p>
      <p className={`text-sm tabular-nums ${gold ? 'text-amber-300' : 'text-amber-100'}`} style={W}>{value}</p>
    </div>
  );
}

// Ornate golden carved glass cup with optional ball reveal.
const CUP_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/8e9a150fe_generated_image.png';

function Cup({ revealed, hasBall, picked, won, disabled }) {
  return (
    <div className="flex flex-col items-center" style={{ filter: disabled ? 'none' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}>
      {/* Ball (shown when revealed and cup has it) */}
      <div style={{ height: '24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        {revealed && hasBall && (
          <div
            className="rounded-full"
            style={{
              width: '20px',
              height: '20px',
              background: 'radial-gradient(circle at 35% 30%, #fff3c4, #f0c850 45%, #b8801e)',
              boxShadow: '0 0 14px rgba(255,210,120,0.9), inset 0 1px 0 rgba(255,255,240,0.8)',
              border: '1px solid rgba(90,60,15,0.5)',
              animation: 'saWinPop 0.4s ease both',
            }}
          />
        )}
      </div>
      {/* Cup body — ornate golden carved glass image */}
      <div
        className="relative mx-auto"
        style={{
          width: '78px',
          height: '88px',
          transition: 'transform 300ms ease',
          transform: revealed ? 'translateY(-8px) rotate(-8deg)' : 'translateY(0) rotate(0deg)',
        }}
      >
        <img
          src={CUP_IMG}
          alt="Golden cup"
          className="w-full h-full object-contain"
          style={{
            mixBlendMode: 'screen',
            filter: revealed && hasBall
              ? 'drop-shadow(0 0 10px rgba(255,210,120,0.7)) brightness(1.15)'
              : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
          }}
        />
        {picked && (
          <div className="absolute -top-1 -right-1 z-10">
            <Trophy className="w-5 h-5" style={{ color: won ? '#ffd75a' : '#f87171', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }} />
          </div>
        )}
      </div>
    </div>
  );
}