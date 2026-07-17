import React from 'react';
import { Plus, Minus } from 'lucide-react';

const QUICK = [1, 5, 10, 50];

export default function BetPanel({ index, panel, phase, multiplier, balance, onPlace, onCancel, onCashOut, onAmount, onToggleAutoBet, onToggleAutoCashout, onAutoCashout }) {
  const waiting = phase === 'waiting';
  const running = phase === 'running';
  const canEdit = !panel.placed;

  const potentialWin = +(panel.amount * multiplier).toFixed(2);

  let button;
  if (waiting && !panel.placed) {
    button = (
      <button onClick={() => onPlace(index)} disabled={balance < panel.amount}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-lg font-black italic shadow-lg shadow-emerald-900/40 hover:from-emerald-400 hover:to-green-500 disabled:opacity-50 transition-colors"
        style={{ fontFamily: 'Georgia, serif' }}>
        BET · ${panel.amount.toFixed(2)}
      </button>
    );
  } else if (waiting && panel.placed) {
    button = (
      <button onClick={() => onCancel(index)}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-lg font-black italic shadow-lg hover:from-amber-400 hover:to-orange-500 transition-colors"
        style={{ fontFamily: 'Georgia, serif' }}>
        CANCEL · ${panel.amount.toFixed(2)}
      </button>
    );
  } else if (running && panel.placed && !panel.cashedOut) {
    button = (
      <button onClick={() => onCashOut(index)}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white text-lg font-black italic shadow-lg shadow-orange-900/40 hover:from-orange-400 hover:to-amber-500 transition-colors animate-pulse"
        style={{ fontFamily: 'Georgia, serif' }}>
        CASH OUT · ${potentialWin.toFixed(2)}
      </button>
    );
  } else if (running && panel.placed && panel.cashedOut) {
    button = (
      <button disabled
        className="w-full py-4 rounded-xl bg-emerald-700/60 text-emerald-100 text-lg font-black italic transition-colors"
        style={{ fontFamily: 'Georgia, serif' }}>
        CASHED ${panel.win.toFixed(2)} · {panel.cashOutMult}x
      </button>
    );
  } else {
    button = (
      <button disabled
        className="w-full py-4 rounded-xl bg-slate-800/60 text-slate-400 text-lg font-black italic cursor-not-allowed"
        style={{ fontFamily: 'Georgia, serif' }}>
        WAITING NEXT ROUND…
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-black/40 border border-indigo-900/40 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-widest text-indigo-200/70 uppercase">Bet {index + 1}</span>
        <div className="flex gap-1.5">
          <button onClick={() => onToggleAutoBet(index)}
            className={`px-2 py-1 rounded-md text-[10px] font-bold italic border transition-colors ${panel.autoBet ? 'bg-indigo-500 text-white border-indigo-300' : 'bg-black/40 text-indigo-200/70 border-indigo-800/50'}`}
            style={{ fontFamily: 'Georgia, serif' }}>
            AUTO BET
          </button>
          <button onClick={() => onToggleAutoCashout(index)}
            className={`px-2 py-1 rounded-md text-[10px] font-bold italic border transition-colors ${panel.autoCashout > 0 ? 'bg-fuchsia-500 text-white border-fuchsia-300' : 'bg-black/40 text-fuchsia-200/70 border-fuchsia-800/50'}`}
            style={{ fontFamily: 'Georgia, serif' }}>
            AUTO CASHOUT
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-indigo-800/50 overflow-hidden">
          <button onClick={() => canEdit && onAmount(index, +(panel.amount - 1).toFixed(2))} disabled={!canEdit}
            className="px-2 py-2 bg-black/40 text-indigo-200 hover:bg-black/60 disabled:opacity-40">
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            value={panel.amount}
            min={0.10}
            max={500}
            step={0.10}
            disabled={!canEdit}
            onChange={e => onAmount(index, e.target.value)}
            className="w-16 text-center bg-transparent text-base font-black italic text-white tabular-nums outline-none disabled:opacity-60"
            style={{ fontFamily: 'Georgia, serif' }}
          />
          <button onClick={() => canEdit && onAmount(index, +(panel.amount + 1).toFixed(2))} disabled={!canEdit}
            className="px-2 py-2 bg-black/40 text-indigo-200 hover:bg-black/60 disabled:opacity-40">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-1">
          {QUICK.map(q => (
            <button key={q} onClick={() => canEdit && onAmount(index, q)} disabled={!canEdit}
              className="px-2 py-1.5 rounded-md text-[11px] font-bold italic border bg-black/40 text-indigo-100/80 border-indigo-800/50 hover:bg-black/60 disabled:opacity-40"
              style={{ fontFamily: 'Georgia, serif' }}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {panel.autoCashout > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-fuchsia-200/80 font-bold">Cash out at</span>
          <input
            type="number"
            value={panel.autoCashout}
            min={1.01}
            step={0.1}
            disabled={!canEdit && !panel.placed}
            onChange={e => onAutoCashout(index, e.target.value)}
            className="w-20 text-center rounded-md bg-black/50 border border-fuchsia-800/50 py-1 text-sm font-black italic text-fuchsia-100 tabular-nums outline-none"
            style={{ fontFamily: 'Georgia, serif' }}
          />
          <span className="text-sm font-bold text-fuchsia-200/80">x</span>
        </div>
      )}

      {button}
    </div>
  );
}