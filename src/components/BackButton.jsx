import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Minimal sharp golden-frame back button.
// Navigates via the router (no full page reload) so preloaded images,
// balances and app state survive when leaving a game.
export default function BackButton({ href = '/', label = 'Back', className = '' }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(href)}
      title={label}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] italic font-bold transition-all hover:brightness-125 active:scale-95 whitespace-nowrap ${className}`}
      style={{
        border: '1px solid rgba(214,178,98,0.6)',
        background: 'rgba(20,17,13,0.7)',
        color: '#e8c878',
        fontFamily: 'Georgia, serif',
      }}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}