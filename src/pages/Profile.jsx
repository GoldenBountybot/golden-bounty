import React, { useState, useEffect, useCallback } from 'react';
import {
  User as UserIcon, Phone, Hash, LogOut, Loader2, Check,
  Wallet, ArrowDownToLine, ArrowUpFromLine, Gift, Gamepad2, Copy,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import BackButton from '@/components/BackButton';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useCasinoBalance } from '@/lib/useCasinoBalance';

const genUid = () => Math.floor(1000000000 + Math.random() * 9000000000).toString();
const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '');

const GAME_NAMES = {
  'wild-bounty': 'Wild Bounty',
  'lucky-wheel': 'Lucky Wheel',
  'hi-lo': 'High or Low',
  plinko: 'Plinko',
  mines: 'Mines',
};

const TX_META = {
  deposit: { icon: ArrowDownToLine, color: 'text-emerald-300', sign: '+' },
  bonus: { icon: Gift, color: 'text-amber-300', sign: '+' },
  withdraw: { icon: ArrowUpFromLine, color: 'text-rose-300', sign: '-' },
  adjustment: { icon: ArrowUpFromLine, color: 'text-slate-300', sign: '-' },
};

const OUTCOME_META = {
  win: 'bg-emerald-700/60 text-emerald-100 border-emerald-500/50',
  loss: 'bg-rose-800/50 text-rose-100 border-rose-600/50',
  push: 'bg-amber-700/50 text-amber-100 border-amber-500/50',
};

