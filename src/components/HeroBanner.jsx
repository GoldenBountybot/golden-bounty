import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, Play, TrendingUp, Info, HelpCircle, Shield, Award } from 'lucide-react';

const BANNER_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/fac3dbda4_file_000000008654821185c00f28c290ba18.png';

const SECONDARY = [
  { label: 'About', to: '/about', icon: Info },
  { label: 'FAQ', to: '/faq', icon: HelpCircle },
  { label: 'Terms', to: '/terms', icon: Shield },
  { label: 'Licenses', to: '/licenses', icon: Award },
];

export default function HeroBanner() {
  return (
    <section className="max-w-6xl mx-auto px-4 pb-2">
      {/* Banner image */}
      <div className="relative overflow-hidden rounded-2xl" style={{ border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
        <img src={BANNER_IMG} alt="Welcome to Golden Bounty" className="w-full h-auto block" />
      </div>

      {/* Main buttons */}
      <div className="mt-4 flex flex-col gap-2.5">
        <div className="flex gap-2.5">
          <Link
            to="/register"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-extrabold transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #FFD700, #C89B3C)', color: '#1a1408', boxShadow: '0 4px 14px rgba(212,175,55,0.4), inset 0 1px 0 rgba(255,255,255,0.45)' }}
          >
            <Gift className="w-4 h-4" /> CLAIM 1 FREE SPIN NOW
          </Link>
          <button
            onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-extrabold transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6d28d9, #4c1d95)', color: '#fff', boxShadow: '0 4px 14px rgba(109,40,217,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}
          >
            <Play className="w-4 h-4" /> PLAY NOW
          </button>
        </div>
        <Link
          to="/dashboard?tab=stack"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-extrabold transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #34d399, #059669)', color: '#062018', boxShadow: '0 4px 14px rgba(52,211,153,0.35), inset 0 1px 0 rgba(255,255,255,0.45)' }}
        >
          <TrendingUp className="w-4 h-4" /> START STAKING
        </Link>
      </div>

      {/* Subtle secondary buttons */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {SECONDARY.map(s => {
          const Icon = s.icon;
          return (
            <Link
              key={s.to}
              to={s.to}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-95"
              style={{ border: '1px solid rgba(212,175,55,0.2)', background: 'rgba(255,255,255,0.02)', color: 'rgba(212,175,55,0.8)' }}
            >
              <Icon className="w-3 h-3" /> {s.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}