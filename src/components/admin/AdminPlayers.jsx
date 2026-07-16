import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import WesternFrame from '@/components/wildbounty/WesternFrame';

export default function AdminPlayers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ balance: 0, role: 'user', phone: '' });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try { setUsers(await base44.entities.User.list()); }
    catch { toast({ title: 'Failed to load users' }); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const startEdit = (u) => {
    setEditing(u.id);
    setForm({ balance: u.balance ?? 0, role: u.role || 'user', phone: u.phone || '' });
  };
  const save = async (u) => {
    try {
      await base44.entities.User.update(u.id, { balance: Number(form.balance), role: form.role, phone: form.phone });
      toast({ title: 'User updated' });
      setEditing(null);
      load();
    } catch { toast({ title: 'Update failed' }); }
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Players ({users.length})</h2>
      {loading ? (
        <p className="text-amber-100/60">Loading...</p>
      ) : users.map(u => (
        <WesternFrame key={u.id} className="p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-100 truncate">{u.email}</p>
              <p className="text-xs text-amber-100/60">Role: {u.role} · Phone: {u.phone || '—'}</p>
              <p className="text-sm text-yellow-200 font-bold">${(u.balance ?? 0).toFixed(2)}</p>
            </div>
            {editing === u.id ? (
              <div className="flex flex-col gap-1.5 w-40">
                <input type="number" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} placeholder="Balance" className="px-2 py-1 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm" />
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="px-2 py-1 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm">
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="px-2 py-1 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm" />
                <div className="flex gap-1">
                  <button onClick={() => save(u)} className="flex-1 px-2 py-1 rounded bg-amber-400 text-stone-900 text-xs font-bold">Save</button>
                  <button onClick={() => setEditing(null)} className="px-2 py-1 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => startEdit(u)} className="px-3 py-1.5 rounded-lg bg-amber-400 text-stone-900 text-sm font-bold italic" style={{ fontFamily: 'Georgia, serif' }}>Edit</button>
            )}
          </div>
        </WesternFrame>
      ))}
    </div>
  );
}