import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownToLine, ArrowUpFromLine, History, Gift, RotateCcw,
  Users, Sparkles, Headphones, ArrowRightLeft, ChevronRight,
} from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/lib/LanguageContext';

// Professional grouped dropdown menu used by the Profile header.
export default function ProfileMenu({ open, onClose, onCashback }) {
  const { t } = useLanguage();
  if (!open) return null;

  const groups = [
    {
      title: t("Wallet"),
      items: [
        { to: '/pay', label: t("Deposit"), Icon: ArrowDownToLine, color: '#34d399' },
        { to: '/withdraw', label: t("Withdraw"), Icon: ArrowUpFromLine, color: '#f87171' },
        { to: '/history', label: t("History"), Icon: History, color: '#D4AF37' },
      ],
    },
    {
      title: t("Rewards"),
      items: [
        { to: '/bonus', label: t("Bonus"), Icon: Gift, color: '#D4AF37' },
        { onClick: onCashback, label: t("Cashback"), Icon: RotateCcw, color: '#34d399' },
        { to: '/referrals', label: t("Referrals"), Icon: Users, color: '#D4AF37' },
        { to: '/events', label: t("Events"), Icon: Sparkles, color: '#D4AF37' },
      ],
    },
    {
      title: t("Account"),
      items: [
        { to: '/live-support', label: t("Support 7/24"), Icon: Headphones, color: '#34d399' },
        { to: '/migrate', label: t("Bind Old Account"), Icon: ArrowRightLeft, color: '#D4AF37' },
      ],
    },
  ];

  const rowClass = 'group flex items-center gap-3 px-2.5 py-2 rounded-xl w-full text-left transition-colors duration-150 active:scale-[0.99] hover:bg-white/[0.05]';

  const Row = ({ item }) => (
    <>
      <div
        className="flex items-center justify-center w-8 h-8 rounded-[10px] shrink-0"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.18)' }}
      >
        <item.Icon className="w-[15px] h-[15px]" style={{ color: item.color }} />
      </div>
      <span className="flex-1 text-[13px] font-semibold tracking-tight" style={{ color: 'rgba(255,255,255,0.9)' }}>
        {item.label}
      </span>
      <ChevronRight
        className="w-4 h-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
        style={{ color: 'rgba(212,175,55,0.45)' }}
      />
    </>
  );

  return (
    <div
      className="absolute left-4 top-14 z-40 w-[272px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl p-2 flex flex-col"
      style={{
        border: '1px solid rgba(212,175,55,0.28)',
        background: 'rgba(12,12,12,0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
        animation: 'dashFadeIn 200ms ease both',
      }}
    >
      {groups.map((g, gi) => (
        <div key={g.title} className="flex flex-col">
          <p
            className="px-2.5 pt-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'rgba(212,175,55,0.65)' }}
          >
            {g.title}
          </p>
          {g.items.map(item => item.to ? (
            <Link key={item.label} to={item.to} onClick={onClose} className={rowClass}>
              <Row item={item} />
            </Link>
          ) : (
            <button key={item.label} onClick={item.onClick} className={rowClass}>
              <Row item={item} />
            </button>
          ))}
          {gi < groups.length - 1 && (
            <div className="mx-2.5 mt-2" style={{ borderTop: '1px solid rgba(212,175,55,0.12)' }} />
          )}
        </div>
      ))}
      <div className="mt-2 px-1 pt-2" style={{ borderTop: '1px solid rgba(212,175,55,0.12)' }}>
        <LanguageSwitcher variant="compact" />
      </div>
    </div>
  );
}