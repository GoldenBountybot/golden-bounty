import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// Premium iconic Western game banners — gilt gold frames, Rye typography,
// auto-rotating carousel featuring the flagship games with their logos.
const BANNERS = [
  {
    title: 'Wild Bounty Showdown',
    subtitle: '3600 Ways · Cascade Wins',
    image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/400f63f31_generated_image.png',
    link: '/games/wild-bounty',
    accent: '#f5c542',
  },
  {
    title: 'Crown Coins',
    subtitle: 'Royal Treasury · 5 Lines',
    image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e8873dacc_generated_image.png',
    link: '/games/crown-coins',
    accent: '#e7b94a',
  },
  {
    title: 'Aviator',
    subtitle: 'Cash Out in Time',
    image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/704331505_generated_image.png',
    link: '/games/rocket-crash',
    accent: '#d98a3a',
  },
  {
    title: 'Golden Stack Vault',
    subtitle: 'Daily Gold Profits',
    desc: 'Stake any amount from $50 up and watch your balance compound. The longer it stays locked, the more daily gold you harvest — guaranteed returns, zero risk, paid straight to your wallet.',
    image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c6e6b2403_generated_image.png',
    link: '/dashboard?tab=stack',
    accent: '#f0b438',
    stack: true,
  },
  {
    title: 'Plinko Drop',
    subtitle: 'Drop & Win',
    image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e448825ee_generated_image.png',
    link: '/games/plinko',
    accent: '#e6a23c',
  },
];

