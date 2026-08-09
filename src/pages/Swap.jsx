import React from 'react';
import { ArrowLeftRight } from 'lucide-react';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

export default function Swap() {
  return (
    <div className="relative min-h-screen pb-24" style={{ background: '#0D0D0D', fontFamily: SANS }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(120% 60% at 50% -10%, rgba(212,175,55,0.12), transparent 60%), radial-gradient(80% 50% at 100% 110%, rgba(212,175,55,0.06), transparent 60%)' }} />

      <header
        className="sticky top-0 z-30"
        style={{ background: 'rgba(13,13,13,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(212,175,55,0.22)' }}
      >
        <div className="max-w-md lg:max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            title="Back"
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="flex-1 flex items-center justify-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'linear-gradient(135deg,#FFD700,#C89B3C)', boxShadow: '0 0 14px rgba(212,175,55,0.45)' }}>
              <ArrowLeftRight className="w-5 h-5" style={{ color: '#1a1408' }} />
            </div>
            <span className="text-lg font-extrabold tracking-tight" style={{ color: '#D4AF37' }}>Swap</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="relative z-10 max-w-md lg:max-w-7xl mx-auto px-4 py-10 flex flex-col items-center justify-center min-h-[60vh]">
        <div
          className="dash-card p-10 flex flex-col items-center gap-5 text-center"
          style={{ animation: 'dashFadeIn 400ms ease both' }}
        >
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl" style={{ background: 'linear-gradient(135deg,#FFD700,#C89B3C)', boxShadow: '0 0 28px rgba(212,175,55,0.5)' }}>
            <ArrowLeftRight className="w-10 h-10" style={{ color: '#1a1408' }} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: '#D4AF37' }}>Coming Soon</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Our token swap feature is on the way. Stay tuned!</p>
        </div>
      </main>
    </div>
  );
}