import React, { useState, useEffect, useCallback } from 'react';
import {
  User as UserIcon, Phone, Hash, LogOut, Loader2, Check,
  Wallet, ArrowDownToLine, ArrowUpFromLine, Crown, Gamepad2, Copy, Coins, History,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import WesternBackdrop from '@/components/WesternBackdrop';
import BackButton from '@/components/BackButton';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { getVipLevel, getNextVipLevel, BASE_RATE } from '@/lib/vipLevels';

const genUid = () => Math.floor(1000000000 + Math.random() * 9000000000).toString();
const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '');

const GAME_NAMES = {
  'wild-bounty': 'Wild Bounty',
  'lucky-wheel': 'Lucky Wheel',
  'hi-lo': 'High or Low',
  plinko: 'Plinko',
  mines: 'Mines',
  fullhouse: 'Super ACE',
  'rocket-crash': 'Rocket Crash',
};

const TX_META = {
  deposit: { icon: ArrowDownToLine, color: 'text-emerald-300', sign: '+' },
  bonus: { icon: Crown, color: 'text-amber-300', sign: '+' },
  withdraw: { icon: ArrowUpFromLine, color: 'text-rose-300', sign: '-' },
  adjustment: { icon: ArrowUpFromLine, color: 'text-slate-300', sign: '-' },
};

const OUTCOME_META = {
  win: 'bg-emerald-700/60 text-emerald-100 border-emerald-500/50',
  loss: 'bg-rose-800/50 text-rose-100 border-rose-600/50',
  push: 'bg-amber-700/50 text-amber-100 border-amber-500/50',
};

const TABS = [
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'games', label: 'Games', icon: Gamepad2 },
];

