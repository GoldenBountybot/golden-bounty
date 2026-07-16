import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import WesternFrame from '@/components/wildbounty/WesternFrame';

export default function AdminBonuses() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try { setRows(await base44.entities.BonusSetting.list()); }
    catch { toast({ title: 'Failed to load' }); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = (id, patch) => setRows(rs => rs.map(r => (r.id === id ? { ...r, ...patch } : r)));

  const save = async (r) => {
    try {
      await base44.entities.BonusSetting.update(r.id, {
        amount: Number(r.amount), deposit_percent: Number(r.deposit_percent), active: r.active,
      });
      toast({ title: 'Bonus saved' });
      load();
    } catch { toast({ title: 'Failed to save' }); }
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Bonus Settings</h2>
      {loading ? (
        <p className="text-amber-100/60">Loading...</p>
      ) : rows.map(r => (
        <WesternFrame key={r.id} className="p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="font-bold text-amber-100 capitalize">{r.name}</p>
            <label className="flex items-center gap-1.5 text-xs text-amber-100/80">
              <input type="checkbox" checked={r.active} onChange={e => update(r.id, { active: e.target.checked })} /> Active
            </label>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-amber-100/60 w-24">Amount $</span>
            <input type="number" value={r.amount} onChange={e => update(r.id, { amount: e.target.value })} className="w-28 px-2 py-1 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm" />
          </div>
          {r.name === 'deposit' && (
            <div className="flex gap-2 items-center">
              <span className="text-xs text-amber-100/60 w-24">Deposit %</span>
              <input type="number" value={r.deposit_percent} onChange={e => update(r.id, { deposit_percent: e.target.value })} className="w-28 px-2 py-1 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm" />
            </div>
          )}
          <button onClick={() => save(r)} className="self-start px-3 py-1.5 rounded-lg bg-amber-400 text-stone-900 text-sm font-bold italic" style={{ fontFamily: 'Georgia, serif' }}>Save</button>
        </WesternFrame>
      ))}
    </div>
  );
}