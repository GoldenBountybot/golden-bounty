import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useToast } from '@/components/ui/use-toast';

// 18 prize segments — matching the reference wheel (NOT 19 or 20).
const SEGMENTS = [
  { label: '0.05$', value: 0.05, color: '#4B0082' }, // purple
  { label: '0.10$', value: 0.10, color: '#228B22' }, // green
  { label: '0.25$', value: 0.25, color: '#1C3A5E' }, // blue
  { label: '0.50$', value: 0.50, color: '#8B1A1A' }, // dark red
  { label: '0.75$', value: 0.75, color: '#8B4513' }, // brown
  { label: '1$',    value: 1,    color: '#1B5E20' }, // dark green
  { label: '2.5$',  value: 2.5,  color: '#4B0082' }, // purple
  { label: '5$',    value: 5,    color: '#C62828' }, // red
  { label: '10$',   value: 10,   color: '#8B4513' }, // brown
  { label: '25$',   value: 25,   color: '#228B22' }, // green
  { label: '50$',   value: 50,   color: '#1C3A5E' }, // blue
  { label: '100$',  value: 100,  color: '#8B1A1A' }, // dark red
  { label: '150$',  value: 150,  color: '#1B5E20' }, // dark green
  { label: '200$',  value: 200,  color: '#0D47A1' }, // deep blue
  { label: '250$',  value: 250,  color: '#228B22' }, // green
  { label: '500$',  value: 500,  color: '#D4AF37' }, // gold
  { label: '750$',  value: 750,  color: '#4B0082' }, // purple
  { label: '1000$', value: 1000, color: '#C62828' }, // red
];

// Prize weights — small prizes common, jackpot rare.
const WEIGHTS = [12, 12, 10, 9, 8, 7, 5, 4, 3, 2.5, 2, 1.5, 1, 0.8, 0.6, 0.3, 0.15, 0.05];

const N = SEGMENTS.length;
const SEG_DEG = 360 / N;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const LS_KEY = (uid) => `daily_spin_last_${uid || 'anon'}`;

function pickWeightedIndex() {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < N; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return i;
  }
  return 0;
}

// Polar → cartesian for SVG arcs.
function polar(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx, cy, rOuter, rInner, startDeg, endDeg) {
  const p1 = polar(cx, cy, rOuter, endDeg);
  const p2 = polar(cx, cy, rOuter, startDeg);
  const p3 = polar(cx, cy, rInner, startDeg);
  const p4 = polar(cx, cy, rInner, endDeg);
  const large = endDeg - startDeg <= 180 ? 0 : 1;
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${large} 1 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}

