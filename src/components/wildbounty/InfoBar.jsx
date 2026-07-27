import React from 'react';
import { Wallet, Coins, Trophy } from 'lucide-react';

// Clean info bar matching the reference: dark semi-transparent rounded boxes
// with a yellow icon and a bold white value (sans-serif, no western font).
function InfoBox({ icon: Icon, value }) {
  return (
    <div
      className="flex-1 flex items-center gap-2 rounded-xl px-2.5 py-2 min-w-0"
      style={{
        background: 'rgba(107,90,74,0.82)',
        border: '1px solid rgba(197,160,89,0.4)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 5px rgba(0,0,0,0.5)',
      }}
    >
      <Icon className="w-5 h-5 shrink-0" style={{ color: '#ffd700' }} strokeWidth={2.2} />
      <span
        className="text-white font-bold text-sm tabular-nums truncate"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
      >
        {value}
      </span>
    </div>
  );
}

export default function InfoBar({ balance, bet, win }) {
  return (
    <div className="flex gap-2 px-3 py-2">
      <InfoBox icon={Wallet} value={`$${balance.toFixed(2)}`} />
      <InfoBox icon={Coins} value={`$${bet.toFixed(2)}`} />
      <InfoBox icon={Trophy} value={`$${win.toFixed(2)}`} />
    </div>
  );
}