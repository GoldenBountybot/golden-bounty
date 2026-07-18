import React, { useState } from 'react';
import BackButton from '@/components/BackButton';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { Bitcoin, Coins, Wallet, Copy, Check, ArrowLeft, Send } from 'lucide-react';

const METHODS = [
  { id: 'binance', label: 'Pay with Binance', badge: 'B', badgeClass: 'bg-amber-400 text-stone-950 ring-amber-200', hint: 'Binance Pay wallet' },
  { id: 'usdt', label: 'Pay USDT in Crypto', badge: '₮', badgeClass: 'bg-emerald-500 text-white ring-emerald-300', hint: 'Tether (USDT) transfer' },
  { id: 'crypto', label: 'Pay Crypto', badge: null, icon: Bitcoin, iconClass: 'text-amber-300', hint: 'BTC / ETH / other coins' },
];

const USDT_NETWORKS = [
  { name: 'USDT TRX Network', address: 'TMxeqrx8Fx1bUfuLaGQHZ6tct9rEiYo2tM' },
  { name: 'USDT BEP 20', address: '0xbe44b1608cd0a7e7f18166d18ad2c21a61bd6570' },
  { name: 'USDT ETH Network', address: '0xbe44b1608cd0a7e7f18166d18ad2c21a61bd6570' },
  { name: 'USDT POL Polygon Pos', address: '0xbe44b1608cd0a7e7f18166d18ad2c21a61bd6570' },
  { name: 'USDT SOL Solana Network', address: '7UTV9h1VHq2gxjEoCLyJSPhoiz1NAaEHAL8qwTzy4sAy' },
  { name: 'USDT TON Network', address: 'UQCTtNPN9ZzlXWsiE-VHApcouD8tFHgBIcC3hD-GcQdDrgKN' },
  { name: 'USDT AVAX-C Chain', address: '0xbe44b1608cd0a7e7f18166d18ad2c21a61bd6570' },
  { name: 'USDT APT Aptos Network', address: '0x6c0ab824258561892ea86cb25537a3fa2f98dac3807274857eceacde0f0cba40' },
];

