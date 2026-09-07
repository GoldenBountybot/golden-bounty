import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Save, Trash2, Pause, Play, Ban } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const BLANK = {
  name: 'Welcome Bonus',
  description: 'First deposit bonus',
  percent: 100,
  min_deposit: 10,
  max_deposit: 0,
  max_bonus: 100,
  wager_multiplier: 20,
  first_deposit_only: true,
  eligible_methods: ['*'],
  game_contributions: { '*': 100 },
  excluded_games: [],
  expiry_days: 30,
  wager_deadline_days: 30,
  status: 'active',
  priority: 0,
};

const NUMS = ['percent', 'min_deposit', 'max_deposit', 'max_bonus', 'wager_multiplier', 'expiry_days', 'wager_deadline_days', 'priority'];

function Field({ label, children, hint }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-white/45">{label}</span>
      {children}
      {hint && <span className="text-[10px] text-white/35">{hint}</span>}
    </label>
  );
}

function CampaignForm({ value, onSave, onCancel }) {
  const [f, setF] = useState(value);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const save = () => {
    const out = { ...f };
    NUMS.forEach((k) => { out[k] = Number(out[k]) || 0; });
    if (typeof out.eligible_methods === 'string') out.eligible_methods = out.eligible_methods.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (typeof out.excluded_games === 'string') out.excluded_games = out.excluded_games.split(',').map((s) => s.trim()).filter(Boolean);
    if (typeof out.game_contributions === 'string') {
      try { out.game_contributions = JSON.parse(out.game_contributions); }
      catch { toast({ title: 'Invalid game contributions JSON' }); return; }
    }
    onSave(out);
  };

  return (
    <div className="dash-card p-4 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Bonus name"><input className="dash-input px-3 h-9 text-sm" value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Status">
          <select className="dash-input px-3 h-9 text-sm" value={f.status} onChange={(e) => set('status', e.target.value)}>
            <option value="active">active</option><option value="paused">paused</option><option value="disabled">disabled</option>
          </select>
        </Field>
        <Field label="Bonus %"><input className="dash-input px-3 h-9 text-sm" value={f.percent} onChange={(e) => set('percent', e.target.value)} /></Field>
        <Field label="Wagering multiplier (×bonus)"><input className="dash-input px-3 h-9 text-sm" value={f.wager_multiplier} onChange={(e) => set('wager_multiplier', e.target.value)} /></Field>
        <Field label="Min deposit"><input className="dash-input px-3 h-9 text-sm" value={f.min_deposit} onChange={(e) => set('min_deposit', e.target.value)} /></Field>
        <Field label="Max deposit (0 = none)"><input className="dash-input px-3 h-9 text-sm" value={f.max_deposit} onChange={(e) => set('max_deposit', e.target.value)} /></Field>
        <Field label="Max bonus amount"><input className="dash-input px-3 h-9 text-sm" value={f.max_bonus} onChange={(e) => set('max_bonus', e.target.value)} /></Field>
        <Field label="Priority"><input className="dash-input px-3 h-9 text-sm" value={f.priority} onChange={(e) => set('priority', e.target.value)} /></Field>
        <Field label="Bonus expires (days)"><input className="dash-input px-3 h-9 text-sm" value={f.expiry_days} onChange={(e) => set('expiry_days', e.target.value)} /></Field>
        <Field label="Wagering deadline (days)"><input className="dash-input px-3 h-9 text-sm" value={f.wager_deadline_days} onChange={(e) => set('wager_deadline_days', e.target.value)} /></Field>
        <Field label="Start date"><input type="date" className="dash-input px-3 h-9 text-sm" value={(f.start_date || '').slice(0, 10)} onChange={(e) => set('start_date', e.target.value || null)} /></Field>
        <Field label="End date"><input type="date" className="dash-input px-3 h-9 text-sm" value={(f.end_date || '').slice(0, 10)} onChange={(e) => set('end_date', e.target.value || null)} /></Field>
      </div>

      <Field label="Description"><input className="dash-input px-3 h-9 text-sm" value={f.description || ''} onChange={(e) => set('description', e.target.value)} /></Field>

      <Field label="Eligible deposit methods" hint="Comma separated. Use * for all. e.g. agent, usdt, direct">
        <input className="dash-input px-3 h-9 text-sm"
          value={Array.isArray(f.eligible_methods) ? f.eligible_methods.join(', ') : f.eligible_methods}
          onChange={(e) => set('eligible_methods', e.target.value)} />
      </Field>

      <Field label="Game contributions (JSON)" hint='Game id or provider prefix → %. e.g. {"*":100,"mines":50,"wg":25}'>
        <textarea rows={3} className="dash-input px-3 py-2 text-sm font-mono"
          value={typeof f.game_contributions === 'string' ? f.game_contributions : JSON.stringify(f.game_contributions)}
          onChange={(e) => set('game_contributions', e.target.value)} />
      </Field>

      <Field label="Excluded games" hint="Comma separated game ids — these never count toward turnover">
        <input className="dash-input px-3 h-9 text-sm"
          value={Array.isArray(f.excluded_games) ? f.excluded_games.join(', ') : f.excluded_games}
          onChange={(e) => set('excluded_games', e.target.value)} />
      </Field>

      <label className="flex items-center gap-2 text-sm text-white/70">
        <input type="checkbox" checked={!!f.first_deposit_only} onChange={(e) => set('first_deposit_only', e.target.checked)} />
        First deposit only
      </label>

      <div className="flex gap-2">
        <button onClick={save} className="dash-btn-gold px-4 h-9 text-sm flex items-center gap-1.5"><Save className="w-4 h-4" />Save</button>
        <button onClick={onCancel} className="px-4 h-9 text-sm rounded-xl text-white/60" style={{ border: '1px solid rgba(255,255,255,0.14)' }}>Cancel</button>
      </div>
    </div>
  );
}

