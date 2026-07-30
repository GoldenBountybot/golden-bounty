import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, ChevronLeft, DollarSign, Plus, Pencil, Share2, Check, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import GameLoadingScreen from '@/components/GameLoadingScreen';

const MULTS = [100, 50, 25, 10, 5, 2, 0.1, 2, 5, 10, 25, 50, 100];
const ROWS = MULTS.length - 1;
const BOARD_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/41d1489a2_file_000000005b9881faa2d49d948685f05d.png';
const BETS = [0.1, 1, 5, 10];
// Absolute per-bucket landing chance (percent), symmetric across both edges.
// 100x: 0.1% · 50x: 0.3% · 25x: 0.5% · 10x: 1% · 5x: 2% · 2x: 26% (split each side).
const WEIGHTS = [0.05, 0.15, 0.25, 0.5, 1, 13, 70, 13, 1, 0.5, 0.25, 0.15, 0.05];
const WEIGHT_TOTAL = WEIGHTS.reduce((a, b) => a + b, 0);

const FONT = "Rye, Georgia, serif";

let _actx = null;
function actx() {
  if (typeof window === 'undefined') return null;
  if (!_actx) {
    try { _actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { _actx = null; }
  }
  return _actx;
}

// Metallic bell chime — rich harmonics, pleasant ping
function playPeg() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  const freqs = [1568, 2349, 3136];
  const gains = [0.14, 0.08, 0.05];
  freqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine'; o.frequency.value = f * (0.98 + Math.random() * 0.04);
    o.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gains[i], t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.start(t); o.stop(t + 0.38);
  });
}

// Soft whoosh for drop start
function playDropStart() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  // noise sweep
  const buf = ac.createBuffer(1, ac.sampleRate * 0.3, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = ac.createBufferSource(); src.buffer = buf;
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass';
  bp.frequency.setValueAtTime(400, t);
  bp.frequency.exponentialRampToValueAtTime(1200, t + 0.25);
  bp.Q.value = 1.2;
  const ng = ac.createGain(); ng.gain.setValueAtTime(0.06, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  src.connect(bp); bp.connect(ng); ng.connect(ac.destination);
  src.start(t); src.stop(t + 0.3);
  // shimmer chime
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(1318, t);
  o.frequency.exponentialRampToValueAtTime(1760, t + 0.2);
  o.connect(g); g.connect(ac.destination);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.08, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  o.start(t); o.stop(t + 0.27);
}

// Major chord arpeggio with shimmer — triumphant win
function playWin() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  notes.forEach((f, i) => {
    const s = t + i * 0.08;
    // fundamental
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    o.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(0.12, s + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, s + 0.4);
    o.start(s); o.stop(s + 0.42);
    // shimmer harmonic
    const o2 = ac.createOscillator();
    const g2 = ac.createGain();
    o2.type = 'sine'; o2.frequency.value = f * 2;
    o2.connect(g2); g2.connect(ac.destination);
    g2.gain.setValueAtTime(0.0001, s);
    g2.gain.exponentialRampToValueAtTime(0.05, s + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.0001, s + 0.3);
    o2.start(s); o2.stop(s + 0.32);
  });
}

// Gentle descending soft tone — calm, non-harsh loss
function playLose() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  const notes = [440, 369.99, 293.66];
  notes.forEach((f, i) => {
    const s = t + i * 0.12;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine'; o.frequency.value = f;
    o.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(0.09, s + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, s + 0.3);
    o.start(s); o.stop(s + 0.32);
  });
}

const woodFrame = {
  border: '1px solid rgba(190,140,55,0.75)',
  background: 'linear-gradient(to bottom, rgba(58,40,18,0.92), rgba(26,18,9,0.95))',
  boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.3), inset 0 0 0 1px rgba(46,30,12,0.6), 0 2px 6px rgba(0,0,0,0.55)',
};
const woodBtn = {
  border: '1px solid rgba(190,140,55,0.7)',
  background: 'linear-gradient(to bottom, rgba(74,52,24,0.95), rgba(40,27,12,0.95))',
  boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.25), 0 1px 3px rgba(0,0,0,0.5)',
};
const goldBtn = {
  border: '1px solid rgba(245,210,120,0.9)',
  background: 'linear-gradient(to bottom, #f5c542, #c8881e)',
  boxShadow: 'inset 0 1px 0 rgba(255,240,180,0.5), 0 3px 10px rgba(200,136,30,0.45)',
  color: '#2a1a06',
};

