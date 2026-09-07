import React, { useState } from 'react';
import { Gift, Loader2 } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useUserBonus } from '@/lib/useUserBonus';
import { reloadBalance } from '@/lib/useCasinoBalance';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/lib/LanguageContext';

const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

// Opt-in deposit bonus. Nothing is credited and no turnover applies until the
// player presses Claim — the server (claim_deposit_bonus) does the crediting.
export default function DepositBonusOfferCard() {
  const { offer, loading, reload } = useUserBonus();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  if (loading || !offer) return null;

  const claim = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc('claim_deposit_bonus', { p_bonus_id: offer.id });
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

  return (
    <div className="dash-card p-4 flex flex-col gap-3"
      style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(52,211,153,0.4)' }}>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
          style={{ background: 'linear-gradient(135deg,#34d399,#059669)', boxShadow: '0 0 14px rgba(52,211,153,0.45)' }}>
          <Gift className="w-4 h-4" style={{ color: '#062018' }} />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: '#34d399' }}>{t('Bonus Available')}</span>
      </div>
      <div>
        <p className="text-[12px] text-white/60">{offer.campaign_name} · {t('on your')} {money(offer.deposit_amount)} {t('deposit')}</p>
        <p className="text-2xl font-extrabold tabular-nums text-white leading-tight">{money(offer.bonus_amount)}</p>
        <p className="text-[11px] text-white/50 mt-1">
          {t('Claiming adds a')} {money(offer.required_turnover)} {t('turnover requirement. Skip it and no restrictions apply.')}
        </p>
      </div>
      <button onClick={claim} disabled={busy}
        className="w-full py-3 text-sm rounded-2xl font-extrabold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-45"
        style={{ background: 'linear-gradient(135deg, #34d399, #059669)', color: '#062018', boxShadow: '0 4px 14px rgba(52,211,153,0.35)' }}>
        {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('Claiming...')}</> : `${t('Claim')} ${money(offer.bonus_amount)} ${t('Bonus')}`}
      </button>
    </div>
  );
}