import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Gamepad2 } from 'lucide-react';

const DEFAULTS = [
  {
    title: 'Welcome to the Saloon',
    description: 'Spin the reels of Wild Bounty Showdown, test your luck on the wheel, or read the cards. New games added often!',
    link: '/games/wild-bounty',
    link_label: 'Play Wild Bounty',
  },
];

export default function BannerCarousel() {
  const [banners, setBanners] = useState(null);
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    base44.entities.Banner
      .filter({ active: true }, 'order', 5)
      .then((rows) => { if (alive) setBanners(rows.length ? rows : DEFAULTS); })
      .catch(() => { if (alive) setBanners(DEFAULTS); });
    return () => { alive = false; };
  }, []);

  const count = banners ? banners.length : 1;
  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 3000);
    return () => clearInterval(t);
  }, [count]);

  if (!banners) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-amber-600/40 p-6 h-[120px] bg-gradient-to-r from-amber-900/60 via-stone-900/60 to-emerald-900/60" />
    );
  }

  const go = (link) => {
    if (!link) return;
    if (/^https?:\/\//i.test(link)) window.open(link, '_blank', 'noopener,noreferrer');
    else navigate(link);
  };

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl border border-amber-600/40">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {banners.map((b, i) => (
            <div
              key={i}
              className="w-full shrink-0 cursor-pointer"
              onClick={() => go(b.link)}
              style={b.image_url ? {
                backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.55), rgba(0,0,0,0.15)), url(${b.image_url})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                minHeight: 120,
              } : {
                background: 'linear-gradient(to right, rgba(120,80,20,0.55), rgba(20,30,20,0.6), rgba(20,80,50,0.5))',
                minHeight: 120,
              }}
            >
              <div className="relative p-5 sm:p-6 flex flex-col justify-center h-full" style={{ minHeight: 120 }}>
                <h2 className="text-xl sm:text-2xl font-black italic text-amber-200 drop-shadow" style={{ fontFamily: 'Georgia, serif' }}>
                  {b.title}
                </h2>
                {b.description && (
                  <p className="text-xs sm:text-sm text-amber-100/85 mt-1 max-w-md">{b.description}</p>
                )}
                {b.link_label && (
                  <span className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 text-xs font-black italic w-fit shadow-lg" style={{ fontFamily: 'Georgia, serif' }}>
                    <Gamepad2 className="w-3.5 h-3.5" /> {b.link_label}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* dots */}
      {count > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-amber-400' : 'w-1.5 bg-amber-100/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}