import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import {
  ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Gift, Gamepad2,
  Hash, Mail, Phone, User as UserIcon, Wallet, Save,
} from 'lucide-react';
import { formatDateTime } from '@/lib/dateFormat';

// Shows the viewer's own local time (backend stores UTC).
const fmtDate = (d) => (d ? formatDateTime(d) : '');

const TX_META = {
  deposit: { icon: ArrowDownToLine, color: 'text-emerald-300', sign: '+' },
  bonus: { icon: Gift, color: 'text-amber-300', sign: '+' },
  withdraw: { icon: ArrowUpFromLine, color: 'text-rose-300', sign: '-' },
  adjustment: { icon: ArrowUpFromLine, color: 'text-slate-300', sign: '-' },
};

const GAME_NAMES = {
  'wild-bounty': 'Wild Bounty',
  'lucky-wheel': 'Lucky Wheel',
  'hi-lo': 'High or Low',
  plinko: 'Plinko',
  mines: 'Mines',
};

const OUTCOME_META = {
  win: 'bg-emerald-700/60 text-emerald-100 border-emerald-500/50',
  loss: 'bg-rose-800/50 text-rose-100 border-rose-600/50',
  push: 'bg-amber-700/50 text-amber-100 border-amber-500/50',
};

// Full per-player view for the admin: profile, balance + winning-chance (RTP) control,
// transaction history, and game win/loss history.
export default function AdminPlayerDetail({ user, onBack, onSaved }) {
  const { toast } = useToast();
  const [rtp, setRtp] = useState(50);
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [t, a, w] = await Promise.all([
          base44.entities.Transaction.filter({ user_id: user.id }, '-created_date', 50),
          base44.entities.PlayerActivity.filter({ user_id: user.id }, '-created_date', 50),
          base44.entities.Wallet.filter({ user_id: user.id }, '-created_date', 10),
        ]);
        if (!active) return;
        setTxs(t);
        setActivity(a);
        if (w && w[0]) {
          setBalance(Number(w[0].balance ?? 0));
          if (w[0].rtp != null) setRtp(Number(w[0].rtp));
        }
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user.id]);

  const save = async () => {
    setSaving(true);
    try {
      // Balance AND per-player RTP are both set on the RLS-protected Wallet
      // entity via one adminAdjustWallet call (admin-only write). RTP no
      // longer goes through User.update — that was hackable via updateMe.
      await base44.functions.invoke('adminAdjustWallet', { user_id: user.id, set_balance: true, delta: Number(balance), rtp: Number(rtp) });
      toast({ title: 'Player updated' });
      onSaved?.();
    } catch {
      toast({ title: 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-stone-950 via-amber-950/40 to-stone-950 overflow-y-auto">
      <header className="sticky top-0 z-20 bg-stone-950/90 backdrop-blur-xl border-b border-amber-700/30">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 border border-amber-600/50 text-amber-100 text-sm font-bold italic hover:bg-black/50 transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="flex-1 text-center text-base font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Player Detail</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 flex flex-col gap-4 pb-16">
        {/* Identity */}
        <WesternFrame glow className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-stone-950" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-black italic text-amber-200 truncate" style={{ fontFamily: 'Georgia, serif' }}>
                {user.username || user.full_name || 'Player'}
              </h2>
              <p className="text-xs text-amber-100/70 flex items-center gap-1 truncate"><Mail className="w-3 h-3" /> {user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="flex items-center gap-1.5 text-xs text-amber-100/80">
              <Hash className="w-3 h-3 text-amber-400/70" />
              <span className="font-mono tracking-wider select-all">{user.uid || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-100/80">
              <Phone className="w-3 h-3 text-amber-400/70" /> {user.phone || '—'}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-100/80">
              <span className="text-amber-400/70 font-bold">Role</span> {user.role}
            </div>
          </div>
        </WesternFrame>

        {/* Balance + Winning chance control */}
        <WesternFrame className="p-4 flex flex-col gap-3">
          <div>
            <label className="text-[10px] tracking-widest uppercase text-amber-300/70 flex items-center gap-1" style={{ fontFamily: 'Georgia, serif' }}>
              <Wallet className="w-3 h-3" /> Wallet Balance
            </label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-md bg-black/40 border border-amber-700/40 text-yellow-100 font-black italic text-lg tabular-nums outline-none focus:border-amber-500"
              style={{ fontFamily: 'Georgia, serif' }}
            />
          </div>
          <div>
            <label className="text-[10px] tracking-widest uppercase text-amber-300/70 flex items-center justify-between" style={{ fontFamily: 'Georgia, serif' }}>
              <span>Winning Chance (All Games)</span>
              <span className="text-yellow-200 font-black">{rtp}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={rtp}
              onChange={(e) => setRtp(Number(e.target.value))}
              className="w-full accent-amber-400 mt-1.5"
            />
            <p className="text-[10px] text-amber-100/50 italic mt-1">Overrides global/per-game RTP for this player. Lower = harder to win.</p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 text-base font-black italic shadow-lg hover:from-amber-300 hover:to-orange-400 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </WesternFrame>

        {/* Transactions */}
        <div>
          <h3 className="text-sm font-black italic text-amber-200 mb-2" style={{ fontFamily: 'Georgia, serif' }}>Deposit & Withdraw History</h3>
          {loading ? (
            <p className="text-amber-100/60 text-sm">Loading...</p>
          ) : txs.length === 0 ? (
            <p className="text-amber-100/50 text-sm italic">No transactions yet.</p>
          ) : (
            txs.map((t) => {
              const m = TX_META[t.type] || TX_META.adjustment;
              const Icon = m.icon;
              return (
                <WesternFrame key={t.id} className="p-3 mb-2 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-black/40 flex items-center justify-center">
                    <Icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-amber-100 capitalize text-sm">{t.type}</p>
                    <p className="text-[11px] text-amber-100/50">{fmtDate(t.created_date)} · {t.status}</p>
                  </div>
                  <span className={`font-black italic tabular-nums ${m.color}`}>{m.sign}${Number(t.amount).toFixed(2)}</span>
                </WesternFrame>
              );
            })
          )}
        </div>

        {/* Game history */}
        <div>
          <h3 className="text-sm font-black italic text-amber-200 mb-2" style={{ fontFamily: 'Georgia, serif' }}>Game Win/Loss History</h3>
          {loading ? (
            <p className="text-amber-100/60 text-sm">Loading...</p>
          ) : activity.length === 0 ? (
            <p className="text-amber-100/50 text-sm italic">No games played yet.</p>
          ) : (
            activity.map((a) => (
              <WesternFrame key={a.id} className="p-3 mb-2 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-black/40 flex items-center justify-center">
                  <Gamepad2 className="w-4 h-4 text-amber-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-amber-100 text-sm">{GAME_NAMES[a.game_id] || a.game_id}</p>
                  <p className="text-[11px] text-amber-100/50">Bet ${Number(a.bet).toFixed(2)} · {fmtDate(a.created_date)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-black italic tabular-nums text-yellow-100">${Number(a.win).toFixed(2)}</span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${OUTCOME_META[a.outcome] || OUTCOME_META.loss}`}>{a.outcome}</span>
                </div>
              </WesternFrame>
            ))
          )}
        </div>
      </main>
    </div>
  );
}