import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { pushNotification } from '@/lib/notify';
import { applyReferralCommission } from '@/lib/referral';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import WithdrawalRiskPanel from '@/components/admin/WithdrawalRiskPanel';

export default function AdminTransactions() {
  const [txs, setTxs] = useState([]);
  const [users, setUsers] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ user_id: '', amount: '', type: 'deposit', note: '' });
  const [review, setReview] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [list, ulist, wlist] = await Promise.all([
        base44.entities.Transaction.list('-created_date', 100),
        base44.entities.User.list(),
        base44.entities.Wallet.list('-created_date', 500),
      ]);
      setTxs(list);
      setUsers(ulist);
      setWallets(wlist);
    } catch { toast({ title: 'Failed to load' }); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const userMap = Object.fromEntries(users.map(u => [u.id, u]));
  const walletMap = Object.fromEntries(wallets.map(w => [w.user_id, w]));
  const userBal = (id) => Number(walletMap[id]?.balance ?? 0);

  const addTx = async () => {
    const amt = Number(form.amount);
    if (!form.user_id || !amt) { toast({ title: 'Select player & amount' }); return; }
    const u = userMap[form.user_id];
    if (!u) { toast({ title: 'Player not found' }); return; }
    const credit = form.type === 'deposit' || form.type === 'bonus';
    try {
      await base44.entities.Transaction.create({
        user_id: u.id, user_email: u.email, type: form.type, amount: amt,
        status: 'completed', method: 'manual', note: form.note,
      });
      // Apply the balance change through the secure adminAdjustWallet backend
      // function (service role) — re-reads the authoritative Wallet balance
      // so admin credits never overwrite gameplay, and the Wallet RLS blocks
      // direct user tampering.
      const delta = credit ? amt : -amt;
      const wagerDelta = form.type === 'deposit' ? amt : 0;
      await base44.functions.invoke('adminAdjustWallet', { user_id: u.id, delta, wager_delta: wagerDelta });
      // 5% referral commission to the referrer on real deposits.
      if (form.type === 'deposit') applyReferralCommission(u.id, amt);
      // Notify the player about the new credit/debit.
      const label = form.type === 'withdraw' ? 'Withdraw approved' : form.type === 'bonus' ? 'Bonus arrived' : form.type === 'adjustment' ? 'Balance adjusted' : 'Deposit approved';
      const nType = form.type === 'withdraw' ? 'withdraw_approved' : form.type === 'bonus' ? 'bonus_arrived' : 'deposit_approved';
      const verb = credit ? 'credited to' : 'debited from';
      await pushNotification({ user_id: u.id, type: nType, title: label, body: `$${amt.toFixed(2)} ${verb} your balance`, amount: amt });
      setForm({ user_id: '', amount: '', type: 'deposit', note: '' });
      toast({ title: 'Transaction applied' });
      load();
    } catch { toast({ title: 'Failed' }); }
  };

  const setStatus = async (tx, status) => {
    try {
      if (status === 'completed') {
        const credit = tx.type === 'deposit' || tx.type === 'bonus';
        const amt = Number(tx.amount) || 0;
        // Apply through the secure adminAdjustWallet backend function — it
        // re-reads the authoritative Wallet balance server-side so admin
        // credits never overwrite gameplay.
        const delta = credit ? amt : -amt;
        const wagerDelta = tx.type === 'deposit' ? amt : 0;
        await base44.functions.invoke('adminAdjustWallet', { user_id: tx.user_id, delta, wager_delta: wagerDelta });
        // 5% referral commission to the referrer on approved deposits.
        if (tx.type === 'deposit') applyReferralCommission(tx.user_id, amt);
      }
      await base44.entities.Transaction.update(tx.id, { status });
      // Notify the player of the status change.
      if (status === 'completed') {
        const credit = tx.type === 'deposit' || tx.type === 'bonus';
        const nType = tx.type === 'withdraw' ? 'withdraw_approved' : tx.type === 'bonus' ? 'bonus_arrived' : 'deposit_approved';
        const label = tx.type === 'withdraw' ? 'Withdraw approved' : tx.type === 'bonus' ? 'Bonus arrived' : 'Deposit approved';
        const verb = credit ? 'credited to' : 'sent from';
        await pushNotification({ user_id: tx.user_id, type: nType, title: label, body: `$${Number(tx.amount).toFixed(2)} ${verb} your balance`, amount: Number(tx.amount) });
      } else if (status === 'rejected') {
        await pushNotification({ user_id: tx.user_id, type: 'system', title: `${tx.type === 'withdraw' ? 'Withdraw' : 'Deposit'} request rejected`, body: `Your $${Number(tx.amount).toFixed(2)} request was rejected.` });
      }
      toast({ title: `Marked ${status}` });
      load();
    } catch { toast({ title: 'Failed' }); }
  };

  const q = search.trim().toLowerCase();
  const shown = txs.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (!q) return true;
    return t.user_id && t.user_id.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-4">
      <WesternFrame className="p-4 flex flex-col gap-2">
        <h2 className="font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Add Transaction</h2>
        <div className="grid grid-cols-2 gap-2">
          <select value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} className="px-2 py-2 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm">
            <option value="">Select player</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
          </select>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="px-2 py-2 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm">
            <option value="deposit">Deposit (credit)</option>
            <option value="withdraw">Withdraw (debit)</option>
            <option value="bonus">Bonus (credit)</option>
            <option value="adjustment">Adjustment (debit)</option>
          </select>
          <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount" className="px-2 py-2 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm" />
          <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Note" className="px-2 py-2 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm" />
        </div>
        <button onClick={addTx} className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 font-bold italic" style={{ fontFamily: 'Georgia, serif' }}>Apply</button>
      </WesternFrame>

      <div className="flex gap-2 flex-wrap items-center">
        {['all', 'pending', 'completed', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-bold italic border capitalize ${filter === f ? 'bg-amber-400 text-stone-900 border-amber-300' : 'bg-black/30 text-amber-100/80 border-amber-700/40'}`}>{f}</button>
        ))}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by user id"
          className="flex-1 min-w-[140px] px-3 py-1.5 rounded-md bg-black/40 border border-amber-700/40 text-amber-100 text-sm placeholder-amber-100/40 outline-none"
        />
      </div>

      <h2 className="font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>History</h2>
      {loading ? (
        <p className="text-amber-100/60">Loading...</p>
      ) : shown.length === 0 ? (
        <p className="text-amber-100/50 text-sm italic">No transactions yet.</p>
      ) : shown.map(t => (
        <WesternFrame key={t.id} className="p-3 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-100 truncate">{t.user_email || t.user_id}</p>
            <p className="text-xs text-amber-100/60 capitalize">{t.type} · ${t.amount} · {t.status} · {t.method}</p>
            {t.note && <p className="text-xs text-amber-100/40 italic">{t.note}</p>}
            {t.reference && <p className="text-[10px] text-amber-100/50 font-mono break-all">TXID: {t.reference}</p>}
          </div>
          {t.status === 'pending' && (
            <div className="flex gap-1">
              <button onClick={() => setReview(t)} className="px-2 py-1 rounded bg-amber-500 text-stone-950 text-xs font-bold">Review</button>
              <button onClick={() => setStatus(t, 'completed')} className="px-2 py-1 rounded bg-emerald-500 text-white text-xs font-bold">Approve</button>
              <button onClick={() => setStatus(t, 'rejected')} className="px-2 py-1 rounded bg-rose-600 text-white text-xs font-bold">Reject</button>
            </div>
          )}
        </WesternFrame>
      ))}

      {review && (
        <WithdrawalRiskPanel
          userId={review.user_id}
          userEmail={review.user_email}
          onClose={() => setReview(null)}
        />
      )}
    </div>
  );
}