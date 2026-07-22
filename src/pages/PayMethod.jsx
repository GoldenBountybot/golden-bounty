import React, { useState, useEffect } from 'react';
import BackButton from '@/components/BackButton';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import WesternBackdrop from '@/components/WesternBackdrop';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { Bitcoin, Wallet, Copy, Check, ArrowLeft, AlertTriangle } from 'lucide-react';
import TrustWalletDeposit from '@/components/wallet/TrustWalletDeposit';
import TonkeeperDeposit from '@/components/wallet/TonkeeperDeposit';

const LOGOS = {
  bitcoin: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400',
  ethereum: 'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501628',
  tether: 'https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661',
  bnb: 'https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png?1696501970',
  solana: 'https://coin-images.coingecko.com/coins/images/4128/large/solana.png?1718769756',
  tron: 'https://coin-images.coingecko.com/coins/images/1094/large/photo_2026-04-13_09-59-16.png?1776048311',
  dogecoin: 'https://coin-images.coingecko.com/coins/images/5/large/dogecoin.png?1696501409',
  litecoin: 'https://coin-images.coingecko.com/coins/images/2/large/litecoin.png?1696501400',
  avalanche: 'https://coin-images.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png?1696512369',
  polkadot: 'https://coin-images.coingecko.com/coins/images/12171/large/polkadot.jpg?1766533446',
  aptos: 'https://coin-images.coingecko.com/coins/images/26455/large/Aptos-Network-Symbol-Black-RGB-1x.png?1761789140',
  polygon: 'https://coin-images.coingecko.com/coins/images/4713/large/polygon.png?1698233745',
  ton: 'https://coin-images.coingecko.com/coins/images/17980/large/Gram_Circular_Badge.png?1781524778',
  binance: 'https://cdn.simpleicons.org/binance/F0B90B',
  trustwallet: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Trust_Wallet_logo_%282026%29.png/330px-Trust_Wallet_logo_%282026%29.png',
};

function logoFor(network, name) {
  const k = String(network || name || '').toLowerCase();
  if (k.includes('trx') || k.includes('tron') || k.includes('trc')) return LOGOS.tron;
  if (k.includes('bnb') || k.includes('bep')) return LOGOS.bnb;
  if (k.includes('eth') || k.includes('erc')) return LOGOS.ethereum;
  if (k.includes('sol')) return LOGOS.solana;
  if (k.includes('avax') || k.includes('avalanche')) return LOGOS.avalanche;
  if (k.includes('apt')) return LOGOS.aptos;
  if (k.includes('ton')) return LOGOS.ton;
  if (k.includes('dot') || k.includes('polka')) return LOGOS.polkadot;
  if (k.includes('polygon') || k.includes('matic') || k.includes('pol')) return LOGOS.polygon;
  if (k.includes('btc') || k.includes('bitcoin')) return LOGOS.bitcoin;
  if (k.includes('ltc') || k.includes('lite')) return LOGOS.litecoin;
  if (k.includes('doge')) return LOGOS.dogecoin;
  if (k.includes('usdt') || k.includes('tether')) return LOGOS.tether;
  return null;
}

const METHODS = [
  { id: 'binance', label: 'Pay with Binance', logo: LOGOS.binance, badge: 'B', badgeClass: 'bg-amber-400 text-stone-950 ring-amber-200', hint: 'Binance Pay wallet' },
  { id: 'usdt', label: 'Pay USDT in Crypto', logo: LOGOS.tether, badge: '₮', badgeClass: 'bg-emerald-500 text-white ring-emerald-300', hint: 'Tether (USDT) transfer' },
  { id: 'crypto', label: 'Pay Crypto', logo: LOGOS.bitcoin, badge: null, icon: Bitcoin, iconClass: 'text-amber-300', hint: 'BTC / ETH / BNB & other coins' },
  { id: 'trust', label: 'Trust Wallet', logo: LOGOS.trustwallet, badge: 'T', badgeClass: 'bg-blue-600 text-white ring-blue-300', hint: 'Connect wallet & pay USDT (BSC) — auto credit' },
  { id: 'tonkeeper', label: 'Ton Wallet (TON)', logo: LOGOS.ton, badge: 'T', badgeClass: 'bg-sky-500 text-white ring-sky-300', hint: 'Connect Ton Wallet & pay USDT (TON) — auto credit' },
];

