import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownToLine, ArrowUpFromLine, History, Gift, RotateCcw,
  Users, Sparkles, Headphones, ArrowRightLeft,
} from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/lib/LanguageContext';

// Slim native-style dropdown menu used by the Profile header.
export default function ProfileMenu({ open, onClose, onCashback }) {
  const { t } = useLanguage();
  if (!open) return null;

  const items = [
    { to: '/pay', label: t("Deposit"), Icon: ArrowDownToLine },
    { to: '/withdraw', label: t("Withdraw"), Icon: ArrowUpFromLine },
    { to: '/history', label: t("History"), Icon: History },
    { divider: true },
    { to: '/bonus', label: t("Bonus"), Icon: Gift },
    { onClick: onCashback, label: t("Cashback"), Icon: RotateCcw },
    { to: '/referrals', label: t("Referrals"), Icon: Users },
    { to: '/events', label: t("Events"), Icon: Sparkles },
    { divider: true },
    { to: '/live-support', label: t("Support 7/24"), Icon: Headphones },
    { to: '/migrate', label: t("Bind Old Account"), Icon: ArrowRightLeft },
  ];

  const rowClass = 'flex items-center gap-2.5 px-3 py-2 w-full text-left text-[13px] font-medium transition-colors duration-150 hover:bg-white/[0.06] active:bg-white/[0.09]';
  const rowStyle = { color: 'rgba(255,255,255,0.88)' };

  return (
    <div
      className="absolute left-4 top-14 z-40 w-[212px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl py-1 flex flex-col"
      style={{
        border: '1px solid rgba(212,175,55,0.25)',
        background: 'rgba(16,16,16,0.97)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: '0 18px 44px rgba(0,0,0,0.7)',
        animation: 'dashFadeIn 160ms ease both',
      }}
    >
      {items.map((item, i) => item.divider ? (
        <div key={`d${i}`} className="my-1" style={{ borderTop: '1px solid rgba(212,175,55,0.14)' }} />
      ) : item.to ? (
        <Link key={item.label} to={item.to} onClick={onClose} className={rowClass} style={rowStyle}>
          <item.Icon className="w-4 h-4 shrink-0" style={{ color: 'rgba(212,175,55,0.85)' }} />
          {item.label}
        </Link>
      ) : (
        <button key={item.label} onClick={item.onClick} className={rowClass} style={rowStyle}>
          <item.Icon className="w-4 h-4 shrink-0" style={{ color: 'rgba(212,175,55,0.85)' }} />
          {item.label}
        </button>
      ))}
      <div className="mt-1 pt-1 px-2" style={{ borderTop: '1px solid rgba(212,175,55,0.14)' }}>
        <LanguageSwitcher variant="compact" />
      </div>
    </div>
  );
}