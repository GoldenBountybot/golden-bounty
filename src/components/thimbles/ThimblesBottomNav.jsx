import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Gamepad2, Wallet, Crown, Gift, Award, User } from 'lucide-react';

const items = [
  { to: '/', label: 'HOME', Icon: Home },
  { to: '/dashboard', label: 'GAMES', Icon: Gamepad2 },
  { to: '/dashboard', label: 'WALLET', Icon: Wallet },
  { to: '/pay', label: 'DEPOSIT', Icon: Crown, highlight: true },
  { to: '/promo-welcome', label: 'BONUS', Icon: Gift },
  { to: '/dashboard', label: 'VIP', Icon: Award },
  { to: '/profile', label: 'PROFILE', Icon: User },
];

export default function ThimblesBottomNav() {
  return (
    <nav
      className="rounded-xl py-2 px-1 flex items-center justify-between"
      style={{
        background: 'linear-gradient(to bottom, #2a1a0d, #1a0f06)',
        border: '1px solid rgba(197,160,89,0.5)',
        boxShadow: '0 3px 10px rgba(0,0,0,0.5)',
      }}
    >
      {items.map(({ to, label, Icon, highlight }) => (
        <Link
          key={label}
          to={to}
          className="flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg transition-transform active:scale-95"
          style={
            highlight
              ? { background: 'linear-gradient(to bottom, #4b2d16, #2a1a0d)', border: '1px solid #d4af37', boxShadow: '0 0 10px rgba(212,175,55,0.4)' }
              : {}
          }
        >
          <Icon className="w-4 h-4" style={{ color: highlight ? '#ffe8a0' : '#c5a059' }} />
          <span className="text-[8px] font-bold tracking-wider" style={{ color: highlight ? '#ffe8a0' : '#a09080' }}>{label}</span>
        </Link>
      ))}
    </nav>
  );
}