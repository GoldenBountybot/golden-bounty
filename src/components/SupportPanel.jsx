import React from 'react';
import { MessageCircle, Send, Mail, Clock } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

const CHANNELS = [
  {
    label: 'WhatsApp',
    sub: 'Message Golden Bounty on WhatsApp',
    href: 'https://wa.me/966576757138',
    icon: MessageCircle,
    color: '#25D366',
    bg: 'rgba(37,211,102,0.12)',
    border: 'rgba(37,211,102,0.4)',
  },
  {
    label: 'Telegram',
    sub: 't.me/golden_bounty_tg',
    href: 'https://t.me/golden_bounty_tg',
    icon: Send,
    color: '#229ED9',
    bg: 'rgba(34,158,217,0.12)',
    border: 'rgba(34,158,217,0.4)',
  },
  {
    label: 'Email',
    sub: 'goldenbountysupport@gmail.com',
    href: 'mailto:goldenbountysupport@gmail.com',
    icon: Mail,
    color: '#D4AF37',
    bg: 'rgba(212,175,55,0.12)',
    border: 'rgba(212,175,55,0.4)',
  },
];

export default function SupportPanel() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-4" style={{ animation: 'dashFadeIn 400ms ease both', fontFamily: SANS }}>
      {/* Heading */}
      <div className="dash-card p-5 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.35)' }}>
        <div className="flex items-center justify-center w-11 h-11 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #FFD700, #C89B3C)', boxShadow: '0 0 8px rgba(212,175,55,0.25)' }}>
          <Clock className="w-5 h-5" style={{ color: '#1a1408' }} />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(212,175,55,0.85)' }}>{t("Support")}</p>
          <p className="text-lg font-extrabold mt-0.5" style={{ color: '#fff' }}>{t("Support 7/24 hours")}</p>
        </div>
      </div>

      {/* Channel cards */}
      {CHANNELS.map((c) => {
        const Icon = c.icon;
        return (
          <a
            key={c.label}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            className="dash-card p-4 flex items-center gap-3 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
              <Icon className="w-5 h-5" style={{ color: c.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: '#fff' }}>{c.label}</p>
              <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{c.sub}</p>
            </div>
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(212,175,55,0.6)' }}><path d="M9 18l6-6-6-6" /></svg>
          </a>
        );
      })}

      <p className="text-[11px] px-1 text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {t("Our support team is available 24/7 to help you with any question.")}
      </p>
    </div>
  );
}