import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Gift, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { useUserBonus } from '@/lib/useUserBonus';
import { reloadBalance } from '@/lib/useCasinoBalance';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/lib/LanguageContext';
import { hasTelegramBackButton } from '@/lib/telegram';
import { formatDateTime } from '@/lib/dateFormat';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";
const PROVIDER_LABELS = { pgsoft: 'PG SOFT', endorphina: 'Endorphina', jili: 'JILI', wg: 'WG', '*': 'All games' };
const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

const depositLabel = (c) => {
  const from = Number(c.deposit_from) || 0;
  const to = Number(c.deposit_to) || 0;
  if (!from && !to) return 'Any deposit';
  if (to && to === from) return `Deposit #${from}`;
  if (to) return `Deposit #${from || 1}–${to}`;
  return `Deposit #${from || 1}+`;
};

function Row({ k, v }) {
  return (
    <div className="flex justify-between py-2 text-sm border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <span className="text-white/50">{k}</span>
      <span className="text-white font-bold text-right">{v}</span>
    </div>
  );
}

export default function BonusOffer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { bonus, offer, loading, reload } = useUserBonus();
  const [campaign, setCampaign] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    base44.entities.BonusCampaign.filter({ id }, '-created_date', 1)
      .then((r) => setCampaign(r?.[0] || null))
      .catch(() => {});
  }, [id]);

  const myOffer = offer && (!offer.campaign_id || offer.campaign_id === id) ? offer : null;
  const myBonus = bonus && (!bonus.campaign_id || bonus.campaign_id === id) ? bonus : null;

  const claim = async () => {
    if (!myOffer) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc('claim_deposit_bonus', { p_bonus_id: myOffer.id });
      if (error) throw error;
      if (!data?.ok) {
        toast({ title: t('Bonus not available'), description: t('This offer has expired or another bonus is already active.') });
      } else {
        await reloadBalance();
        toast({ title: `+${money(data.bonus)} ${t('bonus credited')}`, description: `${t('Turnover required')}: ${money(data.required_turnover)}` });
      }
      await reload();
    } catch (e) {
      toast({ title: t('Claim failed'), description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const req = Number(myBonus?.required_turnover) || 0;
  const done = Math.min(Number(myBonus?.completed_turnover) || 0, req);
  const pct = req > 0 ? Math.min(100, (done / req) * 100) : 0;
  const contributions = Object.entries(campaign?.game_contributions || {});

  return (
    <div className="relative min-h-screen pb-24" style={{ background: '#0D0D0D', fontFamily: SANS }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(120% 55% at 50% -10%, rgba(212,175,55,0.12), transparent 60%), radial-gradient(80% 50% at 100% 110%, rgba(212,175,55,0.06), transparent 60%), url(https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/42da6c35a_file_00000000a918820b81da42fc2ddfcfda.png) center/cover no-repeat', backgroundAttachment: 'fixed' }} />

      <header className="sticky top-0 z-30" style={{ background: 'rgba(13,13,13,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(212,175,55,0.22)' }}>
        <div className="px-4 py-3 flex items-center gap-3 relative" style={hasTelegramBackButton() ? { paddingTop: 'calc(env(safe-area-inset-top) + 2.25rem)' } : undefined}>
          {!hasTelegramBackButton() && (
            <button onClick={() => navigate(-1)} title={t('Back')}
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95"
              style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
            <Gift className="w-5 h-5" style={{ color: '#D4AF37' }} />
            <span className="text-lg font-extrabold tracking-tight" style={{ color: '#D4AF37' }}>{t('Bonus Details')}</span>
          </div>
          <div className="flex-1" />
        </div>
      </header>

      <main className="relative z-10 px-4 py-5 flex flex-col gap-4 max-w-xl mx-auto">
        {!campaign ? (
          <p className="text-sm text-white/50">{t('Loading...')}</p>
        ) : (
          <>
            <div className="dash-card p-5" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.4)' }}>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">{t('Deposit Bonus')}</p>
              <p className="text-xl font-black text-amber-100 mt-0.5">{campaign.name}</p>
              <p className="text-4xl font-black mt-2" style={{ color: '#f5c542' }}>{Number(campaign.percent) || 0}%</p>
              <p className="text-[12px] text-white/50 mt-1">{depositLabel(campaign)} · {t('Max bonus')} {money(campaign.max_bonus)}</p>
              {campaign.description && <p className="text-xs text-white/50 mt-2">{campaign.description}</p>}
            </div>

            {/* Claimed → live turnover status */}
            {myBonus && (
              <div className="dash-card p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" style={{ color: '#34d399' }} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: '#34d399' }}>{t('Bonus Active')}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{t('Bonus Amount')}</p>
                    <p className="text-lg font-extrabold tabular-nums text-white">{money(myBonus.bonus_amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{t('Turnover')}</p>
                    <p className="text-lg font-extrabold tabular-nums text-white">{money(done)} <span className="text-white/40 text-sm">/ {money(req)}</span></p>
                  </div>
                </div>
                <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#FFD700,#C89B3C)', boxShadow: '0 0 12px rgba(245,197,66,0.5)' }} />
                </div>
                <p className="text-[11px] font-bold" style={{ color: '#D4AF37' }}>{pct.toFixed(0)}% {t('Completed')}</p>
                {myBonus.wager_deadline_at && (
                  <p className="text-[11px] text-white/45 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> {t('Wagering deadline')}: {formatDateTime(myBonus.wager_deadline_at)}
                  </p>
                )}
                <button onClick={() => navigate('/bonus-turnover')}
                  className="w-full py-3 text-sm rounded-2xl font-extrabold transition-all active:scale-95"
                  style={{ border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}>
                  {t('View Full Turnover Report')}
                </button>
              </div>
            )}

            {/* Unclaimed offer → opt-in */}
            {!myBonus && myOffer && (
              <div className="dash-card p-5 flex flex-col gap-3" style={{ border: '1px solid rgba(52,211,153,0.4)' }}>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: '#34d399' }}>{t('Bonus Available')}</span>
                <div>
                  <p className="text-[12px] text-white/60">{t('on your')} {money(myOffer.deposit_amount)} {t('deposit')}</p>
                  <p className="text-2xl font-extrabold tabular-nums text-white leading-tight">{money(myOffer.bonus_amount)}</p>
                  <p className="text-[11px] text-white/50 mt-1">
                    {t('Claiming adds a')} {money(myOffer.required_turnover)} {t('turnover requirement. Skip it and no restrictions apply.')}
                  </p>
                </div>
                {myOffer.expires_at && (
                  <p className="text-[11px] text-white/45 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> {t('Offer expires')}: {formatDateTime(myOffer.expires_at)}
                  </p>
                )}
                <button onClick={claim} disabled={busy || loading}
                  className="w-full py-3 text-sm rounded-2xl font-extrabold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-45"
                  style={{ background: 'linear-gradient(135deg, #34d399, #059669)', color: '#062018', boxShadow: '0 4px 14px rgba(52,211,153,0.35)' }}>
                  {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('Claiming...')}</> : `${t('Claim')} ${money(myOffer.bonus_amount)} ${t('Bonus')}`}
                </button>
              </div>
            )}

            {/* No offer / not claimed → how to get it */}
            {!myBonus && !myOffer && !loading && (
              <div className="dash-card p-5 flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(212,175,55,0.85)' }}>{t('How To Get This Bonus')}</span>
                <p className="text-[12px] text-white/55">
                  {t('Make a qualifying deposit')} ({depositLabel(campaign)}, {t('min')} {money(campaign.min_deposit)}). {t('The offer then appears here and on your wallet — claiming is optional.')}
                </p>
                <p className="text-[11px] text-white/40 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {t('Claim window')}: {Number(campaign.expiry_days) || 0} {t('days')} · {t('wagering deadline')} {Number(campaign.wager_deadline_days) || 0} {t('days')}
                </p>
              </div>
            )}

            <div className="dash-card p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200/80 mb-2">{t('Terms')}</p>
              <Row k={t('Bonus')} v={`${Number(campaign.percent) || 0}% ${t('of deposit')}`} />
              <Row k={t('Applies to')} v={depositLabel(campaign)} />
              <Row k={t('Min deposit')} v={money(campaign.min_deposit)} />
              {Number(campaign.max_deposit) ? <Row k={t('Max deposit')} v={money(campaign.max_deposit)} /> : null}
              <Row k={t('Max bonus')} v={money(campaign.max_bonus)} />
              {myBonus ? <Row k={t('Turnover requirement')} v={money(req)} /> : null}
              <Row k={t('Bonus expires in')} v={`${Number(campaign.expiry_days) || 0} ${t('days')}`} />
              <Row k={t('Wagering deadline')} v={`${Number(campaign.wager_deadline_days) || 0} ${t('days')}`} />
            </div>

            <div className="dash-card p-5 flex flex-col gap-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200/80">{t('Eligible Games (turnover)')}</p>
              {contributions.map(([g, v]) => (
                <div key={g} className="flex justify-between text-sm">
                  <span className="text-white/60">{PROVIDER_LABELS[g] || g}</span>
                  <span className="text-amber-100 font-bold">{Number(v) || 0}%</span>
                </div>
              ))}
              {(campaign.excluded_games || []).length > 0 && (
                <p className="text-[11px] text-white/40 pt-1">{t('Not eligible')}: {(campaign.excluded_games || []).join(', ')}</p>
              )}
            </div>

            <p className="text-[11px] text-white/40">
              {t('Bonus funds cannot be stacked, transferred or withdrawn until the full turnover is completed.')}
            </p>
          </>
        )}
      </main>
    </div>
  );
}