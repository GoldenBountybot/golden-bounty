import React from 'react';
import { Gift, Lock, CalendarClock, Info, History } from 'lucide-react';
import BackButton from '@/components/BackButton';
import WesternTitleBadge from '@/components/WesternTitleBadge';
import TurnoverProgressCard from '@/components/bonus/TurnoverProgressCard';
import { useUserBonus } from '@/lib/useUserBonus';

const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;
const day = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

function contributionList(campaign) {
  const gc = campaign?.game_contributions || {};
  const rows = Object.entries(gc).map(([k, v]) => [k === '*' ? 'All other games' : k, `${Number(v) || 0}%`]);
  (campaign?.excluded_games || []).forEach((g) => rows.push([g, 'Not eligible']));
  return rows;
}

export default function BonusTurnover() {
  const { bonus, campaign, bonusBalance, history, loading } = useUserBonus();

  return (
    <div className="relative min-h-screen pb-24" style={{ background: '#0D0D0D' }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(120% 55% at 50% -10%, rgba(212,175,55,0.12), transparent 60%), radial-gradient(80% 50% at 100% 110%, rgba(212,175,55,0.06), transparent 60%), url(https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/42da6c35a_file_00000000a918820b81da42fc2ddfcfda.png) center/cover no-repeat', backgroundAttachment: 'fixed' }} />
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(10,9,8,0.78)', borderBottom: '1px solid rgba(214,178,98,0.22)' }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <BackButton />
          <div className="flex-1 flex items-center justify-center gap-2">
            <Gift className="w-4 h-4 text-amber-300" />
            <WesternTitleBadge size="lg">Bonus &amp; Turnover</WesternTitleBadge>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 py-5 flex flex-col gap-4 max-w-xl mx-auto">
        {loading && <p className="text-center text-white/50 text-sm py-10">Loading…</p>}

        {!loading && !bonus && (
          <div className="dash-card p-6 text-center flex flex-col gap-2">
            <Gift className="w-8 h-8 text-amber-300/70 mx-auto" />
            <p className="text-white font-bold">No active bonus</p>
            <p className="text-white/50 text-sm">Make a qualifying deposit to receive an active deposit bonus.</p>
          </div>
        )}

        {!loading && bonus && (
          <>
            <div className="dash-card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Active Bonus</p>
                  <p className="text-base font-black text-amber-100">{bonus.campaign_name || 'Deposit Bonus'}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
                  style={{ background: 'rgba(245,197,66,0.16)', color: '#f5c542', border: '1px solid rgba(245,197,66,0.4)' }}>
                  {bonus.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-[9px] uppercase tracking-widest text-white/45">Deposit</p>
                  <p className="text-sm font-black tabular-nums text-white">{money(bonus.deposit_amount)}</p>
                </div>
                <div className="rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-[9px] uppercase tracking-widest text-white/45">Bonus</p>
                  <p className="text-sm font-black tabular-nums text-amber-200">{money(bonus.bonus_amount)}</p>
                </div>
                <div className="rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-[9px] uppercase tracking-widest text-white/45">Source</p>
                  <p className="text-sm font-black capitalize text-white">{bonus.deposit_source}</p>
                </div>
              </div>
            </div>

            <TurnoverProgressCard required={bonus.required_turnover} completed={bonus.completed_turnover} />

            <div className="dash-card p-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-300" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200/80">Locked Bonus Funds</span>
              </div>
              <p className="text-lg font-black tabular-nums text-white">{money(bonusBalance)}</p>
              <p className="text-white/50 text-xs">
                Bonus funds can only be used for eligible casino games and to complete your turnover.
                They cannot be stacked, transferred or withdrawn until the wagering requirement is completed.
              </p>
            </div>

            <div className="dash-card p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-amber-300" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200/80">Deadlines</span>
              </div>
              <div className="flex justify-between text-sm"><span className="text-white/50">Bonus expires</span><span className="text-white font-bold">{day(bonus.expires_at)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/50">Wagering deadline</span><span className="text-white font-bold">{day(bonus.wager_deadline)}</span></div>
            </div>

            {campaign && (
              <div className="dash-card p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-300" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200/80">Eligible Games</span>
                </div>
                {contributionList(campaign).map(([g, v]) => (
                  <div key={g} className="flex justify-between text-sm">
                    <span className="text-white/60">{g}</span>
                    <span className="text-amber-100 font-bold">{v}</span>
                  </div>
                ))}
                {campaign.description && <p className="text-white/45 text-xs pt-1">{campaign.description}</p>}
              </div>
            )}
          </>
        )}

        {!loading && history.length > 0 && (
          <div className="dash-card p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-300" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200/80">Bonus History</span>
            </div>
            {history.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div>
                  <p className="text-sm text-white font-bold">{b.campaign_name || 'Bonus'}</p>
                  <p className="text-[10px] text-white/40 capitalize">{b.deposit_source} · {day(b.granted_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black tabular-nums text-amber-200">{money(b.bonus_amount)}</p>
                  <p className="text-[10px] text-white/40 capitalize">{b.status} · {money(b.completed_turnover)}/{money(b.required_turnover)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}