import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useToast } from '@/components/ui/use-toast';

// 18 prize segments — exact match to the reference wheel.
// Top (under pointer) = 1000$ gold, then clockwise per the image.
const SEGMENTS = [
  { label: '1000$', value: 1000, color: '#D4AF37' }, // gold (top)
  { label: '0.05$', value: 0.05, color: '#00008B' }, // dark blue
  { label: '0.10$', value: 0.10, color: '#800080' }, // purple
  { label: '0.25$', value: 0.25, color: '#006400' }, // green
  { label: '0.50$', value: 0.50, color: '#00008B' }, // dark blue
  { label: '0.75$', value: 0.75, color: '#800080' }, // purple
  { label: '1$',    value: 1,    color: '#8B0000' }, // dark red
  { label: '2.5$',  value: 2.5,  color: '#006400' }, // green
  { label: '5$',    value: 5,    color: '#00008B' }, // dark blue
  { label: '10$',   value: 10,   color: '#D4AF37' }, // gold
  { label: '25$',   value: 25,   color: '#8B0000' }, // dark red
  { label: '50$',   value: 50,   color: '#800080' }, // purple
  { label: '100$',  value: 100,  color: '#006400' }, // green
  { label: '150$',  value: 150,  color: '#00008B' }, // dark blue
  { label: '200$',  value: 200,  color: '#D4AF37' }, // gold
  { label: '250$',  value: 250,  color: '#8B0000' }, // dark red
  { label: '500$',  value: 500,  color: '#800080' }, // purple
  { label: '750$',  value: 750,  color: '#006400' }, // green
];

// Prize weights — small prizes common, jackpot rare.
const WEIGHTS = [12, 12, 10, 9, 8, 7, 5, 4, 3, 2.5, 2, 1.5, 1, 0.8, 0.6, 0.3, 0.15, 0.05];

const REF_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/12d6027dc_file_0000000083348206ae1cbb95601fc9c3.png';
// Mask radii (as % of closest-side = half the element width).
// HUB_PCT = inner hub circle radius; SEG_PCT = outer segment-ring radius.
const HUB_PCT = 19;
const SEG_PCT = 86;

const N = SEGMENTS.length;
const SEG_DEG = 360 / N;
const COOLDOWN_MS = 0; // testing — no cooldown
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
    }, 5400);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 mt-6">
      <div className="relative overflow-hidden rounded-2xl p-4" style={{ background: 'radial-gradient(circle at 50% 30%, #241a08 0%, #0b0b0d 70%)', border: '1px solid rgba(214,178,98,0.25)', boxShadow: '0 0 30px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.4)' }}>
        {/* dark bokeh golden lights */}
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
            {/* Layer A — fixed full reference image: ornate frame, base, pointer, hub.
                This is the 100%-faithful backdrop; nothing here moves. */}
            <img
              src={REF_IMG}
              alt="Daily Spin Wheel"
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain select-none"
              style={{ filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.75))' }}
            />
            {/* Layer B — the SAME image, masked to the segment ring only (hub +
                outer frame are masked out), and rotated. At rest it aligns
                pixel-perfect with Layer A; when spinning only the segments turn
                while the frame, base, pointer and hub stay still. */}
            <img
              src={REF_IMG}
              alt=""
              draggable={false}
              aria-hidden
              className="absolute inset-0 w-full h-full object-contain select-none"
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center',
                transition: 'transform 5.2s cubic-bezier(0.17,0.67,0.12,0.99)',
                WebkitMaskImage: `radial-gradient(circle closest-side, transparent 0% ${HUB_PCT}%, #000 ${HUB_PCT + 0.5}% ${SEG_PCT}%, transparent ${SEG_PCT + 0.5}%)`,
                maskImage: `radial-gradient(circle closest-side, transparent 0% ${HUB_PCT}%, #000 ${HUB_PCT + 0.5}% ${SEG_PCT}%, transparent ${SEG_PCT + 0.5}%)`,
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
              }}
            />

            {/* Result reveal — only the selected prize is shown, at the top */}
            {won && !spinning && (
              <div className="absolute inset-0 z-20 flex items-start justify-center" style={{ pointerEvents: 'none', paddingTop: '5%' }}>
                <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 16%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.62) 62%)' }} />
                <div className="relative px-6 py-3 rounded-2xl text-center" style={{ background: 'linear-gradient(to bottom, #f5c542, #c8881e)', border: '2px solid #FFE9A8', boxShadow: '0 0 28px rgba(245,197,66,0.95), 0 8px 20px rgba(0,0,0,0.6)', animation: 'saWinPop 0.5s ease-out both' }}>
                  <div className="text-[10px] font-black tracking-[3px]" style={{ color: '#3a1a06' }}>YOU WON</div>
                  <div className="text-3xl font-black italic leading-none mt-1" style={{ fontFamily: 'Georgia, serif', color: '#3a1a06', textShadow: '0 1px 0 rgba(255,255,255,0.45)' }}>${won.value.toFixed(2)}</div>
                </div>
              </div>
            )}
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