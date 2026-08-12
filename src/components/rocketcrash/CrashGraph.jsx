import React, { useEffect, useRef } from 'react';
import { crashStore } from './crashStore';

const GROWTH = 1.10;

const BOMBER_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/15e34753b_generated_image.png';
const SAMPLES = 24; // reduced from 48 — halves per-frame path computation cost
const WIN_T = 8;    // seconds of flight visible across the x axis
const PLOT_TOP = 0.5; // reserve the top half so the bomber flies above the tip
const W = 100, H = 100;

// Pure geometry for a given multiplier — used both for the React render and
// for the imperative per-frame updates while the round is running.
function geom(multiplier, isWaiting) {
  const elapsed = isWaiting ? 0 : Math.log(Math.max(multiplier, 1)) / Math.log(GROWTH);
  const maxM = Math.max(2, multiplier * 1.18);
  const startT = Math.max(0, elapsed - WIN_T * 0.45);
  const pts = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = startT + (WIN_T * i) / SAMPLES;
    if (t > elapsed + 0.0001) break;
    const m = Math.pow(GROWTH, t);
    const x = (i / SAMPLES) * W;
    const f = (m - 1) / (maxM - 1);
    const y = H * (1 - f * (1 - PLOT_TOP));
    pts.push([x, y]);
  }
  if (!pts.length) pts.push([0, H]);
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(' ');
  const last = pts[pts.length - 1];
  const area = path + ` L ${last[0].toFixed(2)} 100 L 0 100 Z`;
  return { path, area, tip: last };
}