export default function WesternGameBanners() {
  const count = BANNERS.length;
  // Duplicate the list so the track can scroll seamlessly forever and
  // snap back to the start without a visible jump back to "the first slide".
  const SLIDES = [...BANNERS, ...BANNERS];
  const [raw, setRaw] = useState(0);
  const [noTrans, setNoTrans] = useState(false);
  const [hold, setHold] = useState(false);
  const navigate = useNavigate();

  const press = useRef({ t: 0, x: 0, y: 0, moved: false, long: false });
  const longTimer = useRef(null);

  // Continuous advance — never modulo; we snap back invisibly instead.
  useEffect(() => {
    if (hold) return;
    const t = setInterval(() => setRaw((r) => r + 1), 3500);
    return () => clearInterval(t);
  }, [hold]);

  // Seamless snap-back: once we've fully scrolled onto the cloned first set,
  // jump (without transition) to the equivalent real index.
  const handleTransitionEnd = () => {
    if (raw >= count) {
      setNoTrans(true);
      setRaw(raw % count);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setNoTrans(false))
      );
    }
  };

  // Press-and-hold pauses rotation; a quick tap still navigates.
  const onPointerDown = (e) => {
    press.current = { t: Date.now(), x: e.clientX, y: e.clientY, moved: false, long: false };
    setHold(true);
    clearTimeout(longTimer.current);
    longTimer.current = setTimeout(() => { press.current.long = true; }, 300);
  };
  const onPointerMove = (e) => {
    if (Math.abs(e.clientX - press.current.x) > 10 || Math.abs(e.clientY - press.current.y) > 10) {
      press.current.moved = true;
    }
  };
  const onPointerUp = (link) => {
    clearTimeout(longTimer.current);
    setHold(false);
    const dur = Date.now() - press.current.t;
    // Treat as a tap only if it was short, didn't drift, and wasn't a hold.
    if (!press.current.moved && !press.current.long && dur < 400) {
      navigate(link);
    }
  };
  const onPointerLeave = () => {
    clearTimeout(longTimer.current);
    setHold(false);
  };

  const active = raw % count;

  return (
    <div className="relative">
      {/* Sharp gilt frame */}
      <div
        className="relative overflow-hidden select-none"
        style={{
          borderRadius: 9,
          border: '1px solid rgba(214,178,98,0.55)',
          boxShadow: 'inset 0 1px 0 rgba(255,240,200,0.18), 0 6px 18px rgba(0,0,0,0.55)',
        }}
      >
        <div
          className="flex"
          style={{
            transform: `translateX(-${raw * 100}%)`,
            transition: noTrans ? 'none' : 'transform 0.7s ease-out',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {SLIDES.map((b, i) => (
            <div
              key={i}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={() => onPointerUp(b.link)}
              onPointerLeave={onPointerLeave}
              onPointerCancel={onPointerLeave}
              className="w-full shrink-0 cursor-pointer relative touch-none"
              style={{ aspectRatio: '16 / 7' }}
            >
              <img
                src={b.image}
                alt={b.title}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
                decoding="async"
              />
              {/* Western vignette + bottom fade for text legibility */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(8,7,5,0.92) 4%, rgba(8,7,5,0.35) 42%, rgba(8,7,5,0.12) 70%, rgba(8,7,5,0.45) 100%)',
                }}
              />
              {/* Gilt corner flourishes */}
              <div className="absolute top-2 left-2 w-6 h-6 border-l border-t" style={{ borderColor: 'rgba(245,210,120,0.7)' }} />
              <div className="absolute top-2 right-2 w-6 h-6 border-r border-t" style={{ borderColor: 'rgba(245,210,120,0.7)' }} />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-l border-b" style={{ borderColor: 'rgba(245,210,120,0.7)' }} />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-r border-b" style={{ borderColor: 'rgba(245,210,120,0.7)' }} />

              {/* "Hold to pause" hint + paused badge */}
              {hold && (
                <div
                  className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 italic text-[10px] font-black tracking-wide"
                  style={{
                    borderRadius: 6,
                    border: '1px solid rgba(245,210,120,0.9)',
                    background: 'rgba(10,8,5,0.85)',
                    color: '#f7e3a8',
                    fontFamily: 'Rye, Georgia, serif',
                  }}
                >
                  Paused
                </div>
              )}

              {/* Text */}
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col items-center text-center pointer-events-none">
                {/* decorative gilt rule */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="block h-px w-8" style={{ background: `linear-gradient(to right, transparent, ${b.accent})` }} />
                  <span style={{ color: b.accent, fontFamily: 'Smokum, Rye, Georgia, serif' }} className="text-[9px] tracking-[0.3em] uppercase">{b.stack ? 'Staking' : 'Featured'}</span>
                  <span className="block h-px w-8" style={{ background: `linear-gradient(to left, transparent, ${b.accent})` }} />
                </div>
                {b.stack && (
                  <svg viewBox="0 0 48 48" className="w-9 h-9 mb-1" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6)) drop-shadow(0 0 6px rgba(245,210,120,0.5))' }}>
                    <ellipse cx="24" cy="13" rx="13" ry="5" fill="#c8881e" stroke="#f5c542" strokeWidth="1.5" />
                    <ellipse cx="24" cy="13" rx="8" ry="3" fill="none" stroke="#f7e3a8" strokeWidth="1" opacity="0.7" />
                    <rect x="11" y="18" width="26" height="6" rx="3" fill="#e6a23c" stroke="#f5c542" strokeWidth="1.5" />
                    <rect x="11" y="25" width="26" height="6" rx="3" fill="#d98a3a" stroke="#f5c542" strokeWidth="1.5" />
                    <rect x="11" y="32" width="26" height="6" rx="3" fill="#c8881e" stroke="#f5c542" strokeWidth="1.5" />
                    <path d="M22 35h4v2h-4z" fill="#3a2a10" />
                  </svg>
                )}
                <h2
                  className="text-xl sm:text-2xl italic leading-tight"
                  style={{
                    fontFamily: 'Rye, Georgia, serif',
                    color: '#f7e3a8',
                    textShadow: '0 2px 6px rgba(0,0,0,0.85), 0 0 14px rgba(245,210,120,0.35)',
                  }}
                >
                  {b.title}
                </h2>
                {b.subtitle && (
                  <p className="text-[10px] sm:text-xs mt-0.5 italic" style={{ fontFamily: 'Georgia, serif', color: 'rgba(245,225,170,0.82)' }}>
                    {b.subtitle}
                  </p>
                )}
                {b.desc && (
                  <p className="mt-1.5 max-w-md text-[9px] sm:text-[10px] leading-relaxed italic px-2" style={{ fontFamily: 'Georgia, serif', color: 'rgba(245,225,170,0.78)' }}>
                    {b.desc}
                  </p>
                )}
                <span
                  className="inline-flex items-center gap-1 mt-2.5 px-4 py-1.5 italic text-xs font-black"
                  style={{
                    borderRadius: 7,
                    border: '1px solid rgba(245,210,120,0.9)',
                    background: 'linear-gradient(to bottom, #f5c542, #c8881e)',
                    color: '#2a1a06',
                    boxShadow: 'inset 0 1px 0 rgba(255,240,180,0.5), 0 3px 8px rgba(200,136,30,0.5)',
                    fontFamily: 'Rye, Georgia, serif',
                    textShadow: '0 1px 1px rgba(255,240,200,0.4)',
                  }}
                >
                  {b.stack ? 'Stack Now' : 'Play Now'} <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-2.5">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setRaw(i)}
            aria-label={`Banner ${i + 1}`}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i === active ? 24 : 6,
              background: i === active ? 'linear-gradient(to right,#f5c542,#c8881e)' : 'rgba(245,210,120,0.3)',
            }}
          />
        ))}
      </div>
    </div>
  );
}