// Player profile: 10-digit uid, editable username & mobile, wallet balance,
// deposit/withdraw history, and betting & win/loss history.
export default function Profile() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const { balance } = useCasinoBalance();
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('wallet');
  const [txs, setTxs] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loadingHist, setLoadingHist] = useState(true);

  // Load (and ensure a 10-digit uid exists for) the current player.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let u = await base44.auth.me();
        if (!u.uid || !/^\d{10}$/.test(String(u.uid))) {
          const uid = genUid();
          try { await base44.auth.updateMe({ uid }); u = { ...u, uid }; } catch { /* ignore */ }
        }
        if (!active) return;
        setProfile(u);
        setUsername(u.username || '');
        setPhone(u.phone || '');
      } catch {
        /* ignore */
      }
    })();
    return () => { active = false; };
  }, []);

  const loadHistory = useCallback(async () => {
    if (!profile) return;
    setLoadingHist(true);
    try {
      const [t, a] = await Promise.all([
        base44.entities.Transaction.filter({ user_id: profile.id }, '-created_date', 50),
        base44.entities.PlayerActivity.filter({ user_id: profile.id }, '-created_date', 50),
      ]);
      setTxs(t);
      setActivity(a);
    } catch {
      /* ignore */
    } finally {
      setLoadingHist(false);
    }
  }, [profile]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ username, phone });
      setProfile((p) => ({ ...p, username, phone }));
      toast({ title: 'Profile updated' });
    } catch (e) {
      toast({ title: 'Update failed', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const uid = profile?.uid || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-amber-950/40 to-stone-950 pb-10">
      <header className="sticky top-0 z-20 bg-stone-950/90 backdrop-blur-xl border-b border-amber-700/30">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <BackButton />
          <div className="flex-1 text-center">
            <h1 className="text-base font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Profile</h1>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Identity + uid */}
        <WesternFrame glow className="p-5 flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-stone-950" />
          </div>
          <h2 className="text-lg font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>
            {profile?.username || profile?.full_name || 'Player'}
          </h2>
          <p className="text-xs text-amber-100/70">{profile?.email}</p>
          <div className="flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full bg-black/40 border border-amber-700/40">
            <Hash className="w-3 h-3 text-amber-400/70" />
            <span className="text-[12px] font-mono tracking-wider text-amber-100/90 select-all">{uid || '—'}</span>
            <button
              onClick={async () => {
                try { await navigator.clipboard.writeText(uid); toast({ title: 'User ID copied' }); } catch { /* ignore */ }
              }}
              className="ml-0.5 text-amber-300/70 hover:text-amber-200 transition-colors"
              title="Copy User ID"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </WesternFrame>

        {/* Edit profile */}
        <WesternFrame className="p-4 flex flex-col gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-widest uppercase text-amber-300/70" style={{ fontFamily: 'Georgia, serif' }}>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Set a username"
              className="w-full px-3 py-2.5 rounded-md bg-black/40 border border-amber-700/40 text-amber-100 placeholder-amber-100/40 outline-none focus:border-amber-500"
              style={{ fontFamily: 'Georgia, serif' }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-widest uppercase text-amber-300/70" style={{ fontFamily: 'Georgia, serif' }}>Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/60" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                className="w-full pl-9 pr-3 py-2.5 rounded-md bg-black/40 border border-amber-700/40 text-amber-100 placeholder-amber-100/40 outline-none focus:border-amber-500"
                style={{ fontFamily: 'Georgia, serif' }}
              />
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 text-base font-black italic shadow-lg hover:from-amber-300 hover:to-orange-400 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Changes</>}
          </button>
        </WesternFrame>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('wallet')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold italic border transition-colors ${tab === 'wallet' ? 'bg-amber-400 text-stone-950 border-amber-300' : 'bg-black/30 text-amber-100/80 border-amber-700/40'}`}
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Wallet
          </button>
          <button
            onClick={() => setTab('games')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold italic border transition-colors ${tab === 'games' ? 'bg-amber-400 text-stone-950 border-amber-300' : 'bg-black/30 text-amber-100/80 border-amber-700/40'}`}
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Game History
          </button>
        </div>

        {tab === 'wallet' && (
          <>
            <WesternFrame className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-amber-300" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] tracking-widest uppercase text-amber-300/70" style={{ fontFamily: 'Georgia, serif' }}>Wallet Balance</p>
                <p className="text-xl font-black italic text-yellow-100 tabular-nums">${balance.toFixed(2)}</p>
              </div>
            </WesternFrame>

            <h3 className="text-sm font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Deposit & Withdraw History</h3>
            {loadingHist ? (
              <p className="text-amber-100/60 text-sm">Loading...</p>
            ) : txs.length === 0 ? (
              <p className="text-amber-100/50 text-sm italic">No transactions yet.</p>
            ) : (
              txs.map((t) => {
                const m = TX_META[t.type] || TX_META.adjustment;
                const Icon = m.icon;
                return (
                  <WesternFrame key={t.id} className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-black/40 flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${m.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-amber-100 capitalize text-sm">{t.type}</p>
                      <p className="text-[11px] text-amber-100/50">{fmtDate(t.created_date)} · {t.status}{t.note ? ` · ${t.note}` : ''}</p>
                    </div>
                    <span className={`font-black italic tabular-nums ${m.color}`}>{m.sign}${Number(t.amount).toFixed(2)}</span>
                  </WesternFrame>
                );
              })
            )}
          </>
        )}

        {tab === 'games' && (
          <>
            <h3 className="text-sm font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Betting & Win/Loss History</h3>
            {loadingHist ? (
              <p className="text-amber-100/60 text-sm">Loading...</p>
            ) : activity.length === 0 ? (
              <p className="text-amber-100/50 text-sm italic">No games played yet.</p>
            ) : (
              activity.map((a) => (
                <WesternFrame key={a.id} className="p-3 flex items-center gap-3">
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
          </>
        )}

        <button
          onClick={() => logout()}
          className="w-full py-3 rounded-xl bg-black/30 border border-amber-700/40 text-amber-100/80 text-sm font-bold italic hover:bg-rose-900/40 hover:text-rose-200 transition-colors flex items-center justify-center gap-2"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </main>
    </div>
  );
}