import React from 'react';
import { Loader2, Check } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const DAY = 24 * 60 * 60 * 1000;

// One bonus tile: icon, title, subtitle and an action button. When
// lastClaimAt + periodDays hasn't elapsed yet the button shows the remaining
// wait time instead of the claim label.
export default function BonusCard({ icon: Icon, title, subtitle, actionLabel, onAction, busy, lastClaimAt, periodDays, image }) {
  const { t } = useLanguage();
  const nextAt = lastClaimAt && periodDays ? new Date(lastClaimAt).getTime() + periodDays * DAY : 0;
  const waiting = nextAt > Date.now();
  const remaining = waiting ? nextAt - Date.now() : 0;
  const days = Math.floor(remaining / DAY);
  const hours = Math.floor((remaining % DAY) / (60 * 60 * 1000));
  const waitLabel = days > 0 ? `${days}d ${hours}h` : `${hours}h`;

  return (
    <div className="dash-card p-5 flex flex-col gap-3" style={{ animation: 'dashFadeIn 400ms ease both' }}>
      {image && (
        <img
          src={image}
          alt={title}
          draggable={false}
          className="block w-full h-auto rounded-xl"
          style={{ border: '1px solid rgba(212,175,55,0.35)', boxShadow: '0 6px 20px rgba(0,0,0,0.5)' }}
        />
      )}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-11 h-11 rounded-2xl shrink-0" style={{ background: 'linear-gradient(135deg,#FFD700,#C89B3C)', boxShadow: '0 0 14px rgba(212,175,55,0.4)' }}>
          <Icon className="w-5 h-5" style={{ color: '#1a1408' }} />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-bold" style={{ color: '#fff' }}>{title}</p>
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{subtitle}</p>
        </div>
      </div>

      <button
        onClick={onAction}
        disabled={busy || waiting}
        className="dash-btn-gold w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-45"
      >
        {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('Claiming...')}</>
          : waiting ? <><Check className="w-4 h-4" /> {t('Next in')} {waitLabel}</>
          : actionLabel}
      </button>
    </div>
  );
}