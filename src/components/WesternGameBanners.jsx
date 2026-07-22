import React, { useEffect, useState } from 'react';
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
    title: 'Plinko Drop',
    subtitle: 'Drop & Win',
    image: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e448825ee_generated_image.png',
    link: '/games/plinko',
    accent: '#e6a23c',
  },
];

export default function WesternGameBanners() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const count = BANNERS.length;

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 3500);
    return () => clearInterval(t);
  }, [count]);

  return (
    <div className="relative">
      {/* Sharp gilt frame */}
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 9,
          border: '1px solid rgba(214,178,98,0.55)',
          boxShadow: 'inset 0 1px 0 rgba(255,240,200,0.18), 0 6px 18px rgba(0,0,0,0.55)',
        }}
      >
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {BANNERS.map((b, i) => (
            <div
              key={i}
              onClick={() => navigate(b.link)}
              className="w-full shrink-0 cursor-pointer relative"
              style={{ aspectRatio: '16 / 7' }}
            >
              <img
                src={b.image}
                alt={b.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
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

              {/* Text */}
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col items-center text-center">
                {/* decorative gilt rule */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="block h-px w-8" style={{ background: `linear-gradient(to right, transparent, ${b.accent})` }} />
                  <span style={{ color: b.accent, fontFamily: 'Smokum, Rye, Georgia, serif' }} className="text-[9px] tracking-[0.3em] uppercase">Featured</span>
                  <span className="block h-px w-8" style={{ background: `linear-gradient(to left, transparent, ${b.accent})` }} />
                </div>
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
                  Play Now <ChevronRight className="w-3.5 h-3.5" />
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
            onClick={() => setIndex(i)}
            aria-label={`Banner ${i + 1}`}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i === index ? 24 : 6,
              background: i === index ? 'linear-gradient(to right,#f5c542,#c8881e)' : 'rgba(245,210,120,0.3)',
            }}
          />
        ))}
      </div>
    </div>
  );
}