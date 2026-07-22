import React, { useState } from 'react';
import { Bomb, Pickaxe, DollarSign, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import GameHeader from '@/components/GameHeader';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import GameLoadingScreen from '@/components/GameLoadingScreen';

const TOTAL = 25;
const COLS = 5;
const MIN_BET = 0.05;
const BETS = [0.1, 1, 10, 50, 100, 500];
const MINE_PRESETS = [1, 3, 5, 10, 24];

const W = { fontFamily: 'Rye, Georgia, serif' };

let _actx = null;
function actx() {
  if (typeof window === 'undefined') return null;
  if (!_actx) {
    try { _actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { _actx = null; }
  }
  return _actx;
}
function playDing(freq, t0, dur, type = 'triangle', gain = 0.18) {
  const ac = actx(); if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type; o.frequency.value = freq;
  o.connect(g); g.connect(ac.destination);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
function playCorrect() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  playDing(660, t, 0.14);
  playDing(880, t + 0.08, 0.16);
  playDing(1175, t + 0.18, 0.22);
}
function playBoom() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  // noise burst
  const buf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  const src = ac.createBufferSource(); src.buffer = buf;
  const ng = ac.createGain(); ng.gain.setValueAtTime(0.5, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(1200, t); lp.frequency.exponentialRampToValueAtTime(120, t + 0.4);
  src.connect(lp); lp.connect(ng); ng.connect(ac.destination);
  src.start(t); src.stop(t + 0.5);
  // low thud
  const o = ac.createOscillator(); const og = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.3);
  og.gain.setValueAtTime(0.4, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  o.connect(og); og.connect(ac.destination);
  o.start(t); o.stop(t + 0.36);
}

const GIFT_STRIPES = ['#ffffff', '#e53935', '#1e88e5', '#fdd835', '#43a047'];



// House-edge-adjusted multiplier for k revealed safe tiles given m mines.
const EDGE = 0.03;
function multiplierFor(k, m) {
  const safe = TOTAL - m;
  if (k <= 0) return 1;
  let r = 1;
  for (let i = 0; i < k; i++) r *= (TOTAL - i) / (safe - i);
  return r * (1 - EDGE);
}

// Wooden-framed button style (gold-trim dark wood)
const woodBtn = (active, color = 'amber') => ({
  border: '1px solid rgba(190,140,55,0.85)',
  background: active
    ? `linear-gradient(to bottom, rgba(255,210,120,0.95), rgba(200,150,60,0.95))`
    : `linear-gradient(to bottom, rgba(58,40,18,0.95), rgba(26,18,9,0.95))`,
  boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.3), inset 0 0 0 1px rgba(46,30,12,0.6), 0 2px 5px rgba(0,0,0,0.55)',
  color: active ? '#1a1206' : 'rgba(255,220,150,0.92)',
});

export default function Mines() {
  const { balance, setBalance } = useCasinoBalance();
  const [loaded, setLoaded] = useState(false);
  const { rtp } = useGameSettings('mines');
  const [betIdx, setBetIdx] = useState(0);
  const [customBet, setCustomBet] = useState('');
  const bet = customBet ? Math.max(MIN_BET, Number(customBet)) : BETS[betIdx];
  const [mines, setMines] = useState(3);
  const safe = TOTAL - mines;

  const [phase, setPhase] = useState('idle'); // idle | playing | over
  const [mineSet, setMineSet] = useState(new Set());
  const [revealed, setRevealed] = useState(new Set());
  const [revealedOrder, setRevealedOrder] = useState([]);
  const [pot, setPot] = useState(1);
  const [lastWin, setLastWin] = useState(0);
  const [message, setMessage] = useState('Place yer bet an\' pick the mines');
  const [forceFirstMine, setForceFirstMine] = useState(false);
  const logActivity = useLogActivity();

  const currentMult = pot;
  const nextMult = multiplierFor(revealedOrder.length + 1, mines);

  const start = () => {
    if (phase === 'playing') return;
    if (!bet || bet < MIN_BET) { setMessage('Min bet is $0.05'); return; }
    if (balance < bet) { setMessage('Not enough gold, partner'); return; }
    setBalance((b) => b - bet);
    const positions = Array.from({ length: TOTAL }, (_, i) => i);
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    setMineSet(new Set(positions.slice(0, mines)));
    setRevealed(new Set());
    setRevealedOrder([]);
    setPot(1);
    setLastWin(0);
    setForceFirstMine(Math.random() >= (rtp / 100));
    setPhase('playing');
    setMessage(`Find ${safe} gold bars · dodge ${mines} TNT`);
  };

  const reveal = (idx) => {
    if (phase !== 'playing' || revealed.has(idx)) return;
    const effective = new Set(mineSet);
    if (revealed.size === 0) {
      if (forceFirstMine) {
        if (!effective.has(idx)) {
          effective.add(idx);
          const others = [...effective].filter((x) => x !== idx);
          if (others.length) effective.delete(others[Math.floor(Math.random() * others.length)]);
        }
      } else if (effective.has(idx)) {
        effective.delete(idx);
        const cands = [];
        for (let i = 0; i < TOTAL; i++) if (i !== idx && !effective.has(i)) cands.push(i);
        if (cands.length) effective.add(cands[Math.floor(Math.random() * cands.length)]);
      }
      setMineSet(effective);
    }
    const newRev = new Set(revealed);
    newRev.add(idx);
    setRevealed(newRev);
    setRevealedOrder([...revealedOrder, idx]);

    if (effective.has(idx)) {
      playBoom();
      setPhase('over');
      setPot(0);
      setMessage('BOOM! Yer gold went up in smoke');
      logActivity('mines', bet, 0, 'loss');
      return;
    }
    playCorrect();
    const k = newRev.size;
    const newPot = multiplierFor(k, mines);
    setPot(newPot);
    if (k === safe) {
      const win = bet * newPot;
      setBalance((b) => b + win);
      setLastWin(win);
      setMessage(`Strike it rich! +$${win.toFixed(2)} (${newPot.toFixed(2)}x)`);
      logActivity('mines', bet, win, 'win');
      setPhase('over');
    } else {
      setMessage(`Gold! Pot be $${(bet * newPot).toFixed(2)}`);
    }
  };

  const cashout = () => {
    if (phase !== 'playing' || revealed.size === 0) return;
    const win = bet * pot;
    setBalance((b) => b + win);
    setLastWin(win);
    setMessage(`Cashed out $${win.toFixed(2)} (${pot.toFixed(2)}x)`);
    logActivity('mines', bet, win, 'win');
    setPhase('over');
  };

  const newGame = () => {
    setPhase('idle');
    setRevealed(new Set());
    setRevealedOrder([]);
    setMineSet(new Set());
    setPot(1);
    setMessage('Place yer bet an\' pick the mines');
  };

  const isOver = phase === 'over';
  const halfBet = () => +(Math.max(MIN_BET, bet / 2)).toFixed(2);
  const doubleBet = () => +(bet * 2).toFixed(2);

  return (
    <div className="min-h-screen text-amber-100 flex flex-col relative" style={{ background: 'linear-gradient(to bottom, #1a1108, #0d0905)', ...W }}>
      {!loaded && <GameLoadingScreen title="Mines" emoji="💣" onDone={() => setLoaded(true)} />}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/7ad5415af_.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.5, mixBlendMode: 'screen' }} />
      <GameHeader title="Mines" accent="text-amber-200" border="border-amber-600/40" />

      <main className="max-w-md w-full mx-auto px-4 py-5 flex flex-col gap-4 flex-1">
        {/* Balance bar */}
        <WesternFrame className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg relative" style={{ background: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/00dc49c08_generated_image.png') center / cover, radial-gradient(circle, rgba(255,210,120,0.25), rgba(120,80,30,0.4))", border: '1px solid rgba(190,140,55,0.7)' }}>
              <DollarSign className="w-5 h-5 text-amber-300 relative" />
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

        {/* Grid */}
        <WesternFrame className="p-3">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: TOTAL }).map((_, i) => {
              const isRev = revealed.has(i);
              const isMine = mineSet.has(i);
              const showMine = isRev && isMine;
              const showSafe = isRev && !isMine;
              const revealLost = isOver && isMine && !isRev;
              return (
                <button
                  key={i}
                  onClick={() => reveal(i)}
                  disabled={phase !== 'playing' || isRev}
                  className="aspect-square rounded-md flex items-center justify-center transition-all duration-150"
                  style={
                    showMine ? { background: 'radial-gradient(circle, #8b1a1a, #4a0a0a)', border: '1px solid #e0742b', boxShadow: '0 0 12px rgba(255,120,40,0.6)' }
                    : showSafe ? { background: 'linear-gradient(to bottom, rgba(40,28,14,0.95), rgba(20,14,7,0.95))', border: '1px solid rgba(190,140,55,0.8)' }
                    : revealLost ? { background: 'radial-gradient(circle, #3a0a0a, #1a0808)', border: '1px solid rgba(190,60,40,0.5)' }
                    : {
                        background: 'linear-gradient(to bottom, rgba(58,40,18,0.92), rgba(26,18,9,0.94))',
                        border: '1px solid rgba(190,140,55,0.6)',
                        boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.25), inset 0 -2px 4px rgba(0,0,0,0.4)',
                      }
                  }
                >
                  {showMine ? <Bomb className="w-7 h-7 text-stone-900" style={{ filter: 'drop-shadow(0 0 6px rgba(255,120,40,0.8))' }} />
                    : showSafe ? <GoldBar />
                    : revealLost ? <Bomb className="w-6 h-6 text-rose-300/80" />
                    : <GiftBox />}
                </button>
              );
            })}
          </div>
        </WesternFrame>

        {/* Controls panel */}
        {phase === 'idle' && (
          <WesternFrame className="p-4 flex flex-col gap-4">
            {/* Bet */}
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

            {/* Mines */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-amber-200" style={W}>MINES</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setMines((m) => Math.max(1, m - 1))} className="w-7 h-7 rounded-md flex items-center justify-center" style={woodBtn(false)}><ChevronDown className="w-4 h-4" /></button>
                  <input
                    value={mines}
                    onChange={(e) => { const n = Math.min(24, Math.max(1, parseInt(e.target.value.replace(/\D/g, '')) || 1)); setMines(n); }}
                    className="w-12 text-center rounded-md py-1 text-sm outline-none"
                    style={{ border: '1px solid rgba(190,140,55,0.6)', background: 'rgba(20,13,6,0.9)', color: '#ffe6a8', ...W }}
                  />
                  <button onClick={() => setMines((m) => Math.min(24, m + 1))} className="w-7 h-7 rounded-md flex items-center justify-center" style={woodBtn(false)}><ChevronUp className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {MINE_PRESETS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMines(m)}
                    className="py-1.5 rounded-md text-xs transition-colors"
                    style={{ ...woodBtn(mines === m, 'rose'), ...W }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <StatBox label="GOLD" value={safe} />
              <StatBox label="MAX WIN" value={`${multiplierFor(safe, mines).toFixed(2)}x`} gold />
              <StatBox label="PAYOUT" value={`$${(bet * multiplierFor(safe, mines)).toFixed(2)}`} />
            </div>
          </WesternFrame>
        )}

        {/* Ticker while playing */}
        {phase === 'playing' && (
          <WesternFrame className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-widest text-amber-300/70" style={W}>CURRENT</p>
              <p className="text-xl text-amber-300 tabular-nums" style={W}>{currentMult.toFixed(2)}x</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] tracking-widest text-amber-300/70" style={W}>WIN</p>
              <p className="text-base text-amber-100 tabular-nums" style={W}>${(bet * pot).toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] tracking-widest text-amber-300/70" style={W}>NEXT</p>
              <p className="text-base text-amber-300 tabular-nums" style={W}>{nextMult.toFixed(2)}x</p>
            </div>
          </WesternFrame>
        )}

        {/* Message */}
        <WesternFrame className="py-2 text-center">
          <span className="text-xs text-amber-200" style={W}>{message}</span>
        </WesternFrame>

        {/* Action buttons */}
        {phase === 'idle' && (
          <button onClick={start} disabled={balance < bet} className="w-full py-4 rounded-xl text-base transition-all flex items-center justify-center gap-2 disabled:opacity-40 relative" style={{ background: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/67ff4e03b_generated_image.png') center / cover, linear-gradient(to bottom, #f5c542, #c8881e)", border: '1px solid rgba(245,210,120,0.9)', boxShadow: 'inset 0 1px 0 rgba(255,240,180,0.5), 0 3px 10px rgba(200,136,30,0.45)', color: '#2a1a06', ...W }}>
            <Pickaxe className="w-5 h-5 relative" /> <span className="relative" style={{ color: '#f5c542', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>BET ${bet.toFixed(2)} · {mines} MINES</span>
          </button>
        )}
        {phase === 'playing' && (
          <button onClick={cashout} disabled={revealed.size === 0} className="w-full py-4 rounded-xl text-base font-black transition-all disabled:opacity-40" style={{ ...woodBtn(true), ...W }}>
            CASH OUT ${(bet * pot).toFixed(2)}
          </button>
        )}
        {isOver && (
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

function GiftBox() {
  return (
    <div className="relative w-[72%] h-[62%] rounded-[3px] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.45)' }}>
      <div className="grid grid-cols-5 h-full w-full">
        {GIFT_STRIPES.map((c) => (
          <div key={c} style={{ background: c }} />
        ))}
      </div>
      {/* vertical ribbon */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[22%]" style={{ background: 'linear-gradient(to bottom, #fff7d6, #ffd75a)', boxShadow: 'inset 0 0 0 1px rgba(120,80,10,0.4)' }} />
      {/* horizontal ribbon */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[22%]" style={{ background: 'linear-gradient(to right, #fff7d6, #ffd75a)', boxShadow: 'inset 0 0 0 1px rgba(120,80,10,0.4)' }} />
      {/* bow knot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[26%] h-[26%] rounded-full" style={{ background: 'radial-gradient(circle, #ffe98a, #d6a21e)', boxShadow: '0 0 4px rgba(0,0,0,0.4)' }} />
    </div>
  );
}

function GoldBar() {
  return (
    <div
      className="w-[72%] h-[52%] rounded-[3px] flex items-center justify-center"
      style={{
        background: 'linear-gradient(to bottom, #fff3c4, #f0c850 45%, #b8801e)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,240,0.8), 0 0 8px rgba(255,210,120,0.55)',
        border: '1px solid rgba(90,60,15,0.55)',
      }}
    >
      <span className="text-[9px] tracking-widest text-[#5a3a0a]" style={{ fontFamily: 'Rye, Georgia, serif' }}>GOLD</span>
    </div>
  );
}