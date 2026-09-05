import React, { useState, useEffect } from 'react';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import { hitRateLabel } from '@/lib/gameHitRate';

// One self-contained card per game. It keeps its OWN draft state, so editing
// or saving one game can never touch another game's values.
export default function GameRtpCard({ row, onSave }) {
  const [draft, setDraft] = useState(row);
  const [saving, setSaving] = useState(false);

  // Re-sync only when this exact record changes on the server.
  useEffect(() => { setDraft(row); }, [row.id, row.updated_date]);

  const set = (patch) => setDraft(d => ({ ...d, ...patch }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  };

  return (
    <WesternFrame className="p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-amber-100">{draft.game_id === '*' ? 'Global Default' : draft.game_name}</p>
          <p className="text-xs text-amber-100/50">{draft.game_id}</p>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-amber-100/80">
          <input type="checkbox" checked={!!draft.enabled} onChange={e => set({ enabled: e.target.checked })} /> Enabled
        </label>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide text-amber-300/80 w-16 shrink-0">RTP</span>
        <input type="range" min="0" max="100" value={draft.rtp ?? 50} onChange={e => set({ rtp: Number(e.target.value) })} className="flex-1 accent-amber-400" />
        <span className="w-12 text-right font-bold text-yellow-200">{draft.rtp ?? 50}%</span>
      </div>
      <p className="text-[10px] text-amber-100/50 -mt-1 pl-[72px]">Return to player · {hitRateLabel(draft.game_id, draft.rtp)}</p>
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide text-emerald-300/80 w-16 shrink-0">Demo RTP</span>
        <input type="range" min="0" max="100" value={draft.demo_rtp ?? 50} onChange={e => set({ demo_rtp: Number(e.target.value) })} className="flex-1 accent-emerald-400" />
        <span className="w-12 text-right font-bold text-emerald-200">{draft.demo_rtp ?? 50}%</span>
      </div>
      <div className="flex gap-2 items-center">
        <input type="number" value={draft.min_bet ?? ''} onChange={e => set({ min_bet: e.target.value })} placeholder="Min bet" className="w-24 px-2 py-1 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm" />
        <input type="number" value={draft.max_bet ?? ''} onChange={e => set({ max_bet: e.target.value })} placeholder="Max bet" className="w-24 px-2 py-1 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm" />
        <button onClick={handleSave} disabled={saving} className="ml-auto px-3 py-1.5 rounded-lg bg-amber-400 text-stone-900 text-sm font-bold italic disabled:opacity-50" style={{ fontFamily: 'Georgia, serif' }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </WesternFrame>
  );
}