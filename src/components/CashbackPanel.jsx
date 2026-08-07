import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, RotateCcw, Gift, TrendingDown, Wallet } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useLanguage } from '@/lib/LanguageContext';
import AnimatedNumber from '@/components/AnimatedNumber';

const CASHBACK_RATE = 0.03; // 3%

const GAME_NAMES = {
  'wild-bounty': 'Wild Bounty',
  'lucky-wheel': 'Lucky Wheel',
  'hi-lo': 'High or Low',
  plinko: 'Plinko',
  mines: 'Mines',
  fullhouse: 'Super ACE',
  'rocket-crash': 'Rocket Crash',
  'gates-of-olympus': 'Gates of Olympus',
  'crown-coins': 'Crown Coins',
  'big-brown': 'Big Brown',
  'argonauts': 'Argonauts',
  'thimbles': 'Thimbles',
};

export default function CashbackPanel({ profile, onBack }) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { addRealBalance } = useCasinoBalance();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [activities, setActivities] = useState([]);
  const [claimedLoss, setClaimedLoss] = useState(0);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const rows = await base44.entities.PlayerActivity.filter({ user_id: profile.id }, '-created_date', 1000);
      setActivities(rows);
      setClaimedLoss(Number(profile.cashback_claimed_loss ?? 0));
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  // Net loss per activity = bet - win (only positive values count as losses)
  const totalLoss = activities.reduce((sum, a) => {
    const net = (Number(a.bet) || 0) - (Number(a.win) || 0);
    return sum + (net > 0 ? net : 0);
  }, 0);

  const unclaimedLoss = Math.max(0, totalLoss - claimedLoss);
  const cashbackAmount = Math.round(unclaimedLoss * CASHBACK_RATE * 100) / 100;

  // Recent loss activities (for display)
  const lossActivities = activities
    .filter(a => (Number(a.bet) || 0) - (Number(a.win) || 0) > 0)
    .slice(0, 20);

  const claim = async () => {
    if (cashbackAmount <= 0 || claiming) return;
    setClaiming(true);
    try {
      // 1. Credit the real wallet
      addRealBalance(cashbackAmount);
      // 2. Record as a bonus transaction
      await base44.entities.Transaction.create({
        user_id: profile.id,
        user_email: profile.email || '',
        type: 'bonus',
        amount: cashbackAmount,
        status: 'completed',
        method: 'cashback',
        note: `3% Cashback on $${unclaimedLoss.toFixed(2)} losses`,
      });
      // 3. Mark claimed loss so it can't be double-claimed
      const newClaimed = claimedLoss + unclaimedLoss;
      await base44.auth.updateMe({ cashback_claimed_loss: newClaimed });
      setClaimedLoss(newClaimed);
      // 4. Create a notification so it shows in the Notifications list
      try {
        await base44.entities.UserNotification.create({
          user_id: profile.id,
          type: 'cashback_claimed',
          title: t('Cashback claimed!'),
          body: `$${cashbackAmount.toFixed(2)} ${t('added to your wallet')}`,
          amount: cashbackAmount,
          link: '/profile',
        });
      } catch { /* notification is best-effort */ }
      toast({ title: t('Cashback claimed!'), description: `$${cashbackAmount.toFixed(2)} ${t('added to your wallet')}` });
    } catch (e) {
      toast({ title: t('Claim failed'), description: e.message });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="flex flex-col gap-4" style={{ animation: 'dashFadeIn 400ms ease both' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-bold" style={{ color: '#D4AF37' }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          {t('Back')}
        </button>
        <h3 className="text-sm font-bold" style={{ color: '#D4AF37' }}>{t('Cashback')}</h3>
        <div className="w-12" />
      </div>

      {/* Cashback summary card */}
      <div className="dash-card p-5 flex flex-col items-center gap-3" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.35)' }}>
        <div className="flex items-center justify-center w-14 h-14 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #FFD700, #C89B3C)', boxShadow: '0 0 12px rgba(212,175,55,0.4)' }}>
          <Gift className="w-7 h-7" style={{ color: '#1a1408' }} />
        </div>
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(212,175,55,0.85)' }}>{t('Available Cashback')}</p>
          <p className="text-4xl font-extrabold tabular-nums mt-1" style={{ color: cashbackAmount > 0 ? '#34d399' : 'rgba(255,255,255,0.4)' }}>
            $<AnimatedNumber value={cashbackAmount} duration={800} decimals={2} />
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {t('3% of your net game losses')}
          </p>
        </div>

        {cashbackAmount > 0 && (
          <button
            onClick={claim}
            disabled={claiming}
            className="dash-btn-gold w-full py-3 text-sm flex items-center justify-center gap-2"
          >
            {claiming ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('Claiming...')}</> : <><Wallet className="w-4 h-4" /> {t('Claim Cashback')}</>}
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="dash-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4" style={{ color: '#f87171' }} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(212,175,55,0.8)' }}>{t('Total Losses')}</p>
          </div>
          <p className="text-lg font-bold tabular-nums" style={{ color: '#fff' }}>
            {loading ? '...' : `$${totalLoss.toFixed(2)}`}
          </p>
        </div>
        <div className="dash-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4" style={{ color: '#34d399' }} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(212,175,55,0.8)' }}>{t('Already Claimed')}</p>
          </div>
          <p className="text-lg font-bold tabular-nums" style={{ color: 'rgba(255,255,255,0.7)' }}>
            ${(claimedLoss * CASHBACK_RATE).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Recent losses */}
      <div className="flex items-center gap-2 px-1">
        <TrendingDown className="w-4 h-4" style={{ color: '#f87171' }} />
        <h3 className="text-sm font-bold" style={{ color: '#D4AF37' }}>{t('Recent Losses')}</h3>
      </div>

      {loading ? (
        <p className="text-[12px] px-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{t('Loading...')}</p>
      ) : lossActivities.length === 0 ? (
        <p className="text-[12px] px-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{t('No losses yet. Play games to earn cashback!')}</p>
      ) : (
        lossActivities.map((a) => {
          const loss = (Number(a.bet) || 0) - (Number(a.win) || 0);
          return (
            <div key={a.id} className="dash-card p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.35)' }}>
                <TrendingDown className="w-4 h-4" style={{ color: '#f87171' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: '#fff' }}>{t(GAME_NAMES[a.game_id] || a.game_id)}</p>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{t('Bet')} ${Number(a.bet).toFixed(2)}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="font-bold tabular-nums text-sm" style={{ color: '#f87171' }}>-${loss.toFixed(2)}</span>
                <span className="text-[10px] font-bold" style={{ color: '#34d399' }}>+${(loss * CASHBACK_RATE).toFixed(2)}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}