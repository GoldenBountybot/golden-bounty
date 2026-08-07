import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, Trophy, Sparkles, ArrowLeft, Calendar, Users, DollarSign, Clock } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

export default function Events() {
  const { t } = useLanguage();

  const events = [
    {
      id: 'giveaway',
      title: t('Giveaway'),
      subtitle: t('Win big prizes'),
      desc: t('Join our weekly giveaway and stand a chance to win cash prizes, free spins, and exclusive rewards. The more you play, the higher your chances!'),
      icon: Gift,
      gradient: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 50%, #FF4500 100%)',
      glow: 'rgba(255,165,0,0.45)',
      badge: t('LIVE NOW'),
      stats: [
        { icon: DollarSign, label: t('Prize Pool'), value: '$10,000' },
        { icon: Users, label: t('Participants'), value: '1,284' },
        { icon: Clock, label: t('Ends In'), value: '3d 14h' },
      ],
    },
    {
      id: 'tournament',
      title: t('Tournament'),
      subtitle: t('Climb the leaderboard'),
      desc: t('Compete against other players in our monthly tournament. Climb the leaderboard by playing your favorite games and win a share of the massive prize pool!'),
      icon: Trophy,
      gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
      glow: 'rgba(139,92,246,0.45)',
      badge: t('STARTING SOON'),
      stats: [
        { icon: DollarSign, label: t('Prize Pool'), value: '$50,000' },
        { icon: Users, label: t('Players'), value: '856' },
        { icon: Calendar, label: t('Starts'), value: 'Aug 15' },
      ],
    },
  ];

  return (
    <div className="relative min-h-screen pb-24" style={{ background: '#0D0D0D', fontFamily: SANS }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(120% 55% at 50% -10%, rgba(212,175,55,0.12), transparent 60%), radial-gradient(80% 50% at 100% 110%, rgba(212,175,55,0.06), transparent 60%), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/42da6c35a_file_00000000a918820b81da42fc2ddfcfda.png) center/cover no-repeat', backgroundAttachment: 'fixed' }} />

      {/* Header */}
      <header
        className="sticky top-0 z-30"
        style={{ background: 'rgba(13,13,13,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(212,175,55,0.22)' }}
      >
        <div className="max-w-md lg:max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
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

      <main className="relative z-10 max-w-md lg:max-w-5xl mx-auto px-4 py-5 flex flex-col gap-5">
        {/* Intro */}
        <div className="text-center py-2" style={{ animation: 'dashFadeIn 400ms ease both' }}>
          <h1 className="text-2xl font-extrabold" style={{ color: '#fff' }}>{t("Special Events")}</h1>
          <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {t("Join our exclusive events and win amazing prizes")}
          </p>
        </div>

        {/* Event banners */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {events.map((ev, i) => {
            const Icon = ev.icon;
            return (
              <div
                key={ev.id}
                className="relative overflow-hidden rounded-3xl transition-all active:scale-[0.99]"
                style={{
                  background: ev.gradient,
                  boxShadow: `0 12px 40px ${ev.glow}, 0 4px 16px rgba(0,0,0,0.4)`,
                  animation: 'dashFadeIn 500ms ease both',
                  animationDelay: (100 * i) + 'ms',
                  minHeight: '320px',
                }}
              >
                {/* Decorative glow overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.25), transparent 50%)' }} />

                {/* Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-[0.15em] uppercase"
                    style={{ background: 'rgba(0,0,0,0.35)', color: '#fff', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                    {ev.badge}
                  </span>
                </div>

                {/* Content */}
                <div className="relative z-10 p-6 flex flex-col h-full" style={{ minHeight: '320px' }}>
                  {/* Icon + Title */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl shrink-0"
                      style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.35)' }}>
                      <Icon className="w-7 h-7" style={{ color: '#fff' }} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold" style={{ color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{ev.title}</h2>
                      <p className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{ev.subtitle}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[13px] leading-relaxed mb-4 flex-1" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 4px rgba(0,0,0,0.25)' }}>
                    {ev.desc}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {ev.stats.map((s, si) => {
                      const SIcon = s.icon;
                      return (
                        <div key={si} className="rounded-2xl px-2.5 py-2 flex flex-col items-center gap-0.5 text-center"
                          style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                          <SIcon className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.8)' }} />
                          <span className="text-[13px] font-extrabold tabular-nums" style={{ color: '#fff' }}>{s.value}</span>
                          <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA button */}
                  <button
                    className="w-full h-12 rounded-2xl font-extrabold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                    style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}
                  >
                    {t('Join Now')} <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-[11px] text-center mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {t('Terms and conditions apply · 18+ Only · Gamble Responsibly')}
        </p>
      </main>
    </div>
  );
}