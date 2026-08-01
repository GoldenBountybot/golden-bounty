import React from 'react';
import { Link } from 'react-router-dom';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

const LINKS = [
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Responsible Gaming', to: '/responsible-gaming' },
  { label: 'Licenses', to: '/licenses' },
  { label: 'About Us', to: '/about' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Contact', to: '/faq' },
];

export default function SiteFooter() {
  return (
    <footer className="max-w-6xl mx-auto px-4 py-8" style={{ fontFamily: SANS, borderTop: '1px solid rgba(212,175,55,0.18)' }}>
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm font-bold" style={{ color: '#D4AF37' }}>© 2026 Golden Bounty. All rights reserved.</p>
        <p className="text-[11px] leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Dubai-based platform · Licensed by BDS INFO S.A. under CONAJZAR Resolution No. 07/2026 (31 January 2026).<br />
          Certificate issued 24 April 2026. Authorized for markets outside the territory of Paraguay.
        </p>
        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          24/7 Support · 18+ Only · Gamble Responsibly
        </p>
        <nav className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
          {LINKS.map(l => (
            <Link key={l.label} to={l.to} className="text-[11px] font-semibold transition-colors hover:underline" style={{ color: 'rgba(212,175,55,0.8)' }}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}