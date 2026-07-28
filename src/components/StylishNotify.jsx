import React, { useEffect } from 'react';
import { Check } from 'lucide-react';

// Stylish top-banner notification for claim / submit success messages:
// black banner, white "Rey" font, golden accent, slide-in + auto-dismiss.
export default function StylishNotify({ data, onDone, duration = 1500 }) {
  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => onDone && onDone(), duration);
    return () => clearTimeout(t);
  }, [data, duration, onDone]);

  if (!data) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] flex justify-center px-3 pointer-events-none">
      <div
        className="mt-2 w-full max-w-md rounded-xl px-3.5 py-2.5 flex items-center gap-2.5"
        style={{
          background: 'linear-gradient(180deg, #0a0a0c 0%, #15130b 100%)',
          border: '1px solid rgba(245,210,120,0.55)',
          boxShadow: '0 6px 22px rgba(0,0,0,0.6), 0 0 18px rgba(255,200,90,0.22), inset 0 1px 0 rgba(255,240,180,0.18)',
          animation: `notifyLife ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) both`,
          willChange: 'transform, opacity',
        }}
      >
        <span
          className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full"
          style={{ background: 'radial-gradient(circle at 35% 30%, #ffe9a8, #c8881e)', boxShadow: '0 0 10px rgba(255,210,90,0.7)' }}
        >
          <Check className="w-4 h-4 text-stone-900" strokeWidth={3} />
        </span>
        <div className="flex-1 min-w-0 text-left">
          <p
            className="text-white font-black italic leading-tight tracking-wide"
            style={{ fontFamily: 'Rye, Georgia, serif', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
          >
            {data.title}
          </p>
          {data.description && (
            <p
              className="text-white/80 text-[11px] italic leading-tight mt-0.5"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {data.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}