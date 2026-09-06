import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';

const GAME_LABELS = {
  'hi-lo': 'Hi-Lo',
  plinko: 'Plinko',
  mines: 'Mines',
  fullhouse: 'Super Ace',
  'rocket-crash': 'Rocket Crash',
  'wild-bounty': 'Wild Bounty',
  'crown-coins': 'Crown Coins',
  'big-brown': 'Big Brown',
  argonauts: 'Argonauts',
  'gates-of-olympus': 'Gates of Olympus',
  thimbles: 'Thimbles',
  'free-spin': 'Free Spin',
};

export default function AdminGameStats() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Fetch all player activity records (up to 500 per call)
        let all = [];
        let skip = 0;
        while (true) {
          const batch = await base44.entities.PlayerActivity.list('-created_date', 500, skip);
          if (!batch || batch.length === 0) break;
          all = all.concat(batch);
          if (batch.length < 500) break;
          skip += 500;
          if (skip > 5000) break; // safety cap
        }
        if (!active) return;

        // Aggregate by game_id
        const map = {};
        for (const r of all) {
          const gid = r.game_id || 'unknown';
          if (!map[gid]) map[gid] = { game_id: gid, bets: 0, wins: 0, rounds: 0, winRounds: 0, players: new Set() };
          map[gid].bets += Number(r.bet || 0);
          map[gid].wins += Number(r.win || 0);
          map[gid].rounds += 1;
          if (Number(r.win || 0) > Number(r.bet || 0)) map[gid].winRounds += 1;
          if (r.user_id) map[gid].players.add(r.user_id);
        }
        const arr = Object.values(map).map(v => ({
          ...v,
          net: v.wins - v.bets, // negative = house profit, positive = users profiting
          winRate: v.rounds > 0 ? (v.winRounds / v.rounds) * 100 : 0,
          playerCount: v.players.size,
        })).sort((a, b) => b.bets - a.bets);
        if (active) setRows(arr);
      } catch (e) {
        if (active) setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-amber-300/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  const totalBet = rows.reduce((s, r) => s + r.bets, 0);
  const totalWin = rows.reduce((s, r) => s + r.wins, 0);
  const totalNet = totalWin - totalBet;

  return (
    <div className="flex flex-col gap-4">
      {/* Overall summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4" style={{ border: '1px solid rgba(214,178,98,0.3)', background: 'rgba(20,17,13,0.6)' }}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-amber-300" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-stone-400">Total Wagered</span>
          </div>
          <p className="text-2xl font-black text-amber-100 tabular-nums">${totalBet.toFixed(2)}</p>
        </div>
        <div className="rounded-xl p-4" style={{ border: '1px solid rgba(214,178,98,0.3)', background: 'rgba(20,17,13,0.6)' }}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-stone-400">Total Wins Paid</span>
          </div>
          <p className="text-2xl font-black text-emerald-300 tabular-nums">${totalWin.toFixed(2)}</p>
        </div>
        <div className="rounded-xl p-4" style={{ border: '1px solid rgba(214,178,98,0.3)', background: 'rgba(20,17,13,0.6)' }}>
          <div className="flex items-center gap-2 mb-1">
            {totalNet >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
            <span className="text-[11px] font-bold tracking-wider uppercase text-stone-400">{totalNet >= 0 ? 'Users Profit' : 'House Profit'}</span>
          </div>
          <p className="text-2xl font-black tabular-nums" style={{ color: totalNet >= 0 ? '#34d399' : '#f87171' }}>
            {totalNet >= 0 ? '+' : ''}{totalNet.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Per-game breakdown */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(214,178,98,0.3)', background: 'rgba(20,17,13,0.6)' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(214,178,98,0.2)' }}>
          <h3 className="text-sm font-bold italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Game-by-Game Statistics</h3>
          <p className="text-[11px] text-stone-500 mt-0.5">Negative net = users losing (house profit). Positive = users profiting.</p>
        </div>
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.8fr_0.8fr] gap-2 px-4 py-2 text-[10px] font-bold tracking-wider uppercase text-stone-500" style={{ borderBottom: '1px solid rgba(214,178,98,0.12)' }}>
          <span>Game</span>
          <span className="text-right">Wagered</span>
          <span className="text-right">Wins Paid</span>
          <span className="text-right">Net (P/L)</span>
          <span className="text-right">Win Rate</span>
          <span className="text-right">Rounds</span>
          <span className="text-right">Players</span>
        </div>
        {rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-stone-500 italic">No game activity yet</div>
        ) : (
          rows.map(r => (
            <div key={r.game_id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.8fr_0.8fr] gap-2 px-4 py-2.5 text-xs items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="font-bold text-amber-100" style={{ fontFamily: 'Georgia, serif' }}>{GAME_LABELS[r.game_id] || r.game_id}</span>
              <span className="text-right tabular-nums text-stone-300">${r.bets.toFixed(2)}</span>
              <span className="text-right tabular-nums text-emerald-300">${r.wins.toFixed(2)}</span>
              <span className="text-right tabular-nums font-bold" style={{ color: r.net >= 0 ? '#34d399' : '#f87171' }}>
                {r.net >= 0 ? '+' : ''}{r.net.toFixed(2)}
              </span>
              <span className="text-right tabular-nums text-stone-400">{r.winRate.toFixed(1)}%</span>
              <span className="text-right tabular-nums text-stone-400">{r.rounds}</span>
              <span className="text-right tabular-nums text-stone-400">{r.playerCount}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}