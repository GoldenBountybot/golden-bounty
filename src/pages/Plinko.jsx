import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, ChevronLeft, DollarSign, Plus, Pencil, Wallet, History, X, Volume2, VolumeX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import GameAssetLoader from '@/components/GameAssetLoader';
import { PLINKO_ASSETS, GAME_BG } from '@/lib/gameAssets';
import { isMuted, useMute } from '@/lib/soundMute';
import { startPlinkoMusic, stopPlinkoMusic } from '@/lib/plinkoCasinoMusic';

const MULTS = [100, 50, 25, 10, 5, 2, 0.1, 2, 5, 10, 25, 50, 100];
const ROWS = MULTS.length - 1; // 12 rows: bottom row has 12 pegs between 13 slots
const BOARD_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/41d1489a2_file_000000005b9881faa2d49d948685f05d.png';
const DROP_BTN_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/a402172b3_file_000000002200820baadd0a1f2df2f8ce.png';
const BETS = [0.1, 1, 5, 10];
// Absolute per-bucket landing chance (percent), symmetric across both edges.
// 100x: 0.1% · 50x: 0.3% · 25x: 0.5% · 10x: 1% · 5x: 2% · 2x: 26% (split each side).
const WEIGHTS = [0.02, 0.06, 0.1, 0.2, 0.4, 13, 80, 13, 0.4, 0.2, 0.1, 0.06, 0.02];
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
  if (isMuted()) return;
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
  if (isMuted()) return;
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
  if (isMuted()) return;
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
  if (isMuted()) return;
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

const STAT_BANNER_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/0dfe151f2_file_0000000012f4820b97f8bd8f450c0d36.png';

