import React from 'react';
import { isInsideTelegram } from '@/lib/telegram';

const PLAQUE_BG =
  "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/670fa1a3e_generated_image.png') center / cover, linear-gradient(to bottom, rgba(58,40,18,0.92), rgba(26,18,9,0.95))";

// Full-width western plaque title bar: the game title sits centered inside a
// gold-trimmed wooden plaque that stretches edge to edge, with optional
// controls pinned to the left/right edges. Symmetric padding keeps the text
// truly centered in the frame while clearing the edge controls.
export default function GameTitleBar({ title, icon, left, right, padLeft = 'pl-24', padRight = 'pr-24', maxWidth = 'max-w-md' }) {
  return (
    <div
      className={`${maxWidth} mx-auto px-3 py-2.5`}
      // Telegram fullscreen draws its own chrome over the very top of the page,
      // so leave space above the plaque and push the game content down with it.
      style={isInsideTelegram() ? { paddingTop: 'calc(env(safe-area-inset-top, 0px) + 42px)' } : undefined}
    >
      <div className="relative">
        <div
          className={`w-full flex items-center justify-center gap-1.5 py-1.5 ${padLeft} ${padRight}`}
          style={{
            background: PLAQUE_BG,
            border: '1px solid rgba(190,140,55,0.75)',
            boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.3), 0 2px 6px rgba(0,0,0,0.55)',
          }}
        >
          {icon}
          <span
            className="text-sm font-black italic tracking-wide text-center whitespace-nowrap"
            style={{ color: '#f3e2b3', fontFamily: 'Rye, Georgia, serif', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
          >
            {title}
          </span>
        </div>
        {left && <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center">{left}</div>}
        {right && <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5">{right}</div>}
      </div>
    </div>
  );
}