const USDT_NETWORKS = [
  { name: 'USDT TRX Network', logo: LOGOS.tron, symbol: '₮', color: '#26a17b', address: 'TMxeqrx8Fx1bUfuLaGQHZ6tct9rEiYo2tM' },
  { name: 'USDT BEP 20', logo: LOGOS.bnb, symbol: '₮', color: '#f0b90b', address: '0xbe44b1608cd0a7e7f18166d18ad2c21a61bd6570' },
  { name: 'USDT ETH Network', logo: LOGOS.ethereum, symbol: '₮', color: '#627eea', address: '0xbe44b1608cd0a7e7f18166d18ad2c21a61bd6570' },
  { name: 'USDT POL Polygon Pos', logo: LOGOS.polygon, symbol: '₮', color: '#8247e5', address: '0xbe44b1608cd0a7e7f18166d18ad2c21a61bd6570' },
  { name: 'USDT SOL Solana Network', logo: LOGOS.solana, symbol: '₮', color: '#14f195', address: '7UTV9h1VHq2gxjEoCLyJSPhoiz1NAaEHAL8qwTzy4sAy' },
  { name: 'USDT TON Network', logo: LOGOS.ton, symbol: '₮', color: '#0098ea', address: 'UQCTtNPN9ZzlXWsiE-VHApcouD8tFHgBIcC3hD-GcQdDrgKN' },
  { name: 'USDT AVAX-C Chain', logo: LOGOS.avalanche, symbol: '₮', color: '#e84142', address: '0xbe44b1608cd0a7e7f18166d18ad2c21a61bd6570' },
  { name: 'USDT APT Aptos Network', logo: LOGOS.aptos, symbol: '₮', color: '#06f7c7', address: '0x6c0ab824258561892ea86cb25537a3fa2f98dac3807274857eceacde0f0cba40' },
];

