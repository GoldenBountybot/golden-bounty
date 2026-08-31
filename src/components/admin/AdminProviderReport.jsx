import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, UserPlus, Activity, DollarSign, Coins, TrendingUp, Repeat, Copy, Check } from 'lucide-react';
import ProviderStatCard from '@/components/admin/ProviderStatCard';

const GAME_LABELS = {
  'hi-lo': 'Hi-Lo', plinko: 'Plinko', mines: 'Mines', fullhouse: 'Super Ace',
  'rocket-crash': 'Rocket Crash', 'wild-bounty': 'Wild Bounty', 'crown-coins': 'Crown Coins',
  'big-brown': 'Big Brown', argonauts: 'Argonauts', 'gates-of-olympus': 'Gates of Olympus',
  thimbles: 'Thimbles', 'free-spin': 'Free Spin',
};

async function fetchAll(entity, sort) {
  let all = [];
  let skip = 0;
  while (true) {
    const batch = await base44.asServiceRole.entities[entity].list(sort, 500, skip);
    if (!batch || batch.length === 0) break;
    all = all.concat(batch);
    if (batch.length < 500) break;
    skip += 500;
    if (skip > 10000) break;
  }
  return all;
}

const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
const money = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminProviderReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [users, acts, txs] = await Promise.all([
          fetchAll('User', '-created_date'),
          fetchAll('PlayerActivity', '-created_date'),
          fetchAll('Transaction', '-created_date'),
        ]);
        if (!active) return;

        const now = Date.now();
        const d1 = now - 86400000;
        const d7 = now - 7 * 86400000;
        const d30 = now - 30 * 86400000;

        const bets = acts.filter((a) => Number(a.bet || 0) > 0);
        const in30 = bets.filter((a) => new Date(a.created_date).getTime() >= d30);

        const wagered = bets.reduce((s, a) => s + Number(a.bet || 0), 0);
        const paid = bets.reduce((s, a) => s + Number(a.win || 0), 0);
        const wagered30 = in30.reduce((s, a) => s + Number(a.bet || 0), 0);
        const paid30 = in30.reduce((s, a) => s + Number(a.win || 0), 0);

        const uniq = (arr) => new Set(arr.map((a) => a.user_id).filter(Boolean)).size;
        const dau = uniq(bets.filter((a) => new Date(a.created_date).getTime() >= d1));
        const wau = uniq(bets.filter((a) => new Date(a.created_date).getTime() >= d7));
        const mau = uniq(in30);

        // Retention: players who placed bets on 2+ distinct days in the last 30 days.
        const daysByUser = {};
        for (const a of in30) {
          if (!a.user_id) continue;
          (daysByUser[a.user_id] ||= new Set()).add(dayKey(a.created_date));
        }
        const ids = Object.keys(daysByUser);
        const returning = ids.filter((id) => daysByUser[id].size >= 2).length;
        const retention = ids.length ? (returning / ids.length) * 100 : 0;

        const deposits = txs.filter((t) => t.type === 'deposit' && (t.status === 'approved' || t.status === 'completed'));
        const dep30 = deposits.filter((t) => new Date(t.created_date).getTime() >= d30);
        const depTotal = deposits.reduce((s, t) => s + Number(t.amount || 0), 0);
        const depTotal30 = dep30.reduce((s, t) => s + Number(t.amount || 0), 0);
        const depositors = new Set(deposits.map((t) => t.user_id).filter(Boolean)).size;

        // Per-game breakdown (last 30 days)
        const map = {};
        for (const a of in30) {
          const g = a.game_id || 'unknown';
          (map[g] ||= { game_id: g, bet: 0, win: 0, rounds: 0, players: new Set() });
          map[g].bet += Number(a.bet || 0);
          map[g].win += Number(a.win || 0);
          map[g].rounds += 1;
          if (a.user_id) map[g].players.add(a.user_id);
        }
        const games = Object.values(map)
          .map((g) => ({ ...g, ggr: g.bet - g.win, playerCount: g.players.size }))
          .sort((a, b) => b.bet - a.bet);

        setData({
          totalPlayers: users.length,
          new30: users.filter((u) => new Date(u.created_date).getTime() >= d30).length,
          new7: users.filter((u) => new Date(u.created_date).getTime() >= d7).length,
          dau, wau, mau,
          retention, returning, activeIn30: ids.length,
          wagered, paid, ggr: wagered - paid,
          wagered30, paid30, ggr30: wagered30 - paid30,
          rounds: bets.length, rounds30: in30.length,
          avgBet: bets.length ? wagered / bets.length : 0,
          arpu: mau ? (wagered30 - paid30) / mau : 0,
          depTotal, depTotal30, depositors,
          avgDeposit: deposits.length ? depTotal / deposits.length : 0,
          depCount: deposits.length,
          games,
        });
      } catch {
        if (active) setData(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const copyReport = () => {
    if (!data) return;
    const lines = [
      'GOLDEN BOUNTY — TRAFFIC & PERFORMANCE REPORT',
      `Generated: ${new Date().toISOString().slice(0, 10)}`,
      '',
      'PLAYERS',
      `Total registered players: ${data.totalPlayers}`,
      `New registrations (last 30 days): ${data.new30}`,
      `New registrations (last 7 days): ${data.new7}`,
      `DAU / WAU / MAU: ${data.dau} / ${data.wau} / ${data.mau}`,
      `30-day retention (played on 2+ days): ${data.retention.toFixed(1)}%`,
      '',
      'DEPOSITS (agent network, local currency → USD wallet)',
      `Total deposit volume (all time): ${money(data.depTotal)}`,
      `Deposit volume (last 30 days): ${money(data.depTotal30)}`,
      `Unique depositors: ${data.depositors}`,
      `Average deposit: ${money(data.avgDeposit)} (${data.depCount} deposits)`,
      '',
      'GAMEPLAY (last 30 days)',
      `Total wagered (turnover): ${money(data.wagered30)}`,
      `Wins paid out: ${money(data.paid30)}`,
      `GGR: ${money(data.ggr30)}`,
      `Rounds played: ${data.rounds30}`,
      `Average bet: ${money(data.avgBet)}`,
      `ARPU (30d GGR / MAU): ${money(data.arpu)}`,
      '',
      'GAMEPLAY (all time)',
      `Total wagered: ${money(data.wagered)} | Wins paid: ${money(data.paid)} | GGR: ${money(data.ggr)} | Rounds: ${data.rounds}`,
      '',
      'TOP GAMES (last 30 days)',
      ...data.games.slice(0, 10).map((g, i) =>
        `${i + 1}. ${GAME_LABELS[g.game_id] || g.game_id} — wagered ${money(g.bet)}, GGR ${money(g.ggr)}, rounds ${g.rounds}, players ${g.playerCount}`),
      '',
      'Wallet currency: USD (single currency). Deposits accepted in any local currency via our verified agent network.',
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-amber-300/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="py-10 text-center text-sm text-stone-500 italic">Could not load report data</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] text-stone-500 max-w-md">
          These are the exact metrics game providers (BGaming, aggregators) ask for before sending an integration offer.
          Copy the report and send it to them after launch.
        </p>
        <button
          onClick={copyReport}
          className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl shrink-0 text-xs font-bold active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg,#f5c542,#c8881e)', color: '#2a1a06' }}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy Report'}
        </button>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300/70 mb-2">Players</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ProviderStatCard icon={Users} label="Total Players" value={data.totalPlayers} />
          <ProviderStatCard icon={UserPlus} label="New (30d)" value={data.new30} hint={`${data.new7} in last 7 days`} />
          <ProviderStatCard icon={Activity} label="DAU / WAU / MAU" value={`${data.dau} / ${data.wau} / ${data.mau}`} />
          <ProviderStatCard icon={Repeat} label="30d Retention" value={`${data.retention.toFixed(1)}%`} hint={`${data.returning} of ${data.activeIn30} played 2+ days`} />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300/70 mb-2">Deposits (Agent Network → USD)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ProviderStatCard icon={DollarSign} label="Deposits (30d)" value={money(data.depTotal30)} />
          <ProviderStatCard icon={DollarSign} label="Deposits (All Time)" value={money(data.depTotal)} />
          <ProviderStatCard icon={Users} label="Unique Depositors" value={data.depositors} />
          <ProviderStatCard icon={Coins} label="Avg Deposit" value={money(data.avgDeposit)} hint={`${data.depCount} deposits`} />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300/70 mb-2">Gameplay — Last 30 Days</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <ProviderStatCard icon={Coins} label="Turnover (Wagered)" value={money(data.wagered30)} />
          <ProviderStatCard icon={TrendingUp} label="Wins Paid" value={money(data.paid30)} />
          <ProviderStatCard icon={DollarSign} label="GGR" value={money(data.ggr30)} />
          <ProviderStatCard icon={Activity} label="Rounds" value={data.rounds30} hint={`avg bet ${money(data.avgBet)}`} />
          <ProviderStatCard icon={Users} label="ARPU" value={money(data.arpu)} hint="30d GGR / MAU" />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(214,178,98,0.3)', background: 'rgba(20,17,13,0.6)' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(214,178,98,0.2)' }}>
          <h3 className="text-sm font-bold italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Top Games — Last 30 Days</h3>
          <p className="text-[11px] text-stone-500 mt-0.5">GGR = wagered − wins paid. This is the figure providers use for revenue share.</p>
        </div>
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.7fr_0.7fr] gap-2 px-4 py-2 text-[10px] font-bold tracking-wider uppercase text-stone-500" style={{ borderBottom: '1px solid rgba(214,178,98,0.12)' }}>
          <span>Game</span>
          <span className="text-right">Wagered</span>
          <span className="text-right">Wins Paid</span>
          <span className="text-right">GGR</span>
          <span className="text-right">Rounds</span>
          <span className="text-right">Players</span>
        </div>
        {data.games.length === 0 ? (
          <div className="py-10 text-center text-sm text-stone-500 italic">No gameplay in the last 30 days</div>
        ) : data.games.map((g) => (
          <div key={g.game_id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.7fr_0.7fr] gap-2 px-4 py-2.5 text-xs items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="font-bold text-amber-100" style={{ fontFamily: 'Georgia, serif' }}>{GAME_LABELS[g.game_id] || g.game_id}</span>
            <span className="text-right tabular-nums text-stone-300">{money(g.bet)}</span>
            <span className="text-right tabular-nums text-emerald-300">{money(g.win)}</span>
            <span className="text-right tabular-nums font-bold" style={{ color: g.ggr >= 0 ? '#34d399' : '#f87171' }}>{money(g.ggr)}</span>
            <span className="text-right tabular-nums text-stone-400">{g.rounds}</span>
            <span className="text-right tabular-nums text-stone-400">{g.playerCount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}