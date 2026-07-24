import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useToast } from '@/components/ui/use-toast';

// 18 prize segments — exact match to the reference wheel (top = 1000$ gold, then clockwise).
const SEGMENTS = [
  { label: '1000$', value: 1000, color: '#D4AF37' },
  { label: '0.05$', value: 0.05, color: '#00008B' },
  { label: '0.10$', value: 0.10, color: '#800080' },
  { label: '0.25$', value: 0.25, color: '#006400' },
  { label: '0.50$', value: 0.50, color: '#00008B' },
  { label: '0.75$', value: 0.75, color: '#800080' },
  { label: '1$',    value: 1,    color: '#8B0000' },
  { label: '2.5$',  value: 2.5,  color: '#006400' },
  { label: '5$',    value: 5,    color: '#00008B' },
  { label: '10$',   value: 10,   color: '#D4AF37' },
  { label: '25$',   value: 25,   color: '#8B0000' },
  { label: '50$',   value: 50,   color: '#800080' },
  { label: '100$',  value: 100,  color: '#006400' },
  { label: '150$',  value: 150,  color: '#00008B' },
  { label: '200$',  value: 200,  color: '#D4AF37' },
  { label: '250$',  value: 250,  color: '#8B0000' },
  { label: '500$',  value: 500,  color: '#800080' },
  { label: '750$',  value: 750,  color: '#006400' },
];

const WEIGHTS = [12, 12, 10, 9, 8, 7, 5, 4, 3, 2.5, 2, 1.5, 1, 0.8, 0.6, 0.3, 0.15, 0.05];

const N = SEGMENTS.length;
const SEG_DEG = 360 / N;
const COOLDOWN_MS = 0; // testing — no cooldown
const LS_KEY = (uid) => `daily_spin_last_${uid || 'anon'}`;

const R_OUT = 90;   // outer segment radius
const R_IN = 54;    // inner segment radius (hub edge)
const R_LABEL = 72; // label radius
const CX = 100, CY = 100;

