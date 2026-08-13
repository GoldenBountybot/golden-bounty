import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { History } from 'lucide-react';
import { toDate } from '@/lib/dateFormat';

function fmtTime(d) {
  try { return toDate(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

// Desktop-only side panel pinned to the right of a centered game stage.
// Shows the player's recent rounds for this game. Hidden on mobile.
export default function GameDesktopPanel({ gameId, title = 'Recent Rounds' }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const list = await base44.entities.PlayerActivity.filter({ game_id: gameId }, '-created_date', 25);
        if (active) setRows((list || []).filter((r) => (r.bet || 0) > 0));
      } catch { /* ignore */ }
    };
    load();
    const t = setInterval(load, 8000);
    return () => { active = false; clearInterval(t); };
  }, [gameId]);

  const totalBet = rows.reduce((s, r) => s + (r.bet || 0), 0);
  const totalWin = rows.reduce((s, r) => s + (r.win || 0), 0);
  const net = totalWin - totalBet;

  return (
    <aside
      className="hidden lg:flex flex-col fixed right-5 top-24 w-[290px] max-h-[70vh] rounded-2xl overflow-hidden z-30"
      style={{
        border: '1px solid rgba(212,175,55,0.35)',
        background: 'rgba(10,9,8,0.72)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 10px 34px rgba(0,0,0,0.6)',
        fontFamily: 'Georgia, serif',
      }}
    >
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(212,175,55,0.22)' }}>
        <History className="w-4 h-4" style={{ color: '#f5c542' }} />
        <span className="text-sm font-black italic" style={{ color: '#f3e2b3' }}>{title}</span>
      </div>

      <div className="grid grid-cols-3 gap-1 px-3 py-2 text-center" style={{ borderBottom: '1px solid rgba(212,175,55,0.18)' }}>
        <div>
          <div className="text-[9px] tracking-wider" style={{ color: '#a09080' }}>BET</div>
          <div className="text-xs font-black tabular-nums text-white">${totalBet.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-[9px] tracking-wider" style={{ color: '#a09080' }}>WIN</div>
          <div className="text-xs font-black tabular-nums" style={{ color: '#7ee787' }}>${totalWin.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-[9px] tracking-wider" style={{ color: '#a09080' }}>NET</div>
          <div className="text-xs font-black tabular-nums" style={{ color: net >= 0 ? '#7ee787' : '#ff6b6b' }}>{net >= 0 ? '+' : ''}{net.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="py-8 text-center text-xs italic" style={{ color: '#6a6258' }}>No rounds yet</div>
        ) : rows.map((r) => {
          const profit = (r.win || 0) - (r.bet || 0);
          return (
            <div key={r.id} className="flex items-center justify-between gap-2 px-3 py-1.5 text-[11px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#6a6258' }}>{fmtTime(r.created_date)}</span>
              <span className="tabular-nums" style={{ color: '#c8b890' }}>${(r.bet || 0).toFixed(2)}</span>
              <span className="tabular-nums font-bold" style={{ color: profit >= 0 ? '#7ee787' : '#ff6b6b' }}>
                {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}