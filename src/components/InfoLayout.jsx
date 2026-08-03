import React from 'react';
import { useNavigate } from 'react-router-dom';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

export default function InfoLayout({ title, subtitle, icon: Icon, children }) {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen pb-20" style={{ background: '#0D0D0D', fontFamily: SANS }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(120% 60% at 50% -10%, rgba(212,175,55,0.10), transparent 60%), radial-gradient(80% 50% at 100% 110%, rgba(212,175,55,0.05), transparent 60%), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/42da6c35a_file_00000000a918820b81da42fc2ddfcfda.png) center/cover no-repeat', backgroundAttachment: 'fixed' }} />

      <header
        className="sticky top-0 z-30"
        style={{ background: 'rgba(13,13,13,0.78)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(212,175,55,0.22)' }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="flex-1 flex items-center justify-center gap-2">
            {Icon && <Icon className="w-5 h-5" style={{ color: '#D4AF37' }} />}
            <span className="text-lg font-extrabold tracking-tight" style={{ color: '#D4AF37' }}>{title}</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-6">
        {subtitle && <p className="text-xs mb-5 uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.45)' }}>{subtitle}</p>}
        {children}
      </main>
    </div>
  );
}

export function InfoSection({ n, title, children }) {
  return (
    <div className="dash-card p-5" style={{ animation: 'dashFadeIn 400ms ease both' }}>
      <div className="flex items-start gap-3">
        {n != null && (
          <span className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 text-sm font-extrabold" style={{ background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37' }}>{n}</span>
        )}
        <div className="flex-1 min-w-0">
          {title && <h2 className="text-base font-bold mb-1.5" style={{ color: '#fff' }}>{title}</h2>}
          <div className="text-sm leading-relaxed" style={{ color: 'rgba(38,161,123,0.95)' }}>{children}</div>
        </div>
      </div>
    </div>
  );
}