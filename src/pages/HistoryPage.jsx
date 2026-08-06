import React, { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Trophy, TrendingDown, History as HistoryIcon, Wallet } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BackButton from '@/components/BackButton';
import AnimatedNumber from '@/components/AnimatedNumber';
import { useLanguage } from '@/lib/LanguageContext';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

const GAME_LABELS = {
  'wild-bounty': 'Wild Bounty',
  'hi-lo': 'High or Low',
  'plinko': 'Plinko',
  'mines': 'Mines',
  'fullhouse': 'Super ACE',
  'rocket-crash': 'Rocket Crash',
  'crown-coins': 'Crown Coins',
  'big-brown': 'Big Brown',
  'argonauts': 'Argonauts',
  'gates-of-olympus': 'Gates of Olympus',
  'thimbles': 'Thimbles',
  'free-spin': 'Lucky Wheel',
};

const OUTCOME_META = {
  win:  { color: '#34d399', bg: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.4)', label: 'Win' },
  loss: { color: '#f87171', bg: 'rgba(248,113,113,0.14)', border: 'rgba(248,113,113,0.4)', label: 'Loss' },
  push: { color: '#fb923c', bg: 'rgba(251,146,60,0.14)', border: 'rgba(251,146,60,0.4)', label: 'Push' },
};

const TX_META = {
  deposit:  { color: '#34d399', bg: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.4)', label: 'Deposit' },
  withdraw: { color: '#f87171', bg: 'rgba(248,113,113,0.14)', border: 'rgba(248,113,113,0.4)', label: 'Withdraw' },
  bonus:    { color: '#D4AF37', bg: 'rgba(212,175,55,0.14)', border: 'rgba(212,175,55,0.4)', label: 'Bonus' },
  adjustment: { color: '#fb923c', bg: 'rgba(251,146,60,0.14)', border: 'rgba(251,146,60,0.4)', label: 'Adjustment' },
};