const CRYPTO_NETWORKS = [
  { name: 'Bitcoin BTC Network', logo: LOGOS.bitcoin, symbol: '₿', color: '#f7931a', address: '143jQV14W9RZWWnvZzU4jC6L9tzLRpxc7F' },
  { name: 'ETH ERC 20', logo: LOGOS.ethereum, symbol: 'Ξ', color: '#627eea', address: '0xbe44b1608cd0a7e7f18166d18ad2c21a61bd6570' },
  { name: 'BNB BNB Network', logo: LOGOS.bnb, symbol: 'B', color: '#f0b90b', address: '0xbe44b1608cd0a7e7f18166d18ad2c21a61bd6570' },
  { name: 'TRX Trc 20', logo: LOGOS.tron, symbol: 'T', color: '#ef0027', address: 'TMxeqrx8Fx1bUfuLaGQHZ6tct9rEiYo2tM' },
  { name: 'LTC Litcoin Network', logo: LOGOS.litecoin, symbol: 'Ł', color: '#345d9d', address: 'LeHorMXaYm2XbuXijJNfFZkoH44tVgGqRw' },
  { name: 'Doge Dogecoin Network', logo: LOGOS.dogecoin, symbol: 'Ð', color: '#c2a634', address: 'DSZgcwAFzzU7B1aJWDdELm1EDVyUStdaQs' },
  { name: 'Dot Polkadot Network', logo: LOGOS.polkadot, symbol: '●', color: '#e6007a', address: '12fvsuVa2wyjkVVJ3jF8KfEEbbby1tp85iTwXuJSM8iRgYjJ' },
  { name: 'APT Aptos Network', logo: LOGOS.aptos, symbol: 'A', color: '#06f7c7', address: '0x6c0ab824258561892ea86cb25537a3fa2f98dac3807274857eceacde0f0cba40' },
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

function CoinLogo({ symbol, color, logo }) {
  return (
    <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 overflow-hidden" style={{ background: logo ? '#fff' : color, boxShadow: `0 0 0 2px rgba(255,255,255,0.15), 0 1px 4px rgba(0,0,0,0.4)` }}>
      {logo ? <img src={logo} alt={symbol} className="w-7 h-7 object-contain" /> : <span className="text-lg font-black text-white" style={{ fontFamily: 'Georgia, serif' }}>{symbol}</span>}
    </div>
  );
}

export default function PayMethod() {
  const params = new URLSearchParams(window.location.search);
  const amount = Number(params.get('amount') || 0);
  const { toast } = useToast();
  const [view, setView] = useState('choose'); // 'choose' | 'usdt' | 'crypto' | 'binance'
  const [payData, setPayData] = useState({ binance: null, usdt: USDT_NETWORKS, crypto: CRYPTO_NETWORKS });

  useEffect(() => {
    base44.entities.PaymentAddress.filter({ active: true }, 'order', 100)
      .then(list => {
        const map = (r) => ({ name: r.label, symbol: r.symbol || '', color: r.color || '#f7931a', address: r.address || '', qr_image_url: r.qr_image_url || '', network: r.network, logo: logoFor(r.network, r.label), raw: r });
        const bin = list.find(r => r.method === 'binance');
        const usdt = list.filter(r => r.method === 'usdt').map(map);
        const crypto = list.filter(r => r.method === 'crypto').map(map);
        setPayData({
          binance: bin ? map(bin) : null,
          usdt: usdt.length ? usdt : USDT_NETWORKS,
          crypto: crypto.length ? crypto : CRYPTO_NETWORKS,
        });
      })
      .catch(() => {});
  }, []);

  const choose = (m) => {
    if (m.id === 'usdt' || m.id === 'crypto' || m.id === 'binance' || m.id === 'trust' || m.id === 'tonkeeper') { setView(m.id); return; }
    toast({ title: `${m.label} selected`, description: 'Payment processing coming soon.' });
  };

  const networks = view === 'usdt' ? payData.usdt : view === 'crypto' ? payData.crypto : [];
  const methodLabel = view === 'usdt' ? 'USDT Deposit' : view === 'crypto' ? 'Crypto Deposit' : view === 'tonkeeper' ? 'Ton Wallet Deposit' : 'Binance Pay Deposit';

  return (
    <div className="relative min-h-screen bg-[#0b0b0d] pb-10">
      <WesternBackdrop />
      <header className="sticky top-0 z-20 backdrop-blur-xl" style={{ background: 'rgba(10,9,8,0.78)', borderBottom: '1px solid rgba(214,178,98,0.22)' }}>
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          {view !== 'choose' ? (
            <button onClick={() => { setView('choose'); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md italic font-bold border border-amber-600/80 text-amber-200 bg-black/40 active:scale-95" style={{ fontFamily: 'Rye, Georgia, serif' }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <BackButton href="/dashboard" />
          )}
          <div className="flex-1 text-center">
            <h1 className="text-base font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>{view === 'choose' ? 'Choose Payment' : methodLabel}</h1>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-md mx-auto px-4 py-5 flex flex-col gap-4">
        {amount <= 0 ? (
          <WesternFrame variant="glass" className="p-5 flex flex-col items-center gap-3 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <p className="text-amber-100 text-sm italic" style={{ fontFamily: 'Georgia, serif' }}>No deposit amount selected.</p>
            <p className="text-amber-100/60 text-xs italic">Please choose a deposit amount from the dashboard.</p>
            <button onClick={() => window.location.href = '/dashboard'} className="px-4 py-2 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 font-bold italic active:scale-95" style={{ fontFamily: 'Georgia, serif' }}>Go to Dashboard</button>
          </WesternFrame>
        ) : (
        <>
        <WesternFrame glow variant="glass" className="p-4 flex items-center justify-between">
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
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ring-2 overflow-hidden ${m.logo ? 'bg-white/95 ring-white/30' : (m.badgeClass || 'bg-black/40 ring-amber-700/40')}`}>
                  {m.logo ? <img src={m.logo} alt={m.label} className="w-8 h-8 object-contain" /> : m.badge ? <span className="text-2xl font-black" style={{ fontFamily: 'Georgia, serif' }}>{m.badge}</span> : m.icon ? <m.icon className={`w-7 h-7 ${m.iconClass || ''}`} /> : null}
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

        {view !== 'choose' && view !== 'binance' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-amber-100/70 italic">Send to one of the addresses below to deposit.</p>
            {networks.map((n, i) => (
              <WesternFrame key={i} variant="glass" className="p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <CoinLogo symbol={n.symbol} color={n.color} logo={n.logo} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>{n.name}</p>
                  </div>
                  <CopyAddr addr={n.address} />
                </div>
                <p className="text-[11px] text-amber-100/80 break-all font-mono">{n.address}</p>
              </WesternFrame>
            ))}
          </div>
        )}

        {view === 'binance' && (
          <div className="flex flex-col gap-4 items-center">
            <WesternFrame glow variant="glass" className="p-5 flex flex-col items-center gap-3 w-full">
              <div className="w-56 h-56 rounded-lg overflow-hidden bg-white p-3 flex items-center justify-center" style={{ boxShadow: '0 0 0 1px rgba(190,140,55,0.5), 0 4px 12px rgba(0,0,0,0.5)' }}>
                <img src={payData.binance?.qr_image_url || 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/2a51a6e74_InShot_20260718_2329057661.jpg'} alt="Binance Pay QR" className="w-full h-full object-contain" />
              </div>
              <p className="text-xs text-amber-100/70 italic text-center">Scan the QR with your Binance app to pay <span className="font-bold text-amber-200">${amount.toFixed(2)}</span></p>
            </WesternFrame>
          </div>
        )}

        {view === 'trust' && (
          <TrustWalletDeposit
            amount={amount}
            onBack={() => { setView('choose'); }}
            onDone={() => { window.location.href = '/dashboard'; }}
          />
        )}

        {view === 'tonkeeper' && (
          <TonkeeperDeposit
            amount={amount}
            onBack={() => { setView('choose'); }}
            onDone={() => { window.location.href = '/dashboard'; }}
          />
        )}
        </>
        )}
      </main>
    </div>
  );
}