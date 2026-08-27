import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Sparkles, CalendarDays, CalendarRange, Clock } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';
import { reloadBalance } from '@/lib/useCasinoBalance';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/lib/LanguageContext';
import { hasTelegramBackButton } from '@/lib/telegram';
import BonusCard from '@/components/bonus/BonusCard';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

export default function Bonus() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [weeklyAt, setWeeklyAt] = useState(null);
  const [monthlyAt, setMonthlyAt] = useState(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      setWeeklyAt(me?.weekly_bonus_at || null);
      setMonthlyAt(me?.monthly_bonus_at || null);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const claim = async (kind) => {
    setBusy(kind);
    try {
      const { data, error } = await supabase.rpc('claim_periodic_bonus', { p_kind: kind });
      if (error) throw error;
      if (!data?.ok) {
        toast({ title: t('Not available yet'), description: t('Come back when the timer ends.') });
      } else {
        if (kind === 'weekly') setWeeklyAt(new Date().toISOString());
        else setMonthlyAt(new Date().toISOString());
        await reloadBalance();
        toast({ title: `+$${Number(data.amount).toFixed(2)} ${t('added to your balance')}` });
      }
    } catch (e) {
      toast({ title: t('Claim failed'), description: e?.message });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="relative min-h-screen pb-24 lg:pb-6" style={{ background: '#0D0D0D', fontFamily: SANS }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(120% 55% at 50% -10%, rgba(212,175,55,0.12), transparent 60%), radial-gradient(80% 50% at 100% 110%, rgba(212,175,55,0.06), transparent 60%), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/42da6c35a_file_00000000a918820b81da42fc2ddfcfda.png) center/cover no-repeat', backgroundAttachment: 'fixed' }} />

      <header className="sticky top-0 z-30" style={{ background: 'rgba(13,13,13,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(212,175,55,0.22)' }}>
        <div className="max-w-none mx-auto px-4 py-3 flex items-center gap-3 relative" style={hasTelegramBackButton() ? { paddingTop: 'calc(env(safe-area-inset-top) + 2.25rem)' } : undefined}>
          {!hasTelegramBackButton() && (
            <button onClick={() => window.history.back()} title={t('Back')}
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95"
              style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
            <Gift className="w-5 h-5" style={{ color: '#D4AF37' }} />
            <span className="text-lg font-extrabold tracking-tight" style={{ color: '#D4AF37' }}>{t('Bonus')}</span>
          </div>
          <div className="flex-1" />
        </div>
      </header>

      <main className="relative z-10 max-w-none mx-auto px-4 py-5 flex flex-col gap-4">
        <div className="text-center" style={{ animation: 'dashFadeIn 400ms ease both' }}>
          <h1 className="text-xl font-extrabold" style={{ color: '#fff' }}>{t('Claim Your Bonuses')}</h1>
          <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {t('Daily, weekly and monthly rewards — free every time.')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <BonusCard
            icon={Sparkles}
            title={t('Daily Bonus')}
            subtitle={t('Free spin · win up to $1000')}
            actionLabel={t('Spin Now')}
            onAction={() => navigate('/free-spin')}
          />
          <BonusCard
            icon={CalendarDays}
            title={t('Weekly Bonus')}
            subtitle={t('$0.10 every 7 days')}
            amount={0.10}
            lastClaimAt={weeklyAt}
            periodDays={7}
            busy={busy === 'weekly'}
            onAction={() => claim('weekly')}
            actionLabel={t('Claim $0.10')}
          />
          <BonusCard
            icon={CalendarRange}
            title={t('Monthly Bonus')}
            subtitle={t('$0.15 every 30 days')}
            amount={0.15}
            lastClaimAt={monthlyAt}
            periodDays={30}
            busy={busy === 'monthly'}
            onAction={() => claim('monthly')}
            actionLabel={t('Claim $0.15')}
          />
        </div>

        <p className="text-[11px] text-center flex items-center justify-center gap-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <Clock className="w-3 h-3" /> {t('Claimed bonuses are added straight to your balance.')}
        </p>
      </main>
    </div>
  );
}