function colorFor(m) {
  if (m >= 100) return { bg: '#dc2626', glow: 'rgba(220,38,38,0.75)' };
  if (m >= 50) return { bg: '#d53f8c', glow: 'rgba(213,63,140,0.7)' };
  if (m >= 25) return { bg: '#7c3aed', glow: 'rgba(124,58,237,0.7)' };
  if (m >= 10) return { bg: '#ecc94b', glow: 'rgba(236,201,75,0.6)' };
  if (m >= 5) return { bg: '#f97316', glow: 'rgba(249,115,22,0.6)' };
  if (m >= 2) return { bg: '#4299e1', glow: 'rgba(66,153,225,0.6)' };
  return { bg: '#718096', glow: 'rgba(113,128,150,0.5)' };
}

const STAT_BGS = {
  Balance: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/675f2abaf_generated_image.png',
  Bet: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/0303a0164_generated_image.png',
  'Last Win': 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/3acccce01_generated_image.png',
};

function Stat({ label, value, accent }) {
  return (
    <div className="py-2 text-center relative" style={{ background: `url('${STAT_BGS[label] || Object.values(STAT_BGS)[0]}') center / cover, linear-gradient(to bottom, rgba(58,40,18,0.92), rgba(26,18,9,0.95))`, border: '1px solid rgba(190,140,55,0.75)', boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.3), 0 2px 6px rgba(0,0,0,0.55)', fontFamily: FONT }}>
      <p className="text-xs tracking-widest uppercase relative" style={{ color: '#f5c542', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>{label}</p>
      <p className="text-xs font-bold tabular-nums relative" style={{ color: accent ? '#f5c542' : '#f3e2b3', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>{value}</p>
    </div>
  );
}

export default function Plinko() {
  const { balance, setBalance } = useCasinoBalance();
  const [loaded, setLoaded] = useState(false);
  const { rtp } = useGameSettings('plinko');
  const [betIdx, setBetIdx] = useState(1);
  const [customBet, setCustomBet] = useState(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [dropping, setDropping] = useState(false);
  const [ballPos, setBallPos] = useState(null);
  const [resultBucket, setResultBucket] = useState(null);
  const [hitPeg, setHitPeg] = useState(null);
  const [message, setMessage] = useState('Drop the ball');
  const [lastWin, setLastWin] = useState(0);
  const [copied, setCopied] = useState(false);
  const timers = useRef([]);
  const bet = customBet != null ? customBet : BETS[betIdx];

  const applyCustomBet = () => {
    const v = parseFloat(customInput);
    if (isNaN(v) || v <= 0) { setMessage('Enter a valid amount'); return; }
    setCustomBet(v);
    setBetIdx(-1);
    setShowCustom(false);
    setCustomInput('');
    setMessage(`Bet set · $${v.toFixed(2)}`);
  };
  const logActivity = useLogActivity();

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const share = () => {
    try { navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch {}
  };

  const drop = () => {
    if (dropping) return;
    if (balance < bet) { setMessage('Not enough balance'); return; }
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setBalance((b) => b - bet);
    setDropping(true);
    setResultBucket(null);
    setLastWin(0);
    setMessage('Dropping…');
    setBallPos(null);
    playDropStart();

    // Weighted random landing — high multipliers are intentionally rare.
    let r = Math.random() * WEIGHT_TOTAL;
    let bucket = 0;
    for (let i = 0; i < WEIGHTS.length; i++) { r -= WEIGHTS[i]; if (r <= 0) { bucket = i; break; } }

    const steps = Array.from({ length: ROWS }, (_, i) => (i < bucket ? 1 : 0));
    for (let i = steps.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [steps[i], steps[j]] = [steps[j], steps[i]]; }
    // Ball bounces off pegs at rows 0..ROWS-1, then drops into a bucket in the
    // gap below the last peg row. It goes directly peg-to-peg (diagonal), not
    // passing through the spaces between them.
    const pegPath = [{ row: 0, col: 0 }];
    let col = 0;
    for (let r = 1; r < ROWS; r++) { col += steps[r - 1]; pegPath.push({ row: r, col }); }
    const finalCol = col + steps[ROWS - 1];

    let step = 0;
    const animate = () => {
      const cur = pegPath[step];
      setBallPos({ kind: 'peg', row: cur.row, col: cur.col });
      setHitPeg(cur);
      if (step > 0) playPeg();
      if (step < pegPath.length - 1) {
        const t = setTimeout(() => { step++; animate(); }, 200);
        timers.current.push(t);
      } else {
        const t = setTimeout(() => {
          setBallPos({ kind: 'bucket', col: finalCol });
          const t2 = setTimeout(() => {
            const mult = MULTS[finalCol];
            const win = bet * mult;
            if (win > 0) setBalance((b) => b + win);
            if (mult > 1) playWin(); else playLose();
            setLastWin(win);
            setResultBucket(finalCol);
            setMessage(`${mult}x · ${win > 0 ? `+$${win.toFixed(2)}` : 'No win'}`);
            logActivity('plinko', bet, win, mult > 1 ? 'win' : 'loss');
            setDropping(false);
            setBallPos(null);
          }, 200);
          timers.current.push(t2);
        }, 200);
        timers.current.push(t);
      }
    };
    animate();
  };

  // Peg positions matching the baked-in peg grid in the board image.
  // 12 rows in a triangle: row 0 at center top, row 11 spread 15%–85%.
  const pos = (row, col) => {
    const rowFrac = row / (ROWS - 1);
    const top = 13 + rowFrac * 67;
    const left = row === 0 ? 50 : 50 + (col - row / 2) * (70 / 11);
    return { left: `${left}%`, top: `${top}%` };
  };

  // Buckets sit in the gaps between the last row of pegs (row ROWS-1), using the
  // same spread as that row so each bucket is exactly between two pegs.
  // 13 buckets sit in the gaps below the bottom peg row, aligned with the
  // baked-in multiplier slots in the board image.
  const bucketPos = (b) => {
    const left = 50 + (b - 6) * (70 / 11);
    const top = 91;
    return { left: `${left}%`, top: `${top}%` };
  };

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: 'radial-gradient(circle at 50% 0%, #1a0f2e 0%, #0a0a12 55%, #000 100%)', fontFamily: FONT }}>
      {!loaded && <GameLoadingScreen title="Plinko Drop" emoji="🎯" onDone={() => setLoaded(true)} />}
      <div className="fixed inset-0 pointer-events-none opacity-50" style={{ backgroundImage: 'radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 60%, #b9a, transparent), radial-gradient(1px 1px at 40% 80%, #fff, transparent), radial-gradient(1.5px 1.5px at 85% 20%, #c8e, transparent), radial-gradient(1px 1px at 10% 70%, #fff, transparent)', backgroundSize: '300px 300px' }} />
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/9908875c4_file_00000000fcd081fa8582ee43f34c550f.png')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.35 }} />

      {/* Header — western wooden bar */}
      <header className="sticky top-0 z-30" style={{ ...woodFrame, borderBottomWidth: 1, fontFamily: FONT, borderRadius: 0, background: 'linear-gradient(to bottom, rgba(58,40,18,0.96), rgba(26,18,9,0.98))' }}>
        <div className="max-w-md mx-auto px-3 py-3 relative">
          {/* Full-width title frame, text centered */}
          <div className="w-full flex items-center justify-center gap-1.5 py-1.5 pl-12 pr-36" style={{ background: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/670fa1a3e_generated_image.png') center / cover, linear-gradient(to bottom, rgba(58,40,18,0.92), rgba(26,18,9,0.95))", border: '1px solid rgba(190,140,55,0.75)', boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.3), 0 2px 6px rgba(0,0,0,0.55)' }}>
            <DollarSign className="w-5 h-5 relative" style={{ color: '#f5c542' }} />
            <span className="text-sm font-black italic relative tracking-wide" style={{ color: '#f3e2b3', fontFamily: FONT, textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>Plinko Drop</span>
          </div>
          {/* Back — left edge */}
          <Link to="/" className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center" style={{ ...woodBtn, color: '#f3e2b3' }}>
            <ChevronLeft className="w-5 h-5" />
          </Link>
          {/* Wallet + add + share — right edge */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5" style={{ ...woodBtn }}>
              <Wallet className="w-4 h-4" style={{ color: '#f5c542' }} />
              <span className="text-xs font-bold tabular-nums" style={{ color: '#f3e2b3', fontFamily: FONT }}>${Number(balance).toFixed(2)}</span>
            </div>
            <Link to="/dashboard" className="w-8 h-8 flex items-center justify-center" style={{ ...goldBtn }}>
              <Plus className="w-4 h-4" />
            </Link>
            <button onClick={share} className="w-5 h-5 flex items-center justify-center bg-transparent border-0 shadow-none" style={{ color: '#f3e2b3' }}>
              {copied ? <Check className="w-[5px] h-[5px]" style={{ color: '#f5c542' }} /> : <Share2 className="w-[5px] h-[5px]" />}
            </button>
          </div>
        </div>
      </header>

      {/* Board area */}
      <main className="relative z-10 max-w-lg mx-auto w-full px-3 flex-1 flex flex-col">
        {/* Board — image with overlaid ball */}
        <div className="relative w-full" style={{ aspectRatio: '1 / 1.15' }}>
          <img src={BOARD_IMG} alt="Plinko Board" draggable={false} className="absolute inset-0 w-full h-full object-contain select-none" />

          {/* Peg hit glow — brief flash when the ball strikes a peg */}
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: r + 1 }).map((_, c) => {
              const isHit = hitPeg && hitPeg.row === r && hitPeg.col === c;
              if (!isHit) return null;
              return (
                <span
                  key={`p-${r}-${c}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{ ...pos(r, c), transform: 'translate(-50%,-50%)', width: 16, height: 16, background: 'radial-gradient(circle, rgba(213,63,140,0.55), transparent 70%)', animation: 'plinkoPegHit 0.26s ease-out' }}
                />
              );
            })
          )}

          {/* Ball on peg */}
          {ballPos && ballPos.kind === 'peg' && (
            <span
              className="absolute z-10 rounded-full"
              style={{ ...pos(ballPos.row, ballPos.col), transform: 'translate(-50%,-50%)', width: 11, height: 11, background: 'radial-gradient(circle at 35% 30%, #d6b3ff, #8b5cf6 55%, #5b21a6)', boxShadow: '0 1px 3px rgba(0,0,0,0.6), 0 0 10px rgba(139,92,246,0.85), inset 0 1px 0 rgba(214,179,255,0.4)', transition: 'left 0.2s ease-in, top 0.2s ease-in' }}
            />
          )}

          {/* Bucket win highlight */}
          {resultBucket !== null && (
            <div
              className="absolute z-20 pointer-events-none"
              style={{ ...bucketPos(resultBucket), transform: 'translate(-50%,-50%)', width: '7%', height: '6%', borderRadius: 4, boxShadow: '0 0 18px rgba(255,215,0,0.95), inset 0 0 12px rgba(255,235,120,0.5)', animation: 'plinkoPegHit 0.5s ease-out' }}
            />
          )}

          {/* Ball in bucket */}
          {ballPos && ballPos.kind === 'bucket' && (
            <span
              className="absolute z-20 rounded-full"
              style={{ ...bucketPos(ballPos.col), transform: 'translate(-50%,-50%)', width: 11, height: 11, background: 'radial-gradient(circle at 35% 30%, #d6b3ff, #8b5cf6 55%, #5b21a6)', boxShadow: '0 1px 3px rgba(0,0,0,0.6), 0 0 10px rgba(139,92,246,0.85), inset 0 1px 0 rgba(214,179,255,0.4)', transition: 'left 0.2s ease-in, top 0.2s ease-in' }}
            />
          )}
        </div>

        {/* Message — wooden plaque */}
        <div className="mt-4 mx-auto px-6 py-1.5 relative" style={{ background: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/bed350a7c_generated_image.png') center / cover, linear-gradient(to bottom, rgba(58,40,18,0.92), rgba(26,18,9,0.95))", border: '1px solid rgba(190,140,55,0.75)', boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.3), 0 2px 6px rgba(0,0,0,0.55)' }}>
          <span className="relative text-sm font-black italic" style={{ color: '#f5c542', fontFamily: FONT, textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>{message}</span>
        </div>

        {/* Bet row — wooden frame */}
        <div className="mt-3 p-2 flex items-center gap-2" style={{ ...woodFrame }}>
          <button onClick={() => setShowCustom(s => !s)} className={`w-10 h-10 flex items-center justify-center ${showCustom ? 'ring-2 ring-amber-300' : ''}`} style={{ ...woodBtn, color: customBet != null ? '#f5c542' : '#d9b97a' }} title="Custom bet">
            <Pencil className="w-4 h-4" />
          </button>
          <div className="flex-1 grid grid-cols-4 gap-2">
            {BETS.map((b, i) => (
              <button
                key={b}
                disabled={dropping}
                onClick={() => { setBetIdx(i); setCustomBet(null); }}
                className="flex items-center justify-center gap-0.5 py-2 text-xs font-bold italic transition-colors disabled:opacity-50"
                style={betIdx === i && customBet == null
                  ? { ...goldBtn, fontFamily: FONT }
                  : { ...woodBtn, color: '#d9b97a', fontFamily: FONT }
                }
              >
                ${b}
              </button>
            ))}
          </div>
          <button onClick={() => { setCustomBet(null); setBetIdx((i) => Math.max(0, i - 1)); }} className="w-10 h-10 flex items-center justify-center" style={{ ...woodBtn, color: '#d9b97a' }} title="Cycle bets">
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {showCustom && (
          <div className="mt-2 p-2 flex items-center gap-2" style={{ ...woodFrame }}>
            <DollarSign className="w-4 h-4" style={{ color: '#f5c542' }} />
            <input
              type="number"
              min="0"
              step="0.1"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') applyCustomBet(); }}
              placeholder="Custom bet amount"
              className="flex-1 px-2 py-1.5 rounded bg-black/40 border border-amber-700/40 text-amber-100 outline-none text-sm font-bold"
              style={{ fontFamily: FONT }}
            />
            <button onClick={applyCustomBet} className="px-3 py-1.5 rounded font-bold italic text-xs" style={{ ...goldBtn, fontFamily: FONT }}>
              Set
            </button>
          </div>
        )}

        {/* Drop button — gold western */}
        <button
          onClick={drop}
          disabled={dropping}
          className="mt-4 w-full py-4 text-base font-black italic transition-all disabled:opacity-60 flex items-center justify-center gap-2 relative overflow-hidden"
          style={{ background: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/584e9a6ed_generated_image.png') center / cover, linear-gradient(to bottom, #f5c542, #c8881e)", border: '1px solid rgba(245,210,120,0.9)', boxShadow: 'inset 0 1px 0 rgba(255,240,180,0.5), 0 3px 10px rgba(200,136,30,0.45)', color: '#2a1a06', fontFamily: FONT, textShadow: '0 1px 1px rgba(255,240,200,0.4)' }}
        >
          <DollarSign className="w-5 h-5 relative" /> <span className="relative" style={{ color: '#f5c542' }}>{dropping ? 'Dropping…' : `Drop · $${bet}`}</span>
        </button>

        {/* Stats — wooden tiles */}
        <div className="mt-3 grid grid-cols-3 gap-2 pb-6 text-center">
          <Stat label="Balance" value={`$${balance.toFixed(2)}`} />
          <Stat label="Bet" value={`$${bet.toFixed(2)}`} />
          <Stat label="Last Win" value={`$${lastWin.toFixed(2)}`} accent={lastWin > 0} />
        </div>
      </main>
    </div>
  );
}