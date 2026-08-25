import React, { useState } from 'react';
import { Copy, Check, Send, Link2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const BOT_USERNAME = 'GoldenBountybot';

// Every player's referral link is built from their own Telegram id — the same
// link the bot's /refer command sends them.
export default function ReferralLinkCard({ telegramId }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  if (!telegramId) return null;

  const link = `https://t.me/${BOT_USERNAME}?start=ref_${telegramId}`;
  const share = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(
    'Join me on Golden Bounty and get a $1 bonus straight into your Stack! 🎰',
  )}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="dash-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4" style={{ color: '#D4AF37' }} />
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'rgba(212,175,55,0.85)' }}>
          {t('Your Referral Link')}
        </p>
      </div>

      <p className="text-[11px] font-mono break-all px-3 py-2.5 rounded-xl"
        style={{ color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.25)' }}>
        {link}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={copy} className="dash-btn-gold py-2.5 text-[12px] flex items-center justify-center gap-1.5">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? t('Copied') : t('Copy Link')}
        </button>
        <a href={share} target="_blank" rel="noreferrer"
          className="py-2.5 rounded-[14px] text-[12px] font-bold flex items-center justify-center gap-1.5"
          style={{ border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37', background: 'rgba(255,255,255,0.03)' }}>
          <Send className="w-4 h-4" /> {t('Share')}
        </a>
      </div>

      <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {t('Friends who join with your link get $1 in their Stack instantly, and you earn 5% commission on all their deposits.')}
      </p>
    </div>
  );
}