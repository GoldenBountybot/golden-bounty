import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import AdminPlayerDetail from '@/components/admin/AdminPlayerDetail';
import { Search, Eye, Hash, Ban, ShieldCheck } from 'lucide-react';

export default function AdminPlayers() {
  const [users, setUsers] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ balance: 0, role: 'user', phone: '' });
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [ulist, wlist] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Wallet.list('-created_date', 500),
      ]);
      setUsers(ulist);
      setWallets(wlist);
    }
    catch { toast({ title: 'Failed to load users' }); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const walletMap = Object.fromEntries(wallets.map(w => [w.user_id, w]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.uid && u.uid.includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  }, [users, query]);

  const startEdit = (u) => {
    setEditing(u.id);
    setForm({ balance: walletMap[u.id]?.balance ?? 0, role: u.role || 'user', phone: u.phone || '' });
  };
  const save = async (u) => {
    try {
      // Set the REAL wallet balance via the secure adminAdjustWallet function
      // (service role). Setting User.balance directly had no effect on the
      // authoritative Wallet balance — now we set Wallet and only update
      // non-financial fields (role, phone) on the User entity.
      await base44.functions.invoke('adminAdjustWallet', { user_id: u.id, set_balance: true, delta: Number(form.balance) });
      await base44.entities.User.update(u.id, { role: form.role, phone: form.phone });
      toast({ title: 'User updated' });
      setEditing(null);
      load();
    } catch { toast({ title: 'Update failed' }); }
  };

  const toggleBan = async (u) => {
    try {
      await base44.entities.User.update(u.id, { banned: !u.banned });
      toast({ title: u.banned ? 'User unbanned' : 'User banned' });
      load();
    } catch { toast({ title: 'Action failed' }); }
  };

  if (selected) {
    return <AdminPlayerDetail user={selected} onBack={() => { setSelected(null); load(); }} onSaved={load} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Players ({users.length})</h2>

      {/* UID / email / username search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/60" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by UID, email or username"
          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-black/40 border border-amber-700/40 text-amber-100 placeholder-amber-100/40 outline-none focus:border-amber-500 text-sm"
          style={{ fontFamily: 'Georgia, serif' }}
        />
      </div>

      {loading ? (
        <p className="text-amber-100/60">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-amber-100/50 text-sm italic">No players match "{query}".</p>
      ) : filtered.map(u => (
        <WesternFrame key={u.id} className="p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-100 truncate">{u.email}</p>
              <p className="text-xs text-amber-100/60 flex items-center gap-1"><Hash className="w-3 h-3 text-amber-400/60" />{u.uid || '—'}</p>
              <p className="text-xs text-amber-100/60">Role: {u.role} · Phone: {u.phone || '—'}</p>
              <p className="text-sm text-yellow-200 font-bold">${(walletMap[u.id]?.balance ?? 0).toFixed(2)}{u.rtp != null ? ` · RTP ${u.rtp}%` : ''}</p>
              {u.banned && <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 border border-red-500/50 text-red-400">BANNED</span>}
            </div>
            <div className="flex flex-col gap-1.5 items-end">
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
                <div className="flex gap-1.5">
                  <button onClick={() => setSelected(u)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-400 text-stone-900 text-xs font-bold italic" style={{ fontFamily: 'Georgia, serif' }}>
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button onClick={() => startEdit(u)} className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-amber-700/40 text-amber-100 text-xs font-bold italic" style={{ fontFamily: 'Georgia, serif' }}>Edit</button>
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => toggleBan(u)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold italic"
                      style={{
                        fontFamily: 'Georgia, serif',
                        background: u.banned ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                        border: u.banned ? '1px solid rgba(52,211,153,0.5)' : '1px solid rgba(248,113,113,0.5)',
                        color: u.banned ? '#34d399' : '#f87171',
                      }}
                    >
                      {u.banned ? <><ShieldCheck className="w-3.5 h-3.5" /> Unban</> : <><Ban className="w-3.5 h-3.5" /> Ban</>}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </WesternFrame>
      ))}
    </div>
  );
}