function CopyAddr({ addr }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(addr);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = addr; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-amber-600/60 bg-black/40 text-amber-200 text-xs font-bold italic hover:bg-black/60 active:scale-95" style={{ fontFamily: 'Georgia, serif' }}>
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function PayMethod() {
  const params = new URLSearchParams(window.location.search);
  const amount = Number(params.get('amount') || 0);
  const { toast } = useToast();
  const [view, setView] = useState('choose'); // 'choose' | 'usdt'
  const [selectedNet, setSelectedNet] = useState(null);
  const [txid, setTxid] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const choose = (m) => {
    if (m.id === 'usdt') { setView('usdt'); return; }
    toast({ title: `${m.label} selected`, description: 'Payment processing coming soon.' });
  };

  const submitTxid = async () => {
    if (!selectedNet) { toast({ title: 'Select a network first' }); return; }
    if (!txid.trim()) { toast({ title: 'Enter your transaction ID' }); return; }
    setSubmitting(true);
    try {
      let user = null;
      try { user = await base44.auth.me(); } catch {}
      if (!user) { toast({ title: 'Please log in first' }); setSubmitting(false); return; }
      await base44.entities.Transaction.create({
        user_id: user.id,
        user_email: user.email,
        type: 'deposit',
        amount,
        status: 'pending',
        method: 'usdt',
        reference: txid.trim(),
        note: `${selectedNet.name} · ${selectedNet.address.slice(0, 10)}...`,
      });
      toast({ title: 'Transaction submitted', description: 'Pending admin approval.' });
      setTxid('');
      setSelectedNet(null);
      setTimeout(() => { window.location.href = '/dashboard'; }, 900);
    } catch {
      toast({ title: 'Submission failed', description: 'Please try again.' });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-green-950 to-stone-950 pb-10">
      <header className="sticky top-0 z-20 bg-emerald-950/90 backdrop-blur-xl border-b border-amber-600/30">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          {view === 'usdt' ? (
            <button onClick={() => { setView('choose'); setSelectedNet(null); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md italic font-bold border border-amber-600/80 text-amber-200 bg-black/40 active:scale-95" style={{ fontFamily: 'Rye, Georgia, serif' }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <BackButton href="/dashboard" />
          )}
          <div className="flex-1 text-center">
            <h1 className="text-base font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>{view === 'usdt' ? 'USDT Deposit' : 'Choose Payment'}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 flex flex-col gap-4">
        <WesternFrame glow className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-widest uppercase text-amber-300/70">Depositing</p>
            <p className="text-2xl font-black italic text-yellow-100 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${amount.toFixed(2)}</p>
          </div>
          <Wallet className="w-8 h-8 text-amber-400/60" />
        </WesternFrame>

        {view === 'choose' && (
          <div className="flex flex-col gap-3">
            {METHODS.map(m => (
              <button
                key={m.id}
                onClick={() => choose(m)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-amber-700/40 bg-black/30 hover:bg-black/50 transition-all active:scale-[0.98]"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.18), 0 2px 6px rgba(0,0,0,0.5)' }}
              >
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ring-2 ${m.badgeClass || 'bg-black/40 ring-amber-700/40'}`}>
                  {m.badge ? <span className="text-2xl font-black" style={{ fontFamily: 'Georgia, serif' }}>{m.badge}</span> : m.icon ? <m.icon className={`w-7 h-7 ${m.iconClass || ''}`} /> : null}
                </div>
                <div className="flex-1 text-left">
                  <h2 className="text-base font-black italic text-amber-100" style={{ fontFamily: 'Georgia, serif' }}>{m.label}</h2>
                  <p className="text-[11px] text-amber-100/50">{m.hint}</p>
                </div>
              </button>
            ))}
            <p className="text-[10px] text-amber-100/40 italic text-center mt-2">Minimum deposit $1.00 · Choose your preferred method</p>
          </div>
        )}

        {view === 'usdt' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-amber-100/70 italic">Send USDT to one of the addresses below, then submit your transaction ID for admin approval.</p>
            {USDT_NETWORKS.map((n, i) => {
              const active = selectedNet?.name === n.name;
              return (
                <WesternFrame key={i} className={`p-3 flex flex-col gap-2 ${active ? 'ring-2 ring-amber-300' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>{n.name}</p>
                    <CopyAddr addr={n.address} />
                  </div>
                  <p className="text-[11px] text-amber-100/80 break-all font-mono">{n.address}</p>
                  <button
                    onClick={() => setSelectedNet(n)}
                    className={`self-start px-3 py-1 rounded-md text-xs font-bold italic border ${active ? 'bg-amber-400 text-stone-950 border-amber-300' : 'bg-black/40 text-amber-200 border-amber-700/40'}`}
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    {active ? '✓ Selected' : 'Select this network'}
                  </button>
                </WesternFrame>
              );
            })}

            <WesternFrame className="p-4 flex flex-col gap-3">
              <h2 className="font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Submit Transaction ID</h2>
              {selectedNet && <p className="text-[11px] text-amber-100/60 italic">Network: {selectedNet.name}</p>}
              <input
                type="text"
                value={txid}
                onChange={e => setTxid(e.target.value)}
                placeholder="Paste your USDT transaction ID / hash"
                className="px-3 py-2 rounded-md bg-black/40 border border-amber-700/40 text-amber-100 placeholder-amber-100/40 outline-none text-sm"
              />
              <button
                onClick={submitTxid}
                disabled={submitting}
                className="w-full py-2.5 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 font-bold italic flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
              <p className="text-[10px] text-amber-100/40 italic">Your balance updates after admin approves the deposit.</p>
            </WesternFrame>
          </div>
        )}
      </main>
    </div>
  );
}