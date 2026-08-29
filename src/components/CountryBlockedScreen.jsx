import React from 'react';
import { ShieldAlert } from 'lucide-react';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, sans-serif";

// Full-screen notice shown when the visitor's country is restricted.
export default function CountryBlockedScreen({ country }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#0D0D0D', fontFamily: SANS }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(120% 60% at 50% -10%, rgba(212,175,55,0.12), transparent 60%)' }}
      />
      <div className="relative flex flex-col items-center gap-4 max-w-sm">
        <div
          className="flex items-center justify-center w-16 h-16 rounded-2xl"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)' }}
        >
          <ShieldAlert className="w-8 h-8" style={{ color: '#ef4444' }} />
        </div>
        <h1 className="text-xl font-extrabold" style={{ color: '#D4AF37' }}>Country Blocked</h1>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Golden Bounty is not available in your region{country ? ` (${country})` : ''}.
          Access from this location is restricted under our game providers&apos; licensing terms.
        </p>
        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          If you believe this is a mistake, please contact our support team.
        </p>
      </div>
    </div>
  );
}