export default function AdminBonusCampaigns() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const list = await base44.entities.BonusCampaign.list('-created_date', 100).catch(() => []);
    setRows(list || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (data) => {
    try {
      if (data.id) {
        const { id, ...rest } = data;
        await base44.entities.BonusCampaign.update(id, rest);
      } else {
        await base44.entities.BonusCampaign.create(data);
      }
      setEditing(null);
      toast({ title: 'Bonus campaign saved' });
      load();
    } catch (e) {
      toast({ title: 'Save failed', description: String(e?.message || e) });
    }
  };

  const setStatus = async (row, status) => {
    await base44.entities.BonusCampaign.update(row.id, { status }).catch(() => {});
    load();
  };

  const remove = async (row) => {
    await base44.entities.BonusCampaign.delete(row.id).catch(() => {});
    load();
  };

  if (loading) return <p className="text-white/50 text-sm">Loading…</p>;

  return (
    <div className="flex flex-col gap-3">
      {!editing && (
        <button onClick={() => setEditing({ ...BLANK })} className="dash-btn-gold px-4 h-10 text-sm flex items-center gap-1.5 self-start">
          <Plus className="w-4 h-4" />New Bonus Campaign
        </button>
      )}

      {editing && <CampaignForm value={editing} onSave={save} onCancel={() => setEditing(null)} />}

      {rows.map((r) => (
        <div key={r.id} className="dash-card p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-black text-amber-100">{r.name}</p>
              <p className="text-[11px] text-white/45">
                {r.percent}% · min ${r.min_deposit} · max bonus ${r.max_bonus} · {r.wager_multiplier}× wagering
                {r.first_deposit_only ? ' · first deposit only' : ''}
              </p>
              <p className="text-[10px] text-white/35">
                methods: {(r.eligible_methods || []).join(', ')} · games: {JSON.stringify(r.game_contributions || {})}
              </p>
            </div>
            <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase"
              style={{ background: r.status === 'active' ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)', color: r.status === 'active' ? '#34d399' : '#aaa' }}>
              {r.status}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setEditing(r)} className="px-3 h-8 text-xs rounded-lg text-amber-200" style={{ border: '1px solid rgba(214,178,98,0.3)' }}>Edit</button>
            {r.status !== 'active'
              ? <button onClick={() => setStatus(r, 'active')} className="px-3 h-8 text-xs rounded-lg text-emerald-300 flex items-center gap-1" style={{ border: '1px solid rgba(52,211,153,0.3)' }}><Play className="w-3 h-3" />Activate</button>
              : <button onClick={() => setStatus(r, 'paused')} className="px-3 h-8 text-xs rounded-lg text-amber-300 flex items-center gap-1" style={{ border: '1px solid rgba(245,197,66,0.3)' }}><Pause className="w-3 h-3" />Pause</button>}
            <button onClick={() => setStatus(r, 'disabled')} className="px-3 h-8 text-xs rounded-lg text-white/60 flex items-center gap-1" style={{ border: '1px solid rgba(255,255,255,0.14)' }}><Ban className="w-3 h-3" />Disable</button>
            <button onClick={() => remove(r)} className="px-3 h-8 text-xs rounded-lg text-rose-300 flex items-center gap-1" style={{ border: '1px solid rgba(244,63,94,0.3)' }}><Trash2 className="w-3 h-3" />Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}