import React, { useState } from 'react';
import BackButton from '@/components/BackButton';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import { useToast } from '@/components/ui/use-toast';
import { Bitcoin, Coins, Wallet } from 'lucide-react';

const METHODS = [
  {
    id: 'binance',
    label: 'Pay with Binance',
    badge: 'B',
    badgeClass: 'bg-amber-400 text-stone-950 ring-amber-200',
    icon: null,
    hint: 'Binance Pay wallet',
  },
  {
    id: 'usdt',
    label: 'Pay USDT in Crypto',
    badge: '₮',
    badgeClass: 'bg-emerald-500 text-white ring-emerald-300',
    icon: Coins,
    hint: 'Tether (USDT) transfer',
  },
  {
    id: 'crypto',
    label: 'Pay Crypto',
    badge: null,
    icon: Bitcoin,
    iconClass: 'text-amber-300',
    hint: 'BTC / ETH / other coins',
  },
];

export default function PayMethod() {
  const params = new URLSearchParams(window.location.search);
  const amount = Number(params.get('amount') || 0);
  const { toast } = useToast();
  const [selected, setSelected] = useState(null);

  const choose = (m) => {
    setSelected(m.id);
    toast({ title: `${m.label} selected`, description: 'Payment processing coming soon.' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-green-950 to-stone-950 pb-10">
      <header className="sticky top-0 z-20 bg-emerald-950/90 backdrop-blur-xl border-b border-amber-600/30">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <BackButton href="/dashboard" />
          <div className="flex-1 text-center">
            <h1 className="text-base font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Choose Payment</h1>
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

        <div className="flex flex-col gap-3">
          {METHODS.map(m => {
            const Icon = m.icon;
            const active = selected === m.id;
            return (
              <button
                key={m.id}
                onClick={() => choose(m)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all active:scale-[0.98] ${active ? 'border-amber-300 bg-amber-400/10' : 'border-amber-700/40 bg-black/30 hover:bg-black/50'}`}
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.18), 0 2px 6px rgba(0,0,0,0.5)' }}
              >
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ring-2 ${m.badgeClass || 'bg-black/40 ring-amber-700/40'}`}>
                  {m.badge ? (
                    <span className="text-2xl font-black" style={{ fontFamily: 'Georgia, serif' }}>{m.badge}</span>
                  ) : Icon ? (
                    <Icon className={`w-7 h-7 ${m.iconClass || ''}`} />
                  ) : null}
                </div>
                <div className="flex-1 text-left">
                  <h2 className="text-base font-black italic text-amber-100" style={{ fontFamily: 'Georgia, serif' }}>{m.label}</h2>
                  <p className="text-[11px] text-amber-100/50">{m.hint}</p>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-[10px] text-amber-100/40 italic text-center mt-2">Minimum deposit $1.00 · Choose your preferred method</p>
      </main>
    </div>
  );
}