function pickWeightedIndex() {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < N; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return i;
  }
  return 0;
}

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

  useEffect(() => {
    if (!lastSpin) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [lastSpin]);

  const elapsed = now - lastSpin;
  const ready = !lastSpin || elapsed >= COOLDOWN_MS;
  const remaining = Math.max(0, COOLDOWN_MS - elapsed);

  const spin = async () => {
    if (spinning || !ready) return;
    if (!authed) return;
    setSpinning(true);
    setWon(null);

    const winIdx = pickWeightedIndex();
    const center = winIdx * SEG_DEG + SEG_DEG / 2;
    const fullSpins = 6 + Math.floor(Math.random() * 3);
    const jitter = (Math.random() - 0.5) * (SEG_DEG * 0.45);
    const target = rotation + fullSpins * 360 + ((360 - center) - (rotation % 360)) + jitter;
    setRotation(target);

    setTimeout(async () => {
      const prize = SEGMENTS[winIdx].value;
      setBalance((b) => b + prize);
      setLastSpin(Date.now());
      try { localStorage.setItem(LS_KEY(userId), String(Date.now())); } catch {}
      setWon({ idx: winIdx, value: prize });
      setSpinning(false);
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
    }, 5400);
  };

  const stopped = won && !spinning;

  return (
    <section className="max-w-6xl mx-auto px-4 mt-6">
      <div className="relative overflow-hidden rounded-2xl p-4" style={{ background: 'radial-gradient(circle at 50% 30%, #241a08 0%, #0b0b0d 70%)', border: '1px solid rgba(214,178,98,0.25)', boxShadow: '0 0 30px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.4)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 18% 20%, rgba(212,175,55,0.18), transparent 12%), radial-gradient(circle at 82% 25%, rgba(212,175,55,0.14), transparent 10%), radial-gradient(circle at 25% 80%, rgba(212,175,55,0.12), transparent 14%), radial-gradient(circle at 75% 78%, rgba(212,175,55,0.10), transparent 12%)' }} />
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
          <div className="relative" style={{ width: 'min(90vw, 440px)', aspectRatio: '1 / 1' }}>
            <svg viewBox="0 0 200 200" className="w-full h-full select-none" style={{ filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.75))' }}>
              <defs>
                <radialGradient id="dswHub" cx="50%" cy="42%" r="60%">
                  <stop offset="0%" stopColor="#ffe9a8" />
                  <stop offset="55%" stopColor="#f5c542" />
                  <stop offset="100%" stopColor="#8B6914" />
                </radialGradient>
                <linearGradient id="dswGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffe9a8" />
                  <stop offset="50%" stopColor="#f5c542" />
                  <stop offset="100%" stopColor="#8B6914" />
                </linearGradient>
                <radialGradient id="dswVeil" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#000" stopOpacity="0" />
                  <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
                </radialGradient>
              </defs>

              {/* outer ornate frame */}
              <circle cx={CX} cy={CY} r="98" fill="none" stroke="url(#dswGold)" strokeWidth="5" />
              <circle cx={CX} cy={CY} r="93" fill="#0b0b0d" stroke="#5a3e12" strokeWidth="0.8" />
              {/* jewel dots around the frame */}
              {SEGMENTS.map((_, i) => {
                const a = (i * SEG_DEG - 90) * Math.PI / 180;
                const x = CX + 95.5 * Math.cos(a);
                const y = CY + 95.5 * Math.sin(a);
                return <circle key={`j${i}`} cx={x} cy={y} r="1.3" fill="#ffe9a8" opacity="0.85" />;
              })}

              {/* rotating segments + labels */}
              <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '100px 100px', transition: 'transform 5.2s cubic-bezier(0.17,0.67,0.12,0.99)', opacity: stopped ? 0.28 : 1 }}>
                {SEGMENTS.map((seg, i) => {
                  const start = i * SEG_DEG;
                  const end = (i + 1) * SEG_DEG;
                  const mid = i * SEG_DEG + SEG_DEG / 2;
                  const lp = polar(CX, CY, R_LABEL, mid);
                  return (
                    <g key={`s${i}`}>
                      <path d={arcPath(CX, CY, R_OUT, R_IN, start, end)} fill={seg.color} stroke="#1a1208" strokeWidth="0.6" />
                      <text x={lp.x} y={lp.y} fill="#fff" fontSize={seg.label.length > 4 ? '6.2' : '7'} fontFamily="Georgia, serif" fontWeight="800" fontStyle="italic" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${mid} ${lp.x} ${lp.y})`} style={{ textShadow: '0 1px 1px rgba(0,0,0,0.7)' }}>
                        {seg.label}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* winning highlight at top — only the selected segment stays bright */}
              {stopped && (
                <g style={{ filter: 'drop-shadow(0 0 5px rgba(255,233,168,0.95))' }}>
                  <path d={arcPath(CX, CY, R_OUT, R_IN, -SEG_DEG / 2, SEG_DEG / 2)} fill={SEGMENTS[won.idx].color} stroke="#ffe9a8" strokeWidth="1.4" />
                  {(() => {
                    const lp = polar(CX, CY, R_LABEL, 0);
                    return (
                      <text x={lp.x} y={lp.y} fill="#fff" fontSize="7" fontFamily="Georgia, serif" fontWeight="800" fontStyle="italic" textAnchor="middle" dominantBaseline="middle" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.7)' }}>
                        {SEGMENTS[won.idx].label}
                      </text>
                    );
                  })()}
                </g>
              )}

              {/* hub */}
              <circle cx={CX} cy={CY} r={R_IN} fill="url(#dswHub)" stroke="#8B6914" strokeWidth="2" />
              <circle cx={CX} cy={CY} r={R_IN - 4} fill="none" stroke="rgba(58,26,6,0.5)" strokeWidth="0.8" />
              {/* crown in hub */}
              <g transform={`translate(${CX - 11} ${CY - 7})`}>
                <path d="M2 12 L4 3 L9 8 L11 1 L13 8 L18 3 L20 12 Z" fill="#ffd700" stroke="#8B6914" strokeWidth="0.6" strokeLinejoin="round" />
                <rect x="2" y="12" width="18" height="2.4" rx="0.6" fill="#e5c161" stroke="#8B6914" strokeWidth="0.5" />
              </g>

              {/* pointer at top */}
              <polygon points="100,4 92,22 108,22" fill="url(#dswGold)" stroke="#8B6914" strokeWidth="0.8" />
              <circle cx="100" cy="4" r="2.2" fill="#ffe9a8" stroke="#8B6914" strokeWidth="0.5" />
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
            {stopped && (
              <p className="text-base font-black italic animate-pulse" style={{ fontFamily: 'Georgia, serif', color: '#fde68a' }}>
                🎉 You won ${won.value.toFixed(2)}!
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}