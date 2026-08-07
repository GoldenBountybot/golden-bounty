import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { History, X } from 'lucide-react';

const GAME_LABELS = {
  'wild-bounty': 'Wild Bounty',
  'hi-lo': 'Hi-Lo',
  'plinko': 'Plinko',
  'mines': 'Mines',
  'fullhouse': 'Full House',
  'rocket-crash': 'Aviator',
  'crown-coins': 'Crown Coins',
  'argonauts': 'Argonauts',
};

function fmtDate(d) {
  if (!d) return '';
  try {
    const dt = new Date(d);
    return dt.toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return String(d); }
}

export default function PlayerHistoryButton({ iconOnly = false, externalOpen = false, onExternalClose, renderButton = true, gameId = null, title = 'Win / Loss History' }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = internalOpen || externalOpen;
  const setOpen = (v) => { if (!v) onExternalClose && onExternalClose(); setInternalOpen(v); };
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const list = await base44.entities.PlayerActivity.list('-created_date', 60);
        if (active) setRows(list || []);
      } catch { if (active) setRows([]); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [open]);

  // Only rounds where the player actually placed a bet are shown; when a
  // gameId is provided, only that game's activity is listed.
  const hist = rows.filter((r) => (r.bet || 0) > 0 && (!gameId || r.game_id === gameId));
  const totalBet = hist.reduce((s, r) => s + (r.bet || 0), 0);
  const totalWin = hist.reduce((s, r) => s + (r.win || 0), 0);
  const net = totalWin - totalBet;

  return (
    <>
      {renderButton && (iconOnly ? (
        <button
          onClick={() => setInternalOpen(true)}
          className="shrink-0"
          title="My History"
        >
          <span className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-95" style={{ background: 'linear-gradient(145deg, #5a3a1a, #2e1d0e 50%, #3a2818)', border: '2px solid rgba(190,140,55,0.7)', boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.2), 0 2px 4px rgba(0,0,0,0.65)' }}>
            <History className="w-4 h-4 text-amber-300" strokeWidth={2.2} />
          </span>
        </button>
      ) : (
        <button
          onClick={() => setInternalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-indigo-700/40 text-indigo-100 text-xs font-bold italic hover:bg-black/60 transition-colors"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          <History className="w-4 h-4" />
          My History
        </button>
      ))}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ border: '1px solid rgba(99,102,241,0.5)', background: 'linear-gradient(to bottom, #0f172a, #020617)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-indigo-900/40">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-300" />
                <h3 className="text-sm font-black text-indigo-100 italic" style={{ fontFamily: 'Georgia, serif' }}>{title}</h3>
              </div>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-black/50 border border-indigo-800/50 flex items-center justify-center text-indigo-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-indigo-900/40 text-center">
              <div>
                <div className="text-[9px] text-indigo-300/60 font-bold tracking-wider">TOTAL BET</div>
                <div className="text-sm font-black text-white tabular-nums">${totalBet.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[9px] text-indigo-300/60 font-bold tracking-wider">TOTAL WIN</div>
                <div className="text-sm font-black text-emerald-300 tabular-nums">${totalWin.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[9px] text-indigo-300/60 font-bold tracking-wider">NET</div>
                <div className={`text-sm font-black tabular-nums ${net >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>{net >= 0 ? '+' : ''}{net.toFixed(2)}</div>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin" />
                </div>
              ) : hist.length === 0 ? (
                <div className="py-10 text-center text-indigo-300/50 text-sm italic">No history yet</div>
              ) : (
                hist.map((r) => {
                  const profit = (r.win || 0) - (r.bet || 0);
                  const odds = Number(r.multiplier) || 0;
                  return (
                    <div key={r.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 px-4 py-2 border-b border-white/5 text-xs">
                      <div className="flex flex-col">
                        <span className="font-bold text-indigo-100">{GAME_LABELS[r.game_id] || r.game_id}</span>
                        <span className="text-[10px] text-indigo-300/50">{fmtDate(r.created_date)}</span>
                      </div>
                      <span className="text-right tabular-nums text-amber-200/80">{odds > 0 ? `×${odds.toFixed(2)}` : '—'}</span>
                      <span className="text-right tabular-nums text-indigo-200/70">${(r.win || 0).toFixed(2)}</span>
                      <span className={`text-right font-bold tabular-nums ${profit >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                        {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2 border-t border-indigo-900/40 text-[9px] text-indigo-300/50 font-bold tracking-wider">
              <span>GAME</span>
              <span className="text-right">ODDS</span>
              <span className="text-right">WIN</span>
              <span className="text-right">NET</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}