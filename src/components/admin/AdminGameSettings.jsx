import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import WesternFrame from '@/components/wildbounty/WesternFrame';

export default function AdminGameSettings() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try { setRows(await base44.entities.GameSetting.list()); }
    catch { toast({ title: 'Failed to load' }); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = (id, patch) => setRows(rs => rs.map(r => (r.id === id ? { ...r, ...patch } : r)));

  const save = async (r) => {
    try {
      await base44.entities.GameSetting.update(r.id, {
        rtp: Number(r.rtp), demo_rtp: Number(r.demo_rtp ?? 50), enabled: r.enabled,
        min_bet: Number(r.min_bet), max_bet: Number(r.max_bet),
      });
      toast({ title: 'Game setting saved' });
      load();
    } catch (e) { toast({ title: 'Failed to save', description: e?.message || 'Unknown error' }); }
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Winning Chance (RTP%)</h2>
      <p className="text-xs text-amber-100/60 italic">The <b className="text-amber-200">*</b> row is the global default; each game overrides it. Lower RTP = harder to win.</p>
      <p className="text-xs text-amber-100/60 italic"><b className="text-emerald-300">Demo RTP</b> applies only while a player uses the $1000 practice balance.</p>
      {loading ? (
        <p className="text-amber-100/60">Loading...</p>
      ) : rows.map(r => (
        <WesternFrame key={r.id} className="p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-amber-100">{r.game_id === '*' ? 'Global Default' : r.game_name}</p>
              <p className="text-xs text-amber-100/50">{r.game_id}</p>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-amber-100/80">
              <input type="checkbox" checked={r.enabled} onChange={e => update(r.id, { enabled: e.target.checked })} /> Enabled
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input type="range" min="0" max="100" value={r.rtp} onChange={e => update(r.id, { rtp: Number(e.target.value) })} className="flex-1 accent-amber-400" />
            <span className="w-12 text-right font-bold text-yellow-200">{r.rtp}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-emerald-300/80 w-16 shrink-0">Demo RTP</span>
            <input type="range" min="0" max="100" value={r.demo_rtp ?? 50} onChange={e => update(r.id, { demo_rtp: Number(e.target.value) })} className="flex-1 accent-emerald-400" />
            <span className="w-12 text-right font-bold text-emerald-200">{r.demo_rtp ?? 50}%</span>
          </div>
          <div className="flex gap-2 items-center">
            <input type="number" value={r.min_bet} onChange={e => update(r.id, { min_bet: e.target.value })} placeholder="Min bet" className="w-24 px-2 py-1 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm" />
            <input type="number" value={r.max_bet} onChange={e => update(r.id, { max_bet: e.target.value })} placeholder="Max bet" className="w-24 px-2 py-1 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm" />
            <button onClick={() => save(r)} className="ml-auto px-3 py-1.5 rounded-lg bg-amber-400 text-stone-900 text-sm font-bold italic" style={{ fontFamily: 'Georgia, serif' }}>Save</button>
          </div>
        </WesternFrame>
      ))}
    </div>
  );
}