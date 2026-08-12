import React from 'react';
import { X } from 'lucide-react';

const AMOUNTS = [1, 2, 5, 10, 20, 50, 100, 200, 500];

export default function BetAmountPicker({ bet, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xs rounded-xl p-4 relative"
        onClick={(e) => e.stopPropagation()}
        style={{ border: '3px solid #d4af37', background: 'linear-gradient(to bottom, #2a0608, #140204)' }}
      >
        <button onClick={onClose} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 border border-yellow-700/50 flex items-center justify-center text-yellow-100">
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-base font-black text-yellow-300 mb-3 text-center" style={{ fontFamily: 'Rye, Georgia, serif' }}>Bet Amount</h3>
        <div className="grid grid-cols-3 gap-2">
          {AMOUNTS.map((a) => {
            const active = Math.abs(bet - a) < 0.001;
            return (
              <button
                key={a}
                onClick={() => { onSelect(a); onClose(); }}
                className="py-2 rounded-lg text-sm font-black tabular-nums"
                style={{
                  fontFamily: 'Georgia, serif',
                  border: active ? '2px solid #ffd24a' : '1px solid rgba(212,175,55,0.45)',
                  background: active ? 'radial-gradient(circle at center, #fff2c0, #e8a93a 70%, #b8860b)' : 'rgba(0,0,0,0.45)',
                  color: active ? '#3a2400' : '#ffe9a8',
                  boxShadow: active ? '0 0 10px rgba(255,210,80,0.8)' : 'none',
                }}
              >
                ${a}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}