function Stat({ label, value, accent }) {
  return (
    <div className="relative text-center" style={{ fontFamily: FONT }}>
      <img
        src={STAT_BANNER_IMG}
        alt={label}
        draggable={false}
        className="w-full h-auto select-none block"
        style={{ mixBlendMode: 'screen' }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingTop: '2px' }}>
        <p className="text-[9px] tracking-widest uppercase leading-none" style={{ color: '#f5c542', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>{label}</p>
        <p className="text-[11px] font-bold tabular-nums leading-tight mt-0.5" style={{ color: accent ? '#f5c542' : '#f3e2b3', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>{value}</p>
      </div>
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
  const [showHistory, setShowHistory] = useState(false);
  const [muted, toggleMute] = useMute();
  const timers = useRef([]);
  const musicStartedRef = useRef(false);

  // Sync background music with the mute toggle (only after first interaction).
  useEffect(() => {
    if (!musicStartedRef.current) return;
    if (muted) stopPlinkoMusic();
    else startPlinkoMusic();
  }, [muted]);
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

  useEffect(() => {
    let started = false;
    const begin = () => {
      if (started) return;
      started = true;
      startPlinkoMusic();
      musicStartedRef.current = true;
      window.removeEventListener('pointerdown', begin);
      window.removeEventListener('keydown', begin);
    };
    window.addEventListener('pointerdown', begin);
    window.addEventListener('keydown', begin);
    return () => {
      window.removeEventListener('pointerdown', begin);
      window.removeEventListener('keydown', begin);
      stopPlinkoMusic();
      timers.current.forEach(clearTimeout);
    };
  }, []);

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

    // Random, erratic descent — but the ball ALWAYS passes through the peg
    // directly above the target multiplier (row 10, col bucket-1) before
    // dropping into the bucket.
    const pegPath = [{ row: 0, col: 0 }];
    let col = 0;
    if (bucket === 0 || bucket === MULTS.length - 1) {
      // Edge bucket: ball must hug one side all the way down.
      const edge = bucket === 0 ? 0 : ROWS - 1;
      for (let r = 1; r < ROWS; r++) {
        col += col < edge ? 1 : 0;
        pegPath.push({ row: r, col });
      }
    } else {
      // Middle bucket: random shuffled path to the peg directly above the
      // bucket, then one final bounce to a peg adjacent to the bucket.
      const aboveCol = bucket - 1;
      const upperSteps = Array.from({ length: 10 }, (_, i) => (i < aboveCol ? 1 : 0));
      for (let i = upperSteps.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [upperSteps[i], upperSteps[j]] = [upperSteps[j], upperSteps[i]];
      }
      for (let r = 1; r <= 10; r++) {
        col += upperSteps[r - 1];
        pegPath.push({ row: r, col });
      }
      col += Math.random() < 0.5 ? 0 : 1;
      pegPath.push({ row: ROWS - 1, col });
    }
    const finalCol = bucket;

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

  // Peg positions matching the image's 12-row triangle (12%–78%).
  // Bottom row pegs sit BETWEEN the slots (offset by half a slot).
  const SPACING = 84 / 12; // horizontal spacing = same for pegs and slots
  const pos = (row, col) => {
    const rowFrac = row / (ROWS - 1);
    const top = 12 + rowFrac * 66;
    const left = row === 0 ? 50 : 50 + (col - row / 2) * SPACING;
    return { left: `${left}%`, top: `${top}%` };
  };

  // 13 multiplier slots at the base, evenly spaced from 8% to 92%.
  // Each slot sits in the gap between two pegs of the bottom row.
  const bucketPos = (b) => {
    const left = 8 + b * SPACING;
    const top = 85;
    return { left: `${left}%`, top: `${top}%` };
  };

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: 'radial-gradient(circle at 50% 0%, #1a0f2e 0%, #0a0a12 55%, #000 100%)', fontFamily: FONT }}>
      {!loaded && <GameAssetLoader title="Plinko Drop" assets={PLINKO_ASSETS} bgImage={GAME_BG.plinko} onDone={() => setLoaded(true)} />}
      <div className="fixed inset-0 pointer-events-none opacity-50" style={{ backgroundImage: 'radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 60%, #b9a, transparent), radial-gradient(1px 1px at 40% 80%, #fff, transparent), radial-gradient(1.5px 1.5px at 85% 20%, #c8e, transparent), radial-gradient(1px 1px at 10% 70%, #fff, transparent)', backgroundSize: '300px 300px' }} />
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/9908875c4_file_00000000fcd081fa8582ee43f34c550f.png')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.35 }} />

      {/* Header — western wooden bar */}
      <header className="sticky top-0 z-30" style={{ ...woodFrame, borderBottomWidth: 1, fontFamily: FONT, borderRadius: 0, background: 'linear-gradient(to bottom, rgba(58,40,18,0.96), rgba(26,18,9,0.98))' }}>
        <div className="max-w-md lg:max-w-2xl mx-auto px-3 py-2 relative">
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
            <button
              onClick={toggleMute}
              className="w-8 h-8 flex items-center justify-center transition-transform active:scale-90"
              style={{ ...woodBtn, color: '#f3e2b3' }}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Board area */}
      <main className="relative z-10 max-w-2xl mx-auto w-full px-3 flex-1 flex flex-col">
        {/* Board — image with overlaid ball, enlarged beyond viewport width */}
        <div className="relative overflow-hidden" style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
          <div className="relative" style={{ width: '140%', marginLeft: '-20%' }}>
          <img src={BOARD_IMG} alt="Plinko Board" draggable={false} className="w-full h-auto block select-none" />

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

          {/* Ball in bucket */}
          {ballPos && ballPos.kind === 'bucket' && (
            <span
              className="absolute z-20 rounded-full"
              style={{ ...bucketPos(ballPos.col), transform: 'translate(-50%,-50%)', width: 11, height: 11, background: 'radial-gradient(circle at 35% 30%, #d6b3ff, #8b5cf6 55%, #5b21a6)', boxShadow: '0 1px 3px rgba(0,0,0,0.6), 0 0 10px rgba(139,92,246,0.85), inset 0 1px 0 rgba(214,179,255,0.4)', transition: 'left 0.2s ease-in, top 0.2s ease-in' }}
            />
          )}
          </div>
        </div>

        {/* Message — ornate wooden banner (black bg removed via screen blend) */}
        <div className="mx-auto relative" style={{ width: '66.67%', marginTop: '-92px' }}>
          <img src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/08830b540_file_00000000e134820babf1565cf66cbd5b.png" alt="message" draggable={false} className="w-full h-auto select-none block" style={{ mixBlendMode: 'screen' }} />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: 'translateY(-7px)' }}>
            <span className="text-sm font-black italic" style={{ color: '#f5c542', fontFamily: FONT, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>{message}</span>
          </div>
        </div>

        {/* Bet row — wooden frame */}
        <div className="p-2 flex items-center gap-2 relative z-20" style={{ ...woodFrame, marginTop: '-74px' }}>
          <button
            onClick={() => setShowCustom(s => !s)}
            className="w-10 h-10 flex items-center justify-center rounded-lg transition-all hover:brightness-125 active:scale-90"
            style={{
              ...woodBtn,
              color: customBet != null ? '#f5c542' : '#d9b97a',
              boxShadow: showCustom
                ? 'inset 0 1px 0 rgba(255,210,120,0.25), 0 0 0 2px rgba(245,197,66,0.6), 0 1px 3px rgba(0,0,0,0.5)'
                : 'inset 0 1px 0 rgba(255,210,120,0.25), 0 1px 3px rgba(0,0,0,0.5)',
            }}
            title="Custom bet"
          >
            <Pencil className="w-4 h-4" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }} />
          </button>
          <div className="flex-1 grid grid-cols-4 gap-2">
            {BETS.map((b, i) => (
              <button
                key={b}
                disabled={dropping}
                onClick={() => { setBetIdx(i); setCustomBet(null); }}
                className="flex items-center justify-center gap-0.5 py-2 rounded-lg text-xs font-bold italic transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                style={betIdx === i && customBet == null
                  ? { ...goldBtn, fontFamily: FONT, boxShadow: 'inset 0 1px 0 rgba(255,240,180,0.5), 0 0 8px rgba(245,197,66,0.4), 0 2px 6px rgba(200,136,30,0.45)' }
                  : { ...woodBtn, color: '#d9b97a', fontFamily: FONT }
                }
              >
                ${b}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setCustomBet(null); setBetIdx((i) => Math.max(0, i - 1)); }}
            className="w-10 h-10 flex items-center justify-center rounded-lg transition-all hover:brightness-125 active:scale-90"
            style={{ ...woodBtn, color: '#d9b97a' }}
            title="Cycle bets"
          >
            <RotateCw className="w-4 h-4" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }} />
          </button>
        </div>

        {showCustom && (
          <div className="mt-2 p-2.5 flex items-center gap-2.5 relative z-20 rounded-lg" style={{ ...woodFrame }}>
            <div className="w-7 h-7 flex items-center justify-center rounded-md flex-shrink-0" style={{ background: 'rgba(245,197,66,0.12)', border: '1px solid rgba(245,197,66,0.3)' }}>
              <DollarSign className="w-4 h-4" style={{ color: '#f5c542', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }} />
            </div>
            <input
              type="number"
              min="0"
              step="0.1"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') applyCustomBet(); }}
              placeholder="Custom bet amount"
              className="flex-1 px-3 py-2 rounded-md bg-black/50 border border-amber-700/40 text-amber-100 outline-none text-sm font-bold transition-colors focus:border-amber-500/70"
              style={{ fontFamily: FONT }}
            />
            <button
              onClick={applyCustomBet}
              className="px-4 py-2 rounded-md font-bold italic text-xs transition-all hover:brightness-110 active:scale-95 flex-shrink-0"
              style={{ ...goldBtn, fontFamily: FONT, boxShadow: 'inset 0 1px 0 rgba(255,240,180,0.5), 0 0 8px rgba(245,197,66,0.35), 0 2px 6px rgba(200,136,30,0.45)' }}
            >
              Set
            </button>
          </div>
        )}

        {/* Drop button — ornate gold/green crest asset (black bg removed via screen blend) */}
        <button
          onClick={drop}
          disabled={dropping}
          className="transition-all disabled:opacity-60 relative mx-auto"
          style={{ width: '66.67%', marginTop: '-30px' }}
        >
          <img
            src={DROP_BTN_IMG}
            alt="Drop"
            draggable={false}
            className="w-full h-auto select-none"
            style={{
              mixBlendMode: 'screen',
            }}
          />
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none font-black italic" style={{ color: '#f5c542', fontFamily: FONT, textShadow: '0 1px 3px rgba(0,0,0,0.8)', transform: 'translateY(-11px)' }}>
            {dropping ? 'Dropping…' : `Drop · $${bet}`}
          </span>
        </button>

        {/* Stats — wooden tiles */}
        <div className="grid grid-cols-3 gap-2 text-center" style={{ marginTop: '-70px' }}>
          <Stat label="Balance" value={`$${balance.toFixed(2)}`} />
          <Stat label="Bet" value={`$${bet.toFixed(2)}`} />
          <Stat label="Last Win" value={`$${lastWin.toFixed(2)}`} accent={lastWin > 0} />
        </div>

        {/* History button — ornate banner asset (black bg removed via screen blend) */}
        <div className="flex justify-center pb-4" style={{ marginTop: '-30px' }}>
          <button
            onClick={() => setShowHistory(true)}
            className="relative transition-transform active:scale-95"
            style={{ width: '50%' }}
          >
            <img
              src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/50a48430e_file_000000002fc08211917ff24d7e23cfbc.png"
              alt="History"
              draggable={false}
              className="w-full h-auto select-none block"
              style={{ mixBlendMode: 'screen' }}
            />
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none font-black italic" style={{ color: '#ffe8a0', fontFamily: FONT, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
              History
            </span>
          </button>
        </div>
      </main>

      {showHistory && <PlinkoHistoryModal onClose={() => setShowHistory(false)} />}
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '';
  try {
    const dt = new Date(d);
    return dt.toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return String(d); }
}

