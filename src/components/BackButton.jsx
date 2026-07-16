import React from 'react';
import { ArrowLeft } from 'lucide-react';

// Western-styled back button: gold-trimmed wooden frame, arrow + "Back" label.
export default function BackButton({ href = '/', label = 'Back', className = '' }) {
  return (
    <button
      onClick={() => { window.location.href = href; }}
      title={label}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md italic font-bold border transition-all hover:brightness-110 active:scale-95 whitespace-nowrap ${className}`}
      style={{
        background: 'linear-gradient(to bottom, rgba(58,40,18,0.95), rgba(26,18,9,0.95))',
        borderColor: 'rgba(190,140,55,0.8)',
        color: '#f5d590',
        boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.35), inset 0 0 0 1px rgba(46,30,12,0.6), 0 2px 6px rgba(0,0,0,0.6)',
        fontFamily: 'Rye, Georgia, serif',
      }}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}