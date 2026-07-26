import React from 'react';
import { ArrowLeft } from 'lucide-react';

// Minimal sharp golden-frame back button.
export default function BackButton({ href = '/', label = 'Back', className = '' }) {
  return (
    <button
      onClick={() => { window.location.href = href; }}
      title={label}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] italic font-bold transition-all hover:brightness-125 active:scale-95 whitespace-nowrap ${className}`}
      style={{
        border: '1px solid rgba(214,178,98,0.6)',
        background: 'rgba(20,17,13,0.7)',
        color: '#e8c878',
        fontFamily: 'Georgia, serif',
        marginTop: 30,
      }}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}