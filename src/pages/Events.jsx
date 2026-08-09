import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

// Default placeholder banners shown when admin hasn't added any yet.
// Both display "Coming Soon" since they have no link.
const DEFAULT_BANNERS = [
  {
    id: 'giveaway',
    title: 'Giveaway',
    description: 'Join our weekly giveaway and stand a chance to win cash prizes, free spins, and exclusive rewards.',
    image_url: '',
    link: '',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 50%, #FF4500 100%)',
    glow: 'rgba(255,165,0,0.45)',
  },
  {
    id: 'tournament',
    title: 'Tournament',
    description: 'Compete against other players in our monthly tournament. Climb the leaderboard and win a share of the massive prize pool!',
    image_url: '',
    link: '',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
    glow: 'rgba(139,92,246,0.45)',
  },
];

function isExternal(url) {
  return /^https?:\/\//i.test(String(url || ''));
}

export default function Events() {
  const { t } = useLanguage();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    base44.entities.Banner.filter({ active: true }, 'order', 50)
      .then((rows) => {
        if (!active) return;
        // Admin-added banners (sorted by order). These may or may not have a link.
        const mapped = rows.map((r) => ({
          id: r.id,
          title: r.title || '',
          description: r.description || '',
          image_url: r.image_url || '',
          link: r.link || '',
          link_label: r.link_label || '',
          gradient: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
          glow: 'rgba(212,175,55,0.35)',
        }));
        setBanners(mapped);
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // While loading, show placeholders. Once loaded: if admin added banners,
  // show those; otherwise show the default Coming Soon placeholders.
  const list = (!loading && banners.length > 0) ? banners : DEFAULT_BANNERS;

  return (
    <div className="relative min-h-screen pb-24" style={{ background: '#0D0D0D', fontFamily: SANS }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(120% 55% at 50% -10%, rgba(212,175,55,0.12), transparent 60%), radial-gradient(80% 50% at 100% 110%, rgba(212,175,55,0.06), transparent 60%), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/42da6c35a_file_00000000a918820b81da42fc2ddfcfda.png) center/cover no-repeat', backgroundAttachment: 'fixed' }} />

      {/* Header */}
      <header
        className="sticky top-0 z-30"
        style={{ background: 'rgba(13,13,13,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(212,175,55,0.22)' }}
      >
        <div className="max-w-md lg:max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => window.history.back()} title={t("Back")}
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="flex-1 text-center flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: '#D4AF37' }} />
            <span className="text-lg font-extrabold tracking-tight" style={{ color: '#D4AF37' }}>{t("Events")}</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="relative z-10 max-w-md lg:max-w-7xl mx-auto px-4 py-5 flex flex-col gap-5">
        {/* Intro */}
        <div className="text-center py-2" style={{ animation: 'dashFadeIn 400ms ease both' }}>
          <h1 className="text-2xl font-extrabold" style={{ color: '#fff' }}>{t("Special Events")}</h1>
          <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {t("Join our exclusive events and win amazing prizes")}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#D4AF37' }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {list.map((ev, i) => {
              return (
                <div
                  key={ev.id}
                  className="relative overflow-hidden rounded-3xl transition-all active:scale-[0.99]"
                  style={{
                    background: ev.image_url
                      ? `url(${ev.image_url}) center/cover no-repeat`
                      : 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    boxShadow: `0 12px 40px ${ev.glow}, 0 4px 16px rgba(0,0,0,0.35)`,
                    border: '1px solid rgba(212,175,55,0.28)',
                    animation: 'dashFadeIn 500ms ease both',
                    animationDelay: (100 * i) + 'ms',
                    minHeight: '300px',
                  }}
                >
                  {/* Glass tint overlay — keeps the image visible through frosted glass */}
                  <div className="absolute inset-0" style={{ background: ev.image_url ? 'linear-gradient(135deg, rgba(13,13,13,0.18) 0%, rgba(13,13,13,0.05) 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)' }} />
                  {/* Decorative glow */}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.14), transparent 50%)' }} />

                  {/* Content — only "Coming Soon" centered, no game text */}
                  <div className="relative z-10 p-6 flex items-center justify-center" style={{ minHeight: '300px' }}>
                    <div className="flex items-center gap-2 text-2xl font-extrabold tracking-wide" style={{ color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
                      <Clock className="w-6 h-6" style={{ color: '#D4AF37' }} />
                      {t('Coming Soon')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <p className="text-[11px] text-center mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {t('Terms and conditions apply · 18+ Only · Gamble Responsibly')}
        </p>
      </main>
    </div>
  );
}