// Player profile: 10-digit uid, editable username & mobile, wallet balance,
// VIP level, deposit/withdraw history, and betting & win/loss history.
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
  const [totalDeposits, setTotalDeposits] = useState(0);

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
      const td = t
        .filter(x => x.type === 'deposit' && (x.status === 'approved' || x.status === 'completed'))
        .reduce((s, x) => s + (Number(x.amount) || 0), 0);
      setTotalDeposits(td);
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
  const vip = getVipLevel(totalDeposits);
  const next = getNextVipLevel(totalDeposits);
  const vipRate = vip?.rate ?? BASE_RATE;
  const vipProgress = next ? Math.min(100, (totalDeposits / next.minDeposit) * 100) : 100;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-stone-950 via-amber-950/40 to-stone-950 pb-8">
      <WesternBackdrop />
      <header className="sticky top-0 z-20 bg-stone-950/90 backdrop-blur-xl border-b border-amber-700/30">
        <div className="max-w-md mx-auto px-4 py-2 flex items-center gap-2">
          <BackButton />
          <div className="flex-1 text-center">
            <h1 className="text-sm font-black italic text-amber-200" style={{ fontFamily: 'Rye, Georgia, serif' }}>Profile</h1>
          </div>
          <div className="w-6" />
        </div>
      </header>

      <main className="relative z-10 max-w-md mx-auto px-4 py-4 flex flex-col gap-3">
        {/* Identity + uid + VIP */}
        <WesternFrame glow className="p-3 flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-md">
            <UserIcon className="w-5 h-5 text-stone-950" />
          </div>
          <h2 className="text-sm font-black italic text-amber-200" style={{ fontFamily: 'Rye, Georgia, serif' }}>
            {profile?.username || profile?.full_name || 'Player'}
          </h2>
          <p className="text-[10px] text-amber-100/70">{profile?.email}</p>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 border border-amber-700/40">
            <Hash className="w-2.5 h-2.5 text-amber-400/70" />
            <span className="text-[10px] font-mono tracking-wider text-amber-100/90 select-all">{uid || '—'}</span>
            <button
              onClick={async () => {
                try { await navigator.clipboard.writeText(uid); toast({ title: 'User ID copied' }); } catch { /* ignore */ }
              }}
              className="ml-0.5 text-amber-300/70 hover:text-amber-200 transition-colors"
              title="Copy User ID"
            >
              <Copy className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* VIP level badge */}
          <div
            className="w-full mt-1.5 px-2.5 py-1.5 rounded-md flex items-center justify-between gap-2"
            style={{
              border: '1px solid rgba(245,210,120,0.7)',
              background: 'linear-gradient(to bottom, rgba(58,40,18,0.6), rgba(26,18,9,0.7))',
            }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Crown className="w-3.5 h-3.5 shrink-0" style={{ color: vip?.color || '#8a7a5a' }} />
              <div className="min-w-0">
                <p className="text-[8px] tracking-widest uppercase text-amber-300/70 leading-none" style={{ fontFamily: 'Rye, Georgia, serif' }}>VIP Level</p>
                <p className="text-[11px] font-black italic leading-tight" style={{ fontFamily: 'Georgia, serif', color: vip?.color || '#d9b97a' }}>
                  {vip ? `${vip.name} · L${vip.level}` : 'None'}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[8px] tracking-widest uppercase text-amber-300/70 leading-none" style={{ fontFamily: 'Rye, Georgia, serif' }}>Stack Rate</p>
              <p className="text-[11px] font-black italic tabular-nums text-emerald-300 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>{(vipRate * 100).toFixed(2)}%</p>
            </div>
          </div>
          {next ? (
            <div className="w-full flex flex-col gap-0.5 mt-1">
              <div className="h-1.5 rounded-full bg-black/50 overflow-hidden border border-amber-700/30">
                <div className="h-full rounded-full transition-all" style={{ width: `${vipProgress}%`, background: `linear-gradient(to right, ${vip?.color || '#8a7a5a'}, ${next.color})` }} />
              </div>
              <p className="text-[9px] text-amber-100/45 italic text-center" style={{ fontFamily: 'Georgia, serif' }}>
                ${(next.minDeposit - totalDeposits).toFixed(0)} more to {next.name}
              </p>
            </div>
          ) : (
            <p className="text-[9px] text-amber-100/45 italic" style={{ fontFamily: 'Georgia, serif' }}>Highest VIP reached · Diamond</p>
          )}
        </WesternFrame>

        {/* Edit profile */}
        <WesternFrame className="p-2 flex flex-col gap-1.5">
          <div className="space-y-0.5">
            <label className="text-[8px] tracking-widest uppercase text-amber-300/70" style={{ fontFamily: 'Rye, Georgia, serif' }}>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Set a username"
              className="w-full px-3 py-1.5 rounded-md bg-black/40 border border-amber-700/40 text-amber-100 text-xs placeholder-amber-100/40 outline-none focus:border-amber-500"
              style={{ fontFamily: 'Georgia, serif' }}
            />
          </div>
          <div className="space-y-0.5">
            <label className="text-[8px] tracking-widest uppercase text-amber-300/70" style={{ fontFamily: 'Rye, Georgia, serif' }}>Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-amber-400/60" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                className="w-full pl-7 pr-3 py-1.5 rounded-md bg-black/40 border border-amber-700/40 text-amber-100 text-xs placeholder-amber-100/40 outline-none focus:border-amber-500"
                style={{ fontFamily: 'Georgia, serif' }}
              />
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="w-auto mx-auto px-3 py-1.5 rounded-md text-xs font-black italic shadow-md disabled:opacity-60 transition-all flex items-center justify-center gap-1.5"
            style={{
              border: '1px solid rgba(245,210,120,0.9)',
              background: 'linear-gradient(to bottom, #f5c542, #c8881e)',
              boxShadow: 'inset 0 1px 0 rgba(255,240,180,0.5), 0 2px 6px rgba(200,136,30,0.45)',
              color: '#2a1a06',
              fontFamily: 'Rye, Georgia, serif',
              textShadow: '0 1px 1px rgba(255,240,200,0.4)',
            }}
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save</>}
          </button>
        </WesternFrame>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1.5">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border transition-colors ${active ? 'bg-amber-400 text-stone-900 border-amber-300' : 'bg-black/30 text-amber-100/80 border-amber-700/40 hover:bg-black/50'}`}
                style={{ fontFamily: 'Rye, Georgia, serif' }}
              >
                <Icon className="w-4 h-4" /><span className="text-[10px] font-bold italic">{t.label}</span>
              </button>
            );
          })}
        </div>

        {tab === 'wallet' && (
          <div className="flex flex-col gap-2.5">
            <WesternFrame className="p-2.5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'rgba(245,197,66,0.18)' }}>
                <Wallet className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <div className="flex-1">
                <p className="text-[8px] tracking-widest uppercase text-amber-300/70" style={{ fontFamily: 'Rye, Georgia, serif' }}>Wallet Balance</p>
                <p className="text-base font-black italic text-yellow-100 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${balance.toFixed(2)}</p>
              </div>
              <Coins className="w-3.5 h-3.5 text-amber-400/50" />
            </WesternFrame>

            <div className="flex items-center gap-1.5 text-amber-200 px-0.5">
              <History className="w-3 h-3" />
              <h3 className="text-[11px] font-black italic" style={{ fontFamily: 'Rye, Georgia, serif' }}>Deposit & Withdraw History</h3>
            </div>
            {loadingHist ? (
              <p className="text-amber-100/60 text-[11px]">Loading...</p>
            ) : txs.length === 0 ? (
              <p className="text-amber-100/50 text-[11px] italic">No transactions yet.</p>
            ) : (
              txs.map((t) => {
                const m = TX_META[t.type] || TX_META.adjustment;
                const Icon = m.icon;
                return (
                  <WesternFrame key={t.id} className="p-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-black/40 flex items-center justify-center shrink-0">
                      <Icon className={`w-3 h-3 ${m.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-amber-100 capitalize text-[11px]" style={{ fontFamily: 'Georgia, serif' }}>{t.type}</p>
                      <p className="text-[9px] text-amber-100/50 italic">{fmtDate(t.created_date)} · {t.status}{t.note ? ` · ${t.note}` : ''}</p>
                    </div>
                    <span className={`font-black italic tabular-nums text-[12px] ${m.color}`} style={{ fontFamily: 'Georgia, serif' }}>{m.sign}${Number(t.amount).toFixed(2)}</span>
                  </WesternFrame>
                );
              })
            )}
          </div>
        )}

        {tab === 'games' && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-amber-200 px-0.5">
              <Gamepad2 className="w-3 h-3" />
              <h3 className="text-[11px] font-black italic" style={{ fontFamily: 'Rye, Georgia, serif' }}>Betting & Win/Loss History</h3>
            </div>
            {loadingHist ? (
              <p className="text-amber-100/60 text-[11px]">Loading...</p>
            ) : activity.length === 0 ? (
              <p className="text-amber-100/50 text-[11px] italic">No games played yet.</p>
            ) : (
              activity.map((a) => (
                <WesternFrame key={a.id} className="p-2 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-black/40 flex items-center justify-center shrink-0">
                    <Gamepad2 className="w-3 h-3 text-amber-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-amber-100 text-[11px]" style={{ fontFamily: 'Georgia, serif' }}>{GAME_NAMES[a.game_id] || a.game_id}</p>
                    <p className="text-[9px] text-amber-100/50 italic">Bet ${Number(a.bet).toFixed(2)} · {fmtDate(a.created_date)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="font-black italic tabular-nums text-yellow-100 text-[12px]" style={{ fontFamily: 'Georgia, serif' }}>${Number(a.win).toFixed(2)}</span>
                    <span className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded border ${OUTCOME_META[a.outcome] || OUTCOME_META.loss}`}>{a.outcome}</span>
                  </div>
                </WesternFrame>
              ))
            )}
          </div>
        )}

        <button
          onClick={() => logout()}
          className="w-auto mx-auto px-3 py-1.5 rounded-md border text-amber-100/80 text-[11px] font-bold italic hover:bg-rose-900/40 hover:text-rose-200 transition-colors flex items-center justify-center gap-1.5"
          style={{
            fontFamily: 'Rye, Georgia, serif',
            borderColor: 'rgba(190,140,55,0.6)',
            background: 'linear-gradient(to bottom, rgba(58,40,18,0.7), rgba(26,18,9,0.7))',
            boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.2), 0 1px 3px rgba(0,0,0,0.4)',
          }}
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </main>
    </div>
  );
}