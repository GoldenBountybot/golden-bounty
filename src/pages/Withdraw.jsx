import React, { useState, useEffect } from 'react';
import BackButton from '@/components/BackButton';
import WesternTitleBadge from '@/components/WesternTitleBadge';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import WesternBackdrop from '@/components/WesternBackdrop';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { Wallet, ArrowLeft, Send, AlertTriangle } from 'lucide-react';

const FONT = 'Rye, Georgia, serif';

const METHODS = [
  { id: 'binance', label: 'Binance Pay', badge: 'B', badgeClass: 'bg-amber-400 text-stone-950 ring-amber-200', hint: 'Withdraw to your Binance UID' },
  { id: 'usdt', label: 'USDT (Crypto)', badge: '₮', badgeClass: 'bg-emerald-500 text-white ring-emerald-300', hint: 'Withdraw USDT to your wallet' },
];

const DEFAULT_USDT_NETS = [
  { name: 'USDT TRX Network', color: '#26a17b' },
  { name: 'USDT BEP 20', color: '#f0b90b' },
  { name: 'USDT ETH Network', color: '#627eea' },
  { name: 'USDT POL Polygon Pos', color: '#8247e5' },
  { name: 'USDT SOL Solana Network', color: '#14f195' },
  { name: 'USDT TON Network', color: '#0098ea' },
];

const WOOD_BTN = {
  border: '1px solid rgba(190,140,55,0.7)',
  background: 'linear-gradient(to bottom, rgba(74,52,24,0.95), rgba(40,27,12,0.95))',
  boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.25), 0 1px 3px rgba(0,0,0,0.5)',
};
const GOLD_BTN = {
  border: '1px solid rgba(245,210,120,0.9)',
  background: 'linear-gradient(to bottom, #f5c542, #c8881e)',
  boxShadow: 'inset 0 1px 0 rgba(255,240,180,0.5), 0 3px 10px rgba(200,136,30,0.45)',
  color: '#2a1a06',
};
const NET_ACTIVE = {
  border: '1px solid rgba(245,210,120,0.9)',
  boxShadow: '0 0 12px rgba(255,200,80,0.35)',
  background: 'linear-gradient(to bottom, rgba(74,52,24,0.95), rgba(40,27,12,0.95))',
};