export default function CrashGraph({ phase, multiplier, countdown }) {
  const { path, area, tip } = geom(multiplier, phase === 'waiting');
  const crashed = phase === 'crashed';

  const boxRef = useRef(null);
  const areaRef = useRef(null);
  const glowRef = useRef(null);
  const lineRef = useRef(null);
  const planeRef = useRef(null);
  const multRef = useRef(null);

  // While the round is running, drive the curve, the plane and the multiplier
  // text straight from the mutable store on every animation frame. This keeps
  // the motion perfectly smooth because React never re-renders for it.
  useEffect(() => {
    if (phase !== 'running') return;
    let raf = 0;
    // Cache the box size so the frame loop never reads layout (no reflow).
    let cw = 0, ch = 0;
    const measure = () => {
      const r = boxRef.current?.getBoundingClientRect();
      if (r) { cw = r.width; ch = r.height; }
    };
    measure();
    window.addEventListener('resize', measure);
    let lastText = '';
    const tick = () => {
      const m = crashStore.multiplier;
      const g = geom(m, false);
      if (areaRef.current) areaRef.current.setAttribute('d', g.area);
      if (glowRef.current) glowRef.current.setAttribute('d', g.path);
      if (lineRef.current) lineRef.current.setAttribute('d', g.path);
      if (planeRef.current) {
        // GPU-composited move: transform only, never left/top (which reflow).
        planeRef.current.style.transform =
          `translate3d(${(g.tip[0] / 100) * cw}px, ${(g.tip[1] / 100) * ch}px, 0) translateY(-100%) rotate(-30deg)`;
      }
      const txt = m.toFixed(2);
      if (multRef.current && txt !== lastText) { lastText = txt; multRef.current.textContent = txt; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', measure); };
  }, [phase]);
  const running = phase === 'running';

  // bomber held at a fixed 30° nose-up takeoff attitude.
  const angle = -30;

  return (
    <div ref={boxRef} className="relative w-full overflow-hidden rounded-xl bg-gradient-to-b from-slate-950 to-black border border-indigo-900/40"
      style={{ aspectRatio: '16 / 10', boxShadow: 'inset 0 0 80px rgba(0,0,0,0.7)' }}>
      {/* faint grid */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[20, 40, 60, 80].map(g => (
          <line key={'h' + g} x1="0" y1={g} x2="100" y2={g} stroke="rgba(99,102,241,0.08)" strokeWidth="0.3" />
        ))}
        {[20, 40, 60, 80].map(g => (
          <line key={'v' + g} x1={g} y1="0" x2={g} y2="100" stroke="rgba(99,102,241,0.08)" strokeWidth="0.3" />
        ))}

        {phase !== 'waiting' && (
          <>
            <defs>
              <linearGradient id="crashFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={crashed ? 'rgba(244,63,94,0.45)' : 'rgba(99,102,241,0.45)'} />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </linearGradient>
              <linearGradient id="crashLine" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor={crashed ? '#f43f5e' : '#6366f1'} />
                <stop offset="100%" stopColor={crashed ? '#fb7185' : '#a78bfa'} />
              </linearGradient>
            </defs>
            <path ref={areaRef} d={area} fill="url(#crashFill)" />
            {/* Cheap glow: a wider semi-transparent stroke behind the main line.
                Replaces the expensive per-frame drop-shadow filter that caused lag. */}
            <path ref={glowRef} d={path} fill="none" stroke={crashed ? 'rgba(244,63,94,0.35)' : 'rgba(129,140,248,0.35)'} strokeWidth="3" strokeLinecap="round" />
            <path ref={lineRef} d={path} fill="none" stroke="url(#crashLine)" strokeWidth="1.1" strokeLinecap="round" />
          </>
        )}
      </svg>

      {/* stealth bomber at the tip — takeoff feel with exhaust trail */}
      {running && (
        <span ref={planeRef} className="absolute z-20 left-0 top-0 pointer-events-none" style={{
          transform: `translate3d(0,0,0) translateY(-100%) rotate(${angle}deg)`,
          transformOrigin: 'center center',
          willChange: 'transform',
          }}>
          <span className="relative flex items-center justify-center" style={{ width: '280px', height: '168px' }}>
            {/* exhaust / jet flame trail behind the bomber */}
            <span className="absolute" style={{
              left: '-80px', top: '50%', width: '80px', height: '28px', transform: 'translateY(-50%)',
              background: 'linear-gradient(to left, rgba(255,180,60,0.95), rgba(255,120,40,0.6) 40%, rgba(255,80,20,0) 100%)',
              borderRadius: '50%', filter: 'blur(3px)', mixBlendMode: 'screen',
              animation: 'jetExhaust 0.18s ease-in-out infinite', boxShadow: '0 0 14px rgba(255,140,40,0.8)',
            }} />
            <img src={BOMBER_IMG} alt="bomber" draggable={false}
              className="w-full h-full object-contain select-none"
              style={{
                filter: 'brightness(2.2) contrast(1.3)',
                WebkitMaskImage: `url(${BOMBER_IMG})`,
                WebkitMaskMode: 'luminance',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskImage: `url(${BOMBER_IMG})`,
                maskMode: 'luminance',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
              }} />
          </span>
        </span>
      )}
      {crashed && (
        <span className="absolute z-20 pointer-events-none" style={{ left: `${tip[0]}%`, top: `${tip[1]}%`, transform: 'translate(-50%, -50%)' }}>
          {/* shockwave ring */}
          <span className="absolute rounded-full border-2 border-amber-300/80"
            style={{ width: '8px', height: '8px', left: '-4px', top: '-4px', animation: 'blastRing 0.7s ease-out forwards' }} />
          <span className="absolute rounded-full border-2 border-rose-400/70"
            style={{ width: '8px', height: '8px', left: '-4px', top: '-4px', animation: 'blastRing 0.7s ease-out 0.12s forwards' }} />
          {/* flame core */}
          <span className="absolute rounded-full"
            style={{ width: '46px', height: '46px', left: '-23px', top: '-23px',
              background: 'radial-gradient(circle, rgba(255,245,200,1) 0%, rgba(255,180,60,0.95) 22%, rgba(255,90,30,0.85) 45%, rgba(220,40,20,0.5) 70%, rgba(120,10,5,0) 100%)',
              animation: 'blastCore 0.8s ease-out forwards', filter: 'blur(1px)' }} />
          {/* ember debris */}
          {[...Array(7)].map((_, i) => {
            const a = (Math.PI * 2 * i) / 7 + 0.4;
            const dist = 26 + (i % 3) * 12;
            return (
              <span key={i} className="absolute rounded-full"
                style={{ width: '4px', height: '4px', left: '-2px', top: '-2px',
                  background: i % 2 ? 'rgba(255,200,80,0.95)' : 'rgba(255,120,50,0.9)',
                  ['--ex']: `${Math.cos(a) * dist}px`, ['--ey']: `${Math.sin(a) * dist}px`,
                  animation: `blastEmber 0.8s ease-out ${0.05 * i}s forwards`, boxShadow: '0 0 6px rgba(255,160,60,0.9)' }} />
            );
          })}
        </span>
      )}

      {/* center multiplier / status */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
        {phase === 'waiting' && (
          <>
            <span className="text-sm tracking-[0.3em] text-indigo-300/70 font-bold uppercase">Waiting for next round</span>
            <span className="mt-2 text-5xl font-black tabular-nums text-indigo-200" style={{ textShadow: '0 0 18px rgba(99,102,241,0.7)' }}>
              {Math.ceil(countdown / 1000)}s
            </span>
          </>
        )}
        {running && (
          <span className="text-6xl sm:text-7xl font-black tabular-nums text-white"
            style={{ textShadow: '0 0 10px rgba(167,139,250,0.7)', willChange: 'transform', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}>
            <span ref={multRef}>{multiplier.toFixed(2)}</span><span className="text-4xl text-indigo-300">x</span>
          </span>
        )}
        {crashed && (
          <>
            <span className="text-2xl font-black tracking-widest text-rose-400 uppercase"
              style={{ textShadow: '0 0 18px rgba(244,63,94,0.8)' }}>Flew Away!</span>
            <span className="mt-1 text-5xl font-black tabular-nums text-rose-500"
              style={{ textShadow: '0 0 20px rgba(244,63,94,0.9)' }}>
              {multiplier.toFixed(2)}x
            </span>
          </>
        )}
      </div>
    </div>
  );
}