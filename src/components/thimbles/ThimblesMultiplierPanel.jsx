import React from 'react';

const EMBLEM_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/4dd17e75c_generated_image.png';
const CONFIG_FRAME = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/7e2a98220_generated_image.png';

export default function ThimblesMultiplierPanel({ mode, setMode, phase, SINGLE_MULT, TWO_MULT }) {
  return (
    <div
      className="rounded-xl py-4 px-3 flex items-center justify-between"
      style={{
        backgroundImage: `url('${CONFIG_FRAME}')`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        boxShadow: '0 3px 10px rgba(0,0,0,0.55)',
      }}
    >
      <button
        onClick={() => phase === 'idle' && setMode('single')}
        className="flex flex-col items-center gap-1 transition-transform active:scale-95"
        style={{ opacity: mode === 'single' ? 1 : 0.5 }}
      >
        <span className="text-[11px] font-bold tracking-widest" style={{ color: mode === 'single' ? '#ffe8a0' : '#a09080' }}>1 BALL</span>
        <span className="text-lg font-black tabular-nums" style={{ color: mode === 'single' ? '#ffe066' : '#8a7a60', textShadow: mode === 'single' ? '0 0 8px rgba(255,210,100,0.6)' : 'none' }}>X {SINGLE_MULT}</span>
      </button>

      <img
        src={EMBLEM_URL}
        alt="emblem"
        draggable={false}
        className="select-none"
        style={{ width: '64px', height: 'auto', mixBlendMode: 'screen', filter: 'drop-shadow(0 0 8px rgba(255,210,120,0.6))' }}
      />

      <button
        onClick={() => phase === 'idle' && setMode('two')}
        className="flex flex-col items-center gap-1 transition-transform active:scale-95"
        style={{ opacity: mode === 'two' ? 1 : 0.5 }}
      >
        <span className="text-[11px] font-bold tracking-widest" style={{ color: mode === 'two' ? '#ffe8a0' : '#a09080' }}>2 BALLS</span>
        <span className="text-lg font-black tabular-nums" style={{ color: mode === 'two' ? '#ffe066' : '#8a7a60', textShadow: mode === 'two' ? '0 0 8px rgba(255,210,100,0.6)' : 'none' }}>X {TWO_MULT}</span>
      </button>
    </div>
  );
}