function PlinkoHistoryModal({ onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await base44.entities.PlayerActivity.filter({ game_id: 'plinko' }, '-created_date', 60);
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
        style={{ border: '1px solid rgba(190,140,55,0.5)', background: 'linear-gradient(to bottom, #1a0f2e, #0a0a12)', fontFamily: FONT }}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(190,140,55,0.22)' }}>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" style={{ color: '#f5c542' }} />
            <h3 className="text-sm font-black italic" style={{ color: '#f3e2b3' }}>Plinko History</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ border: '1px solid rgba(190,140,55,0.45)', background: 'rgba(20,17,13,0.6)', color: '#f3e2b3' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 px-4 py-3 text-center" style={{ borderBottom: '1px solid rgba(190,140,55,0.22)' }}>
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
            <div className="text-sm font-black tabular-nums" style={{ color: net >= 0 ? '#7ee787' : '#ff6b6b' }}>{net >= 0 ? '+' : ''}{net.toFixed(2)}</div>
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 rounded-full animate-spin" style={{ border: '2px solid rgba(190,140,55,0.3)', borderTopColor: '#f5c542' }} />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm italic" style={{ color: '#6a6258' }}>No history yet</div>
          ) : (
            rows.map((r) => {
              const profit = (r.win || 0) - (r.bet || 0);
              return (
                <div key={r.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-4 py-2 text-xs" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex flex-col">
                    <span className="font-bold" style={{ color: '#f3e2b3' }}>Plinko</span>
                    <span className="text-[10px]" style={{ color: '#6a6258' }}>{fmtDate(r.created_date)}</span>
                  </div>
                  <span className="text-right tabular-nums" style={{ color: '#a09080' }}>{(r.bet || 0).toFixed(2)}</span>
                  <span className="text-right font-bold tabular-nums" style={{ color: profit >= 0 ? '#7ee787' : '#ff6b6b' }}>
                    {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2 text-[9px] font-bold tracking-wider" style={{ borderTop: '1px solid rgba(190,140,55,0.22)', color: '#6a6258' }}>
          <span>GAME</span>
          <span className="text-right">BET</span>
          <span className="text-right">NET</span>
        </div>
      </div>
    </div>
  );
}