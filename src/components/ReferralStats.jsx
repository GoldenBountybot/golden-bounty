import React, { useState, useEffect } from 'react';
import { Users, Trophy, Loader2, Coins, Crown, Medal, Gift } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import AnimatedNumber from '@/components/AnimatedNumber';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '');

const RANK_META = {
  1: { color: '#FFD700', bg: 'linear-gradient(135deg, rgba(255,215,0,0.22), rgba(255,215,0,0.06))', border: 'rgba(255,215,0,0.55)', icon: Crown },
  2: { color: '#C0C0C0', bg: 'linear-gradient(135deg, rgba(192,192,192,0.20), rgba(192,192,192,0.05))', border: 'rgba(192,192,192,0.5)', icon: Medal },
  3: { color: '#CD7F32', bg: 'linear-gradient(135deg, rgba(205,127,50,0.20), rgba(205,127,50,0.05))', border: 'rgba(205,127,50,0.5)', icon: Medal },
};

export default function ReferralStats({ profile, onBack }) {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await base44.functions.invoke('getReferralStats', {});
        if (!active) return;
        if (res?.data?.error) setError(res.data.error);
        else setData(res.data);
      } catch (e) {
        if (active) setError(e.message || 'Failed to load');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ animation: 'dashFadeIn 400ms ease both' }}>
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#D4AF37' }} />
        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{t("Loading referral stats...")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ animation: 'dashFadeIn 400ms ease both' }}>
        <p className="text-sm font-bold" style={{ color: '#f87171' }}>{t("Failed to load")}</p>
        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{error}</p>
        <button onClick={onBack} className="dash-btn-gold px-5 py-2 text-[12px]">{t("Back")}</button>
      </div>
    );
  }

  const { referrals = [], totalReferrals = 0, totalCommission = 0, ranking = [], myRank, myCount = 0, totalReferrers = 0 } = data || {};

  return (
    <div className="flex flex-col gap-4" style={{ animation: 'dashFadeIn 400ms ease both' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-bold" style={{ color: '#D4AF37' }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          {t("Back")}
        </button>
        <h3 className="text-sm font-bold" style={{ color: '#D4AF37' }}>{t("Referrals")}</h3>
        <div className="w-12" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="dash-card p-4 flex flex-col gap-1" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.35)' }}>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" style={{ color: '#D4AF37' }} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(212,175,55,0.8)' }}>{t("Total Invited")}</p>
          </div>
          <p className="text-2xl font-extrabold tabular-nums" style={{ color: '#fff' }}>
            <AnimatedNumber value={totalReferrals} duration={700} decimals={0} />
          </p>
        </div>
        <div className="dash-card p-4 flex flex-col gap-1" style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(52,211,153,0.35)' }}>
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4" style={{ color: '#34d399' }} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(52,211,153,0.85)' }}>{t("Total Commission")}</p>
          </div>
          <p className="text-2xl font-extrabold tabular-nums" style={{ color: '#fff' }}>
            $<AnimatedNumber value={totalCommission} duration={900} decimals={2} />
          </p>
        </div>
      </div>

      {/* My rank badge */}
      <div className="dash-card p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.4)' }}>
        <div className="flex items-center justify-center w-11 h-11 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #FFD700, #C89B3C)', boxShadow: '0 0 8px rgba(212,175,55,0.25)' }}>
          <Trophy className="w-5 h-5" style={{ color: '#1a1408' }} />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(212,175,55,0.85)' }}>{t("Your Rank")}</p>
          <p className="text-lg font-extrabold mt-0.5" style={{ color: myRank ? '#D4AF37' : 'rgba(255,255,255,0.5)' }}>
            {myRank ? `#${myRank} · ${myCount} ${t("invites")}` : t("No invites yet")}
          </p>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg shrink-0" style={{ color: 'rgba(212,175,55,0.85)', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)' }}>
          {totalReferrers} {t("referrers")}
        </span>
      </div>

      {/* Ranking leaderboard */}
      <div className="flex items-center gap-2 px-1">
        <Trophy className="w-4 h-4" style={{ color: '#D4AF37' }} />
        <h3 className="text-sm font-bold" style={{ color: '#D4AF37' }}>{t("Top Referrers")}</h3>
      </div>
      {ranking.length === 0 ? (
        <p className="text-[12px] px-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{t("No referrals yet. Share your promo code to climb the leaderboard.")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {ranking.map((r, i) => {
            const rank = i + 1;
            const meta = RANK_META[rank];
            const isMe = r.id === profile?.id;
            const Icon = meta?.icon || Trophy;
            return (
              <div key={r.id} className="dash-card p-3 flex items-center gap-3" style={meta ? { background: meta.bg, border: `1px solid ${meta.border}` } : isMe ? { border: '1px solid rgba(212,175,55,0.5)' } : undefined}>
                <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 font-extrabold text-sm" style={meta ? { background: 'rgba(255,255,255,0.06)', color: meta.color, border: `1px solid ${meta.border}` } : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  {meta ? <Icon className="w-4 h-4" /> : rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: isMe ? '#D4AF37' : '#fff' }}>
                    {r.username}{isMe ? ` · ${t("You")}` : ''}
                  </p>
                  <p className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>#{r.uid || '—'}</p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-sm font-extrabold tabular-nums" style={{ color: meta?.color || '#D4AF37' }}>{r.count}</span>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{t("invites")}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* My referrals list */}
      <div className="flex items-center gap-2 px-1 mt-2">
        <Users className="w-4 h-4" style={{ color: '#D4AF37' }} />
        <h3 className="text-sm font-bold" style={{ color: '#D4AF37' }}>{t("Your Invitations")}</h3>
      </div>
      {referrals.length === 0 ? (
        <p className="text-[12px] px-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{t("No one has joined with your promo code yet.")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {referrals.map((r) => (
            <div key={r.id} className="dash-card p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)' }}>
                <Users className="w-4 h-4" style={{ color: '#D4AF37' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: '#fff' }}>{r.username}</p>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  #{r.uid || '—'} · {t("Joined")} {fmtDate(r.joinedAt)}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {t("Deposits")}: <span className="font-bold tabular-nums" style={{ color: '#fff' }}>${r.totalDeposits.toFixed(2)}</span>
                </p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(52,211,153,0.85)' }}>{t("Commission")}</span>
                <span className="font-extrabold tabular-nums text-sm" style={{ color: '#34d399' }}>+${r.commission.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}