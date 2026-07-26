import React, { useEffect, useState } from 'react';

// Banner shown in place of the spin button during the free spins round.
// Displays the running total multiplier accumulated across the whole round.
// Every time a multiplier symbol lands, its value is added to the running
// total and the banner pulses to highlight the new value.
export default function GatesMultBanner({ value }) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (value > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 420);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center justify-center rounded-[10px] px-3 py-1.5 shrink-0"
      style={{
        minWidth: 72, minHeight: 68,
        background: 'linear-gradient(135deg,#3a1052,#7a30a0,#3a1052)',
        border: '2px solid #b070e0',
        boxShadow: pulse
          ? '0 0 0 2px rgba(255,220,120,0.9), 0 0 18px rgba(180,110,255,0.95), 0 2px 8px rgba(0,0,0,0.5)'
          : '0 0 10px rgba(180,110,255,0.4), 0 2px 8px rgba(0,0,0,0.5)',
        transition: 'box-shadow 0.18s',
      }}>
      <span style={{ fontFamily: 'Georgia,serif', fontSize: '8px', fontWeight: 900, color: '#e0c0ff', letterSpacing: '0.1em', textAlign: 'center', lineHeight: 1.1 }}>
        TOTAL
      </span>
      <span style={{ fontFamily: 'Georgia,serif', fontSize: '8px', fontWeight: 900, color: '#e0c0ff', letterSpacing: '0.1em', textAlign: 'center', lineHeight: 1.1 }}>
        MULTIPLIER
      </span>
      <span style={{
        fontFamily: 'Georgia,serif', fontSize: '22px', fontWeight: 900, color: '#ffe080',
        lineHeight: 1.1, marginTop: 2,
        textShadow: '0 0 10px rgba(255,200,0,0.85), 0 1px 2px rgba(0,0,0,0.8)',
        transform: pulse ? 'scale(1.12)' : 'scale(1)',
        transition: 'transform 0.18s',
      }}>
        {value || 0}<span style={{ fontSize: '16px' }}>×</span>
      </span>
    </div>
  );
}