function fmtCountdown(ms) {
  if (ms <= 0) return 'Ready!';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function DailySpinWheel() {
  const { setBalance } = useCasinoBalance();
  const { toast } = useToast();
  const [userId, setUserId] = useState(null);
  const [authed, setAuthed] = useState(false);
  const [lastSpin, setLastSpin] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState(null);
  const wheelRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    base44.auth.isAuthenticated().then((ok) => {
      if (!mounted) return;
      setAuthed(ok);
      if (ok) {
        base44.auth.me().then((me) => {
          if (!mounted) return;
          setUserId(me?.id ?? null);
          try {
            const v = parseInt(localStorage.getItem(LS_KEY(me?.id)), 10);
            if (isFinite(v)) setLastSpin(v);
          } catch {}
        }).catch(() => {});
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // countdown ticker
  useEffect(() => {
    if (!lastSpin) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [lastSpin]);

  const elapsed = now - lastSpin;
  const ready = !lastSpin || elapsed >= COOLDOWN_MS;
  const remaining = Math.max(0, COOLDOWN_MS - elapsed);

  const cx = 200, cy = 200, rOuter = 188, rInner = 62;

  const spin = async () => {
    if (spinning || !ready) return;
    if (!authed) return;
    setSpinning(true);
    setWon(null);

    const winIdx = pickWeightedIndex();
    // segment i center angle (clockwise from top) = i*SEG_DEG + SEG_DEG/2
    const center = winIdx * SEG_DEG + SEG_DEG / 2;
    // bring that center to the top (0°): rotate wheel by (360 - center)
    const fullSpins = 6 + Math.floor(Math.random() * 3);
    const jitter = (Math.random() - 0.5) * (SEG_DEG * 0.5); // land near center, not exactly
    const target = rotation + fullSpins * 360 + ((360 - center) - (rotation % 360)) + jitter;
    setRotation(target);

    // wait for the CSS transition to finish
    setTimeout(async () => {
      const prize = SEGMENTS[winIdx].value;
      setBalance((b) => b + prize);
      setLastSpin(Date.now());
      try { localStorage.setItem(LS_KEY(userId), String(Date.now())); } catch {}
      setWon({ idx: winIdx, value: prize });
      setSpinning(false);
      // log as a completed bonus transaction
      try {
        const me = await base44.auth.me();
        await base44.entities.Transaction.create({
          user_id: me?.id || userId,
          user_email: me?.email || '',
          type: 'bonus',
          amount: prize,
          status: 'completed',
          method: 'daily_spin',
          note: 'Daily Free Spin reward',
        });
      } catch {}
      toast({ title: `You won $${prize.toFixed(2)}! 🎉` });
    }, 5200);
  };

  // LED bulb ring positions
  const bulbs = useMemo(() => {
    const arr = [];
    const count = 36;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * 360;
      const p = polar(cx, cy, rOuter + 8, ang);
      arr.push({ x: p.x, y: p.y, i });
    }
    return arr;
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 mt-6">
      <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(160deg, #1a1208, #0b0b0d 70%)', border: '1px solid rgba(214,178,98,0.25)', boxShadow: '0 0 30px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full" style={{ background: 'radial-gradient(circle, #f5c542, #8B6914)', boxShadow: '0 0 10px rgba(245,197,66,0.6)' }}>
              <Crown className="w-4 h-4" style={{ color: '#3a1a06' }} />
            </span>
            <h2 className="text-base font-black italic tracking-wide" style={{ fontFamily: 'Georgia, serif', color: '#f5c542', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>
              Daily Free Spin
            </h2>
          </div>
          <span className="text-[10px] italic" style={{ fontFamily: 'Georgia, serif', color: 'rgba(245,197,66,0.6)' }}>
            Once every 24 hours
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative" style={{ width: 'min(86vw, 420px)', aspectRatio: '1 / 1' }}>
            <svg viewBox="0 0 400 400" className="w-full h-full" style={{ filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.7))' }}>
              <defs>
                <radialGradient id="goldFrame" cx="50%" cy="40%" r="70%">
                  <stop offset="0%" stopColor="#FFE9A8" />
                  <stop offset="45%" stopColor="#D4AF37" />
                  <stop offset="75%" stopColor="#8B6914" />
                  <stop offset="100%" stopColor="#5b3a06" />
                </radialGradient>
                <linearGradient id="hubGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6b4423" />
                  <stop offset="100%" stopColor="#2a1808" />
                </linearGradient>
                <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(255,210,120,0.5)" />
                  <stop offset="100%" stopColor="rgba(255,210,120,0)" />
                </radialGradient>
              </defs>

              {/* Outer ornate gold frame */}
              <circle cx={cx} cy={cy} r={rOuter + 16} fill="url(#goldFrame)" />
              <circle cx={cx} cy={cy} r={rOuter + 12} fill="none" stroke="#5b3a06" strokeWidth="1.5" />
              <circle cx={cx} cy={cy} r={rOuter + 4} fill="none" stroke="rgba(255,240,180,0.5)" strokeWidth="1" />

              {/* Scrollwork accents at top & base of frame */}
              <g fill="#FFE9A8" opacity="0.9">
                <circle cx={cx} cy={rOuter + 4} r="9" fill="url(#goldFrame)" />
                <circle cx={cx} cy={cy + rOuter + 4} r="9" fill="url(#goldFrame)" />
                <circle cx={cx - rOuter - 4} cy={cy} r="7" fill="url(#goldFrame)" />
                <circle cx={cx + rOuter + 4} cy={cy} r="7" fill="url(#goldFrame)" />
              </g>

              {/* Filigree feet */}
              <g fill="url(#goldFrame)" opacity="0.85">
                <path d={`M ${cx-46} ${cy + rOuter + 22} q 22 24 46 0 q 8 -10 0 -16 q -23 14 -46 0 q -8 6 0 16 Z`} />
              </g>

              {/* LED bulb ring */}
              {bulbs.map((b) => (
                <circle
                  key={b.i}
                  cx={b.x} cy={b.y} r="3.2"
                  fill="#FFFACD"
                  style={{ animation: `lwLedPulse 1.6s ease-in-out ${((b.i % 6) * 0.18).toFixed(2)}s infinite`, transformOrigin: `${b.x}px ${b.y}px` }}
                />
              ))}

              {/* Rotating wheel group */}
              <g ref={wheelRef} style={{ transformOrigin: '200px 200px', transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 5s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none' }}>
                {/* Segments */}
                {SEGMENTS.map((seg, i) => {
                  const start = i * SEG_DEG;
                  const end = (i + 1) * SEG_DEG;
                  const mid = start + SEG_DEG / 2;
                  const lp = polar(cx, cy, rOuter - 14, mid);
                  return (
                    <g key={i}>
                      <path d={arcPath(cx, cy, rOuter, rInner, start, end)} fill={seg.color} stroke="rgba(0,0,0,0.45)" strokeWidth="1" />
                      {/* subtle inner sheen */}
                      <path d={arcPath(cx, cy, rOuter, rOuter - 26, start, end)} fill="rgba(255,255,255,0.06)" />
                      <path d={arcPath(cx, cy, rInner + 26, rInner, start, end)} fill="rgba(0,0,0,0.18)" />
                      {/* value label, gold serif, rotated along segment */}
                      <text
                        x={lp.x} y={lp.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${mid} ${lp.x} ${lp.y})`}
                        fill="#FFD700"
                        style={{ fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: i < 6 ? 13 : (i < 11 ? 14 : 16), filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.9))' }}
                      >
                        {seg.label}
                      </text>
                    </g>
                  );
                })}
                {/* Inner gold ring */}
                <circle cx={cx} cy={cy} r={rInner} fill="url(#hubGrad)" stroke="#D4AF37" strokeWidth="3" />
                <circle cx={cx} cy={cy} r={rInner - 6} fill="none" stroke="rgba(255,240,180,0.35)" strokeWidth="1" />
                <circle cx={cx} cy={cy} r={rInner + 6} fill="none" stroke="#5b3a06" strokeWidth="1.5" />
              </g>

              {/* Center hub (fixed) */}
              <circle cx={cx} cy={cy} r={rInner - 2} fill="url(#centerGlow)" />
              <g>
                <g transform={`translate(${cx} ${cy - 24})`}>
                  <CrownIcon />
                </g>
                <text x={cx} y={cy + 4} textAnchor="middle" fill="#FFD700" style={{ fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 19, letterSpacing: '1px', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.8))' }}>SPIN</text>
                <text x={cx} y={cy + 22} textAnchor="middle" fill="#E5C161" style={{ fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: 11, letterSpacing: '2px' }}>TO WIN</text>
              </g>

              {/* Fixed downward gold pointer at top */}
              <g>
                <path d={`M ${cx} ${cy - rOuter - 2} L ${cx - 13} ${cy - rOuter - 30} L ${cx + 13} ${cy - rOuter - 30} Z`} fill="url(#goldFrame)" stroke="#5b3a06" strokeWidth="1.5" />
                <circle cx={cx} cy={cy - rOuter - 30} r="6" fill="url(#goldFrame)" stroke="#5b3a06" strokeWidth="1" />
              </g>
            </svg>
          </div>

          {/* Status + button */}
          <div className="mt-4 w-full max-w-xs flex flex-col items-center gap-2">
            {!authed ? (
              <Link to="/login" className="w-full py-3 rounded-xl text-center text-sm font-black italic"
                style={{ background: 'linear-gradient(to bottom, #f5c542, #c8881e)', color: '#2a1a06', border: '1px solid #8B6914', boxShadow: '0 0 14px rgba(245,197,66,0.5)' }}>
                Login to Spin Free
              </Link>
            ) : ready ? (
              <button
                onClick={spin}
                disabled={spinning}
                className="w-full py-3 rounded-xl text-sm font-black italic disabled:opacity-60 active:scale-95 transition-transform"
                style={{ background: 'linear-gradient(to bottom, #f5c542, #c8881e)', color: '#2a1a06', border: '1px solid #8B6914', boxShadow: '0 0 14px rgba(245,197,66,0.6), inset 0 1px 0 rgba(255,255,255,0.5)' }}
              >
                {spinning ? 'Spinning…' : 'SPIN NOW'}
              </button>
            ) : (
              <div className="w-full py-3 rounded-xl text-center flex items-center justify-center gap-2"
                style={{ background: 'rgba(20,17,13,0.7)', border: '1px solid rgba(214,178,98,0.4)' }}>
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-black tabular-nums" style={{ fontFamily: 'Georgia, serif', color: '#e8c878' }}>
                  Next spin in {fmtCountdown(remaining)}
                </span>
              </div>
            )}
            {won && !spinning && (
              <p className="text-sm font-black italic animate-pulse" style={{ fontFamily: 'Georgia, serif', color: '#fde68a' }}>
                🎉 You won ${won.value.toFixed(2)}! Come back tomorrow.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Inline ornate crown for the hub.
function CrownIcon() {
  return (
    <svg width="40" height="26" viewBox="0 0 40 26" fill="none">
      <path d="M4 20 L7 8 L14 14 L20 4 L26 14 L33 8 L36 20 Z" fill="#FFD700" stroke="#8B6914" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="4" y="20" width="32" height="4" rx="1" fill="#E5C161" stroke="#8B6914" strokeWidth="1" />
      <circle cx="7" cy="8" r="2.4" fill="#FFD700" stroke="#8B6914" strokeWidth="0.8" />
      <circle cx="20" cy="4" r="2.6" fill="#FFD700" stroke="#8B6914" strokeWidth="0.8" />
      <circle cx="33" cy="8" r="2.4" fill="#FFD700" stroke="#8B6914" strokeWidth="0.8" />
      <circle cx="12" cy="22" r="1.4" fill="#8B1A1A" />
      <circle cx="20" cy="22" r="1.4" fill="#1C3A5E" />
      <circle cx="28" cy="22" r="1.4" fill="#228B22" />
    </svg>
  );
}