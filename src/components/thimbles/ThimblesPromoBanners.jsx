import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, Trophy, Crown } from 'lucide-react';

const banners = [
  { title: 'DAILY BONUS', sub: 'UP TO 100 USDT', cta: 'CLAIM NOW', to: '/promo-welcome', Icon: Gift, bg: 'linear-gradient(to bottom, #1b4d3e, #0e3524)' },
  { title: 'WEEKEND REWARD', sub: 'UP TO 500 USDT', cta: 'GET NOW', to: '/promo-welcome', Icon: Gift, bg: 'linear-gradient(to bottom, #601a2d, #3a0f1c)' },
  { title: 'VIP EXCLUSIVE', sub: 'HIGHER REWARDS', cta: 'JOIN VIP', to: '/dashboard', Icon: Trophy, bg: 'linear-gradient(to bottom, #1a3a6e, #0e2548)' },
];

export default function ThimblesPromoBanners() {
  return (
    <div className="grid grid-cols-1 gap-2">
      {banners.map(({ title, sub, cta, to, Icon, bg }) => (
        <div
          key={title}
          className="rounded-xl p-3 flex items-center gap-3"
          style={{ background: bg, border: '2px solid #c5a059', boxShadow: '0 3px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,215,120,0.2)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.5)' }}
          >
            <Icon className="w-6 h-6" style={{ color: '#ffe8a0' }} />
          </div>
          <div className="flex-1 flex flex-col">
            <span className="text-xs font-black tracking-wider" style={{ color: '#ffe8a0' }}>{title}</span>
            <span className="text-[10px]" style={{ color: '#c5a059' }}>{sub}</span>
            <Link
              to={to}
              className="mt-1 inline-block self-start px-3 py-1 rounded-md text-[10px] font-black tracking-wider"
              style={{ background: 'linear-gradient(to bottom, #d4af37, #bf953f)', color: '#1a0f06' }}
            >
              {cta}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}