function StatCard({ icon: Icon, label, value, color, prefix = '' }) {
  return (
    <div
      className="dash-card p-4 flex items-center gap-3"
      style={{ animation: 'dashFadeIn 400ms ease both' }}
    >
      <div
        className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
        style={{ background: color.bg, border: `1px solid ${color.border}` }}
      >
        <Icon className="w-5 h-5" style={{ color: color.color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
        <AnimatedNumber
          value={value}
          prefix={prefix}
          decimals={2}
          className="text-lg font-extrabold tabular-nums"
          style={{ color: color.color, fontFamily: SANS }}
        />
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [totals, setTotals] = useState({ deposit: 0, withdraw: 0, win: 0, loss: 0 });
  const [transactions, setTransactions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [view, setView] = useState('games'); // 'games' | 'wallet'

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me || !active) return;
        const [txs, acts] = await Promise.all([
          base44.entities.Transaction.filter({ user_id: me.id }, '-created_date', 100).catch(() => []),
          base44.entities.PlayerActivity.filter({ user_id: me.id }, '-created_date', 100).catch(() => []),
        ]);
        if (!active) return;

        let dep = 0, wd = 0, win = 0, loss = 0;
        txs.forEach((tx) => {
          const amt = Number(tx.amount) || 0;
          const ok = tx.status === 'completed' || tx.status === 'approved';
          if (tx.type === 'deposit' && ok) dep += amt;
          if (tx.type === 'withdraw' && ok) wd += amt;
        });
        acts.forEach((a) => {
          const w = Number(a.win) || 0;
          const b = Number(a.bet) || 0;
          if (a.outcome === 'win') win += w;
          else if (a.outcome === 'loss') loss += b;
        });

        setTotals({ deposit: dep, withdraw: wd, win, loss });
        setTransactions(txs.filter((x) => x.type === 'deposit' || x.type === 'withdraw'));
        setActivities(acts);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const net = totals.win - totals.loss;

  return (
    <div className="flex flex-col min-h-screen pb-24" style={{ background: '#0D0D0D', fontFamily: SANS }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(120% 60% at 50% -10%, rgba(212,175,55,0.10), transparent 60%), radial-gradient(80% 50% at 100% 110%, rgba(212,175,55,0.05), transparent 60%), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/42da6c35a_file_00000000a918820b81da42fc2ddfcfda.png) center/cover no-repeat', backgroundAttachment: 'fixed' }} />

      <header
        className="sticky top-0 z-20 backdrop-blur-xl"
        style={{ background: 'rgba(13,13,13,0.78)', borderBottom: '1px solid rgba(212,175,55,0.22)' }}
      >
        <div className="max-w-3xl lg:max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <BackButton href="/" label={t('Back')} />
          <div className="flex-1 flex items-center justify-center gap-2">
            <HistoryIcon className="w-5 h-5" style={{ color: '#D4AF37' }} />
            <h1 className="text-lg font-extrabold" style={{ color: '#D4AF37' }}>{t('History')}</h1>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="relative z-10 max-w-3xl lg:max-w-5xl mx-auto w-full px-4 py-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard icon={ArrowDownToLine} label={t('Total Deposit')} value={totals.deposit} color={{ color: '#34d399', bg: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.4)' }} prefix="$" />
          <StatCard icon={ArrowUpFromLine} label={t('Total Withdraw')} value={totals.withdraw} color={{ color: '#f87171', bg: 'rgba(248,113,113,0.14)', border: 'rgba(248,113,113,0.4)' }} prefix="$" />
          <StatCard icon={Trophy} label={t('Total Win')} value={totals.win} color={{ color: '#D4AF37', bg: 'rgba(212,175,55,0.14)', border: 'rgba(212,175,55,0.4)' }} prefix="$" />
          <StatCard icon={TrendingDown} label={t('Total Loss')} value={totals.loss} color={{ color: '#fb923c', bg: 'rgba(251,146,60,0.14)', border: 'rgba(251,146,60,0.4)' }} prefix="$" />
        </div>

        {/* Net P/L summary */}
        <div className="dash-card p-4 mb-6 flex items-center justify-between" style={{ animation: 'dashFadeIn 400ms ease both' }}>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5" style={{ color: '#D4AF37' }} />
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{t('Net P/L')}</span>
          </div>
          <span className="text-xl font-extrabold tabular-nums" style={{ color: net >= 0 ? '#34d399' : '#f87171' }}>
            {net >= 0 ? '+' : '-'}${Math.abs(net).toFixed(2)}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'games', label: t('Games') },
            { id: 'wallet', label: t('Wallet') },
          ].map((tb) => (
            <button
              key={tb.id}
              onClick={() => setView(tb.id)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                border: view === tb.id ? '1px solid rgba(212,175,55,0.85)' : '1px solid rgba(212,175,55,0.3)',
                background: view === tb.id ? 'linear-gradient(135deg,rgba(255,215,0,0.18),rgba(200,155,60,0.08))' : 'rgba(20,17,13,0.6)',
                color: view === tb.id ? '#f5c542' : 'rgba(255,255,255,0.7)',
              }}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="dash-card p-6 text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {t('Failed to load')}
          </div>
        ) : view === 'games' ? (
          activities.length === 0 ? (
            <div className="dash-card p-6 text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {t('No games played yet.')}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {activities.map((a) => {
                const meta = OUTCOME_META[a.outcome] || OUTCOME_META.loss;
                const amt = a.outcome === 'win' ? (Number(a.win) || 0) : (Number(a.bet) || 0);
                return (
                  <div key={a.id} className="dash-card p-3 flex items-center justify-between" style={{ animation: 'dashFadeIn 400ms ease both' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                        <span className="text-xs font-extrabold" style={{ color: meta.color }}>{(GAME_LABELS[a.game_id] || a.game_id || '?').charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: '#fff' }}>{GAME_LABELS[a.game_id] || a.game_id}</p>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}>
                          {t(meta.label)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold tabular-nums" style={{ color: a.outcome === 'win' ? '#34d399' : '#f87171' }}>
                        {a.outcome === 'win' ? '+' : '-'}${amt.toFixed(2)}
                      </p>
                      {a.multiplier > 0 && <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>×{a.multiplier.toFixed(2)}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : transactions.length === 0 ? (
          <div className="dash-card p-6 text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {t('No transactions yet.')}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => {
              const meta = TX_META[tx.type] || TX_META.deposit;
              const amt = Number(tx.amount) || 0;
              return (
                <div key={tx.id} className="dash-card p-3 flex items-center justify-between" style={{ animation: 'dashFadeIn 400ms ease both' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                      {tx.type === 'deposit' ? <ArrowDownToLine className="w-4 h-4" style={{ color: meta.color }} /> : <ArrowUpFromLine className="w-4 h-4" style={{ color: meta.color }} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: '#fff' }}>{t(meta.label)}</p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-extrabold tabular-nums shrink-0" style={{ color: meta.color }}>
                    {tx.type === 'deposit' ? '+' : '-'}${amt.toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}