export default function Withdraw() {
  const params = new URLSearchParams(window.location.search);
  const amount = Number(params.get('amount') || 0);
  const { toast } = useToast();
  const { demoMode, wagerRemaining, maxWithdrawable } = useCasinoBalance();
  const [view, setView] = useState('choose'); // 'choose' | 'binance' | 'usdt'
  const [usdtNets, setUsdtNets] = useState(DEFAULT_USDT_NETS);
  const [selectedNet, setSelectedNet] = useState(null);
  const [binanceUid, setBinanceUid] = useState('');
  const [walletAddr, setWalletAddr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    base44.entities.PaymentAddress.filter({ method: 'usdt', active: true }, 'order', 100)
      .then(list => { if (list.length) setUsdtNets(list.map(r => ({ name: r.label || r.network, color: r.color || '#26a17b' }))); })
      .catch(() => {});
  }, []);

  const submit = async () => {
    if (view === 'binance' && !binanceUid.trim()) { toast({ title: 'Enter your Binance UID' }); return; }
    if (view === 'usdt') {
      if (!selectedNet) { toast({ title: 'Select a network first' }); return; }
      if (!walletAddr.trim()) { toast({ title: 'Enter your wallet address' }); return; }
    }
    setSubmitting(true);
    try {
      const user = await base44.auth.me().catch(() => null);
      if (!user) { toast({ title: 'Please log in first' }); setSubmitting(false); return; }
      if (amount > maxWithdrawable) {
        toast({
          title: 'Wagering requirement not met',
          description: wagerRemaining > 0
            ? `Play through or stack $${wagerRemaining.toFixed(2)} of your deposit before withdrawing.`
            : 'Only winnings above your locked deposit can be withdrawn.',
        });
        setSubmitting(false);
        return;
      }
      await base44.entities.Transaction.create({
        user_id: user.id,
        user_email: user.email,
        type: 'withdraw',
        amount,
        status: 'pending',
        method: view === 'binance' ? 'binance' : 'usdt',
        reference: view === 'binance' ? binanceUid.trim() : walletAddr.trim(),
        note: view === 'binance' ? `Binance Pay · UID ${binanceUid.trim()}` : `${selectedNet.name} · ${walletAddr.trim().slice(0, 14)}...`,
      });
      toast({ title: 'Withdrawal requested', description: 'Pending admin approval.' });
      setBinanceUid(''); setWalletAddr(''); setSelectedNet(null);
      setTimeout(() => { window.location.href = '/dashboard?tab=wallet'; }, 1000);
    } catch {
      toast({ title: 'Submission failed', description: 'Please try again.' });
    }
    setSubmitting(false);
  };

  return (
    <div className="relative min-h-screen bg-[#0b0b0d] pb-24">
      <WesternBackdrop />
      <header className="sticky top-0 z-20 backdrop-blur-xl" style={{ background: 'rgba(10,9,8,0.78)', borderBottom: '1px solid rgba(214,178,98,0.22)' }}>
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          {view !== 'choose' ? (
            <button onClick={() => { setView('choose'); setSelectedNet(null); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md italic font-bold border border-amber-600/80 text-amber-200 bg-black/40 active:scale-95" style={{ fontFamily: FONT }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <BackButton href="/dashboard" />
          )}
          <div className="flex-1 text-center">
            <WesternTitleBadge size="lg">{view === 'choose' ? 'Withdraw' : view === 'binance' ? 'Binance Pay' : 'USDT Withdraw'}</WesternTitleBadge>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-md mx-auto px-4 py-5 flex flex-col gap-4">
        {demoMode ? (
          <WesternFrame variant="glass" className="p-5 flex flex-col items-center gap-3 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <p className="text-amber-100 text-sm italic" style={{ fontFamily: FONT }}>Demo Mode is active.</p>
            <p className="text-amber-100/60 text-xs italic">Withdrawals are disabled while using the practice balance. Turn off Demo from the home page to withdraw real funds.</p>
            <button onClick={() => window.location.href = '/'} className="px-4 py-2 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 font-bold italic active:scale-95" style={{ fontFamily: FONT }}>Back to Home</button>
          </WesternFrame>
        ) : (
        <>
        <WesternFrame glow variant="glass" className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-widest uppercase text-amber-300/70">Withdrawing</p>
            <p className="text-2xl font-black italic text-yellow-100 tabular-nums" style={{ fontFamily: FONT }}>${amount.toFixed(2)}</p>
          </div>
          <Wallet className="w-8 h-8 text-amber-400/60" />
        </WesternFrame>

        {view === 'choose' && (
          <div className="flex flex-col gap-3">
            {METHODS.map(m => (
              <button
                key={m.id}
                onClick={() => setView(m.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-amber-700/40 bg-black/30 hover:bg-black/50 transition-all active:scale-[0.98]"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.18), 0 2px 6px rgba(0,0,0,0.5)' }}
              >
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ring-2 ${m.badgeClass}`}>
                  <span className="text-2xl font-black" style={{ fontFamily: FONT }}>{m.badge}</span>
                </div>
                <div className="flex-1 text-left">
                  <h2 className="text-base font-black italic text-amber-100" style={{ fontFamily: FONT }}>{m.label}</h2>
                  <p className="text-[11px] text-amber-100/50">{m.hint}</p>
                </div>
              </button>
            ))}
            <p className="text-[10px] text-amber-100/40 italic text-center mt-2">Choose your preferred withdrawal method · Approved by admin</p>
            {wagerRemaining > 0 && (
              <WesternFrame variant="glass" className="p-3 flex flex-col gap-1 text-center">
                <p className="text-[11px] text-amber-200 italic" style={{ fontFamily: FONT }}>Deposit play-through required</p>
                <p className="text-[10px] text-amber-100/70 italic">
                  ${wagerRemaining.toFixed(2)} of your deposit must be played in games or stacked before withdrawal. Withdrawable now: <span className="text-amber-200 font-bold">${maxWithdrawable.toFixed(2)}</span>.
                </p>
              </WesternFrame>
            )}
          </div>
        )}

        {view === 'binance' && (
          <WesternFrame variant="glass" className="p-4 flex flex-col gap-3">
            <h2 className="font-black italic text-amber-200" style={{ fontFamily: FONT }}>Enter Binance UID</h2>
            <p className="text-[11px] text-amber-100/60 italic">Enter your Binance Pay ID where you want to receive the funds.</p>
            <input
              type="text"
              value={binanceUid}
              onChange={e => setBinanceUid(e.target.value)}
              placeholder="e.g. 384920173"
              className="w-60 mx-auto px-3 py-1.5 rounded-md bg-black/40 border border-amber-700/40 text-amber-100 placeholder-amber-100/40 outline-none text-sm"
              style={{ fontFamily: FONT }}
            />
            <button
              onClick={submit}
              disabled={submitting}
              className="w-auto mx-auto px-3 py-1.5 rounded-md font-bold italic flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98]"
              style={{ ...GOLD_BTN, fontFamily: FONT }}
            >
              <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Withdrawal'}
            </button>
            <p className="text-[10px] text-amber-100/40 italic text-center">Funds sent after admin approves your request.</p>
          </WesternFrame>
        )}

        {view === 'usdt' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-amber-100/70 italic">Select a network, then enter your wallet address.</p>
            {usdtNets.map((n, i) => {
              const active = selectedNet?.name === n.name;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedNet(n)}
                  className="w-full flex items-center gap-3 p-3 rounded-md border transition-all"
                  style={active ? NET_ACTIVE : WOOD_BTN}
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-full shrink-0" style={{ background: n.color, boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                    <span className="text-sm font-black text-white">₮</span>
                  </span>
                  <span className="flex-1 text-left text-sm font-bold italic" style={{ fontFamily: FONT, color: active ? '#f3e2b3' : '#d9b97a' }}>{n.name}</span>
                  {active && <span className="text-xs font-bold text-amber-300">✓</span>}
                </button>
              );
            })}

            {selectedNet && (
              <WesternFrame variant="glass" className="p-4 flex flex-col gap-3">
                <h2 className="font-black italic text-amber-200" style={{ fontFamily: FONT }}>Your Wallet Address</h2>
                <p className="text-[11px] text-amber-100/60 italic">Network: {selectedNet.name}</p>
                <input
                  type="text"
                  value={walletAddr}
                  onChange={e => setWalletAddr(e.target.value)}
                  placeholder="Paste your USDT wallet address"
                  className="w-60 mx-auto px-3 py-1.5 rounded-md bg-black/40 border border-amber-700/40 text-amber-100 placeholder-amber-100/40 outline-none text-sm"
                  style={{ fontFamily: 'monospace' }}
                />
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="w-auto mx-auto px-3 py-1.5 rounded-md font-bold italic flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98]"
                  style={{ ...GOLD_BTN, fontFamily: FONT }}
                >
                  <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Withdrawal'}
                </button>
                <p className="text-[10px] text-amber-100/40 italic text-center">Funds sent after admin approves your request.</p>
              </WesternFrame>
            )}
            </div>
            )}
            </>
            )}
            </main>
            </div>
            );
            }