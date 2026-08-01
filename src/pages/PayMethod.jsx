import React, { useState, useEffect } from 'react';
import BackButton from '@/components/BackButton';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { Bitcoin, Wallet, Copy, Check, ArrowLeft, AlertTriangle } from 'lucide-react';
import TrustWalletDeposit from '@/components/wallet/TrustWalletDeposit';
import TonkeeperDeposit from '@/components/wallet/TonkeeperDeposit';
import TxIdRow from '@/components/wallet/TxIdSubmit';
import { useLanguage } from '@/lib/LanguageContext';
import { CryptoLogo, detectCrypto, CRYPTO_META } from '@/components/CryptoLogo';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

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
  { id: 'binance', label: 'Pay with Binance', cryptoType: 'binance', hint: 'Binance Pay wallet' },
  { id: 'usdt', label: 'Pay USDT in Crypto', cryptoType: 'usdt', hint: 'Tether (USDT) transfer' },
  { id: 'crypto', label: 'Pay Crypto', cryptoType: 'btc', hint: 'BTC / ETH / BNB & other coins' },
  { id: 'trust', label: 'Trust Wallet', cryptoType: 'trust', hint: 'Connect wallet & pay USDT (BSC) — auto credit' },
  { id: 'tonkeeper', label: 'Ton Wallet (TON)', cryptoType: 'ton', hint: 'Connect Ton Wallet & pay USDT (TON) — auto credit' },
];

const USDT_NETWORKS = [
  { name: 'USDT TRX Network', cryptoType: 'trx', address: 'TLrv3EJEbGfEJgGbjQi3Yi1Yc88mn9mDxn' },
  { name: 'USDT BEP 20', cryptoType: 'bsc', address: '0x2a62cd712863028804a5789629c23d842990aded' },
  { name: 'USDT ETH Network', cryptoType: 'eth', address: '0x2a62cd712863028804a5789629c23d842990aded' },
  { name: 'USDT POL Polygon Pos', cryptoType: 'pol', address: '0x2a62cd712863028804a5789629c23d842990aded' },
  { name: 'USDT SOL Solana Network', cryptoType: 'sol', address: 'ftmbTXAc6XWyT6ieXHLiEZ7zuJFDPVSAdvrvrTveniW' },
  { name: 'USDT TON Network', cryptoType: 'ton', address: 'UQB5vp_yQ4L-EheVHn4df--zU1XDuRX_tMSCc7WEB-PGuGv6' },
  { name: 'USDT AVAX-C Chain', cryptoType: 'avax', address: '0x2a62cd712863028804a5789629c23d842990aded' },
  { name: 'USDT APT Aptos Network', cryptoType: 'apt', address: '0x5eed1ca335fec51a3b18c115c6ceb0f4c774f3bdaa943076d1f58024921501f4' },
];

const CRYPTO_NETWORKS = [
  { name: 'Bitcoin BTC Network', cryptoType: 'btc', address: 'bc1q6j34j85jswe2xmnwvljjax4nemagfmak44glt0' },
  { name: 'ETH ERC 20', cryptoType: 'eth', address: '0x2a62cd712863028804a5789629c23d842990aded' },
  { name: 'BNB BNB Network', cryptoType: 'bsc', address: '0x2a62cd712863028804a5789629c23d842990aded' },
  { name: 'TRX Trc 20', cryptoType: 'trx', address: 'TLrv3EJEbGfEJgGbjQi3Yi1Yc88mn9mDxn' },
  { name: 'LTC Litcoin Network', cryptoType: 'ltc', address: 'ltc1qr3sxhe7uhy7230n67ydvyazj7xl3ktg2594xnq' },
  { name: 'Doge Dogecoin Network', cryptoType: 'doge', address: 'DRia2VvUFipNk5D31AvWd4b3W714hBdbtW' },
  { name: 'Dot Polkadot Network', cryptoType: 'dot', address: '12vChQ7pHT3wrgMUmHCjCwBy5ASEbHYEmL3paSjfmymDdngN' },
  { name: 'APT Aptos Network', cryptoType: 'apt', address: '0x5eed1ca335fec51a3b18c115c6ceb0f4c774f3bdaa943076d1f58024921501f4' },
  { name: 'TON Ton network', cryptoType: 'ton', address: 'UQB5vp_yQ4L-EheVHn4df--zU1XDuRX_tMSCc7WEB-PGuGv6' },
];

function CopyAddr({ addr }) {
  const { t } = useLanguage();
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
    <button onClick={copy} className="flex items-center gap-1.5 px-3 h-9 rounded-[14px] text-xs font-bold transition-all active:scale-95 shrink-0"
      style={{ border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}>
      {copied ? <Check className="w-3.5 h-3.5" style={{ color: '#34d399' }} /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? t("Copied") : t("Copy")}
    </button>
  );
}

function CoinLogo({ cryptoType, color }) {
  return <CryptoLogo type={cryptoType} size={44} color={color} />;
}

export default function PayMethod() {
  const params = new URLSearchParams(window.location.search);
  const amount = Number(params.get('amount') || 0);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { demoMode } = useCasinoBalance();
  const [view, setView] = useState('choose'); // 'choose' | 'usdt' | 'crypto' | 'binance'
  const [payData, setPayData] = useState({ binance: null, usdt: USDT_NETWORKS, crypto: CRYPTO_NETWORKS });

  useEffect(() => {
    base44.entities.PaymentAddress.filter({ active: true }, 'order', 100)
      .then(list => {
        const map = (r) => {
          const ct = detectCrypto(r.network) || detectCrypto(r.label);
          const meta = ct ? CRYPTO_META[ct] : null;
          return { name: r.label, cryptoType: ct, color: meta?.color || r.color || '#f7931a', address: r.address || '', qr_image_url: r.qr_image_url || '', network: r.network, raw: r };
        };
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
  const methodLabel = view === 'usdt' ? t("USDT Deposit") : view === 'crypto' ? t("Crypto Deposit") : view === 'tonkeeper' ? t("Ton Wallet Deposit") : view === 'trust' ? t("Trust Wallet Pay") : t("Binance Pay Deposit");

  return (
    <div className="relative min-h-screen pb-24" style={{ background: '#0D0D0D', fontFamily: SANS }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(120% 55% at 50% -10%, rgba(212,175,55,0.12), transparent 60%), radial-gradient(80% 50% at 100% 110%, rgba(212,175,55,0.06), transparent 60%), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/42da6c35a_file_00000000a918820b81da42fc2ddfcfda.png) center/cover no-repeat' }} />

      {/* Header — text unchanged */}
      <header
        className="sticky top-0 z-30"
        style={{ background: 'rgba(13,13,13,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(212,175,55,0.22)' }}
      >
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          {view !== 'choose' ? (
            <button onClick={() => { setView('choose'); }}
              className="flex items-center gap-1.5 px-4 h-10 rounded-[14px] font-bold transition-all active:scale-95"
              style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <button onClick={() => window.history.back()} title="Back"
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95"
              style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
          <div className="flex-1 text-center">
            <span className="text-base font-extrabold tracking-tight" style={{ color: '#D4AF37' }}>{view === 'choose' ? t("Choose Payment") : methodLabel}</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="relative z-10 max-w-md mx-auto px-4 py-5 flex flex-col gap-4">
        {demoMode ? (
          <div className="dash-card p-5 flex flex-col items-center gap-3 text-center" style={{ animation: 'dashFadeIn 300ms ease both' }}>
            <AlertTriangle className="w-8 h-8" style={{ color: '#D4AF37' }} />
            <p className="text-sm font-semibold" style={{ color: '#fff' }}>{t("Demo Mode is active.")}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{t("Deposits are disabled while using the practice balance. Turn off Demo from the home page to deposit real funds.")}</p>
            <button onClick={() => window.location.href = '/'} className="dash-btn-gold px-5 py-2.5 text-sm">{t("Back to Home")}</button>
          </div>
        ) : amount <= 0 ? (
          <div className="dash-card p-5 flex flex-col items-center gap-3 text-center" style={{ animation: 'dashFadeIn 300ms ease both' }}>
            <AlertTriangle className="w-8 h-8" style={{ color: '#D4AF37' }} />
            <p className="text-sm font-semibold" style={{ color: '#fff' }}>{t("No deposit amount selected.")}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{t("Please choose a deposit amount from the dashboard.")}</p>
            <button onClick={() => window.location.href = '/dashboard'} className="dash-btn-gold px-5 py-2.5 text-sm">{t("Go to Dashboard")}</button>
          </div>
        ) : (
        <>
        {/* Deposit amount card */}
        <div className="dash-card p-5 flex items-center justify-between" style={{ animation: 'dashFadeIn 400ms ease both', background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.4)', boxShadow: '0 0 24px rgba(212,175,55,0.16), 0 8px 24px rgba(0,0,0,0.5)' }}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(212,175,55,0.85)' }}>{t("Depositing")}</p>
            <p className="text-3xl font-extrabold tabular-nums mt-0.5" style={{ color: '#fff' }}>${amount.toFixed(2)}</p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #FFD700, #C89B3C)', boxShadow: '0 0 18px rgba(212,175,55,0.5)' }}>
            <Wallet className="w-6 h-6" style={{ color: '#1a1408' }} />
          </div>
        </div>

        {view === 'choose' && (
          <div className="flex flex-col gap-3" style={{ animation: 'dashFadeIn 400ms ease both' }}>
            {METHODS.map((m, i) => {
              const meta = CRYPTO_META[m.cryptoType];
              return (
                <button
                  key={m.id}
                  onClick={() => choose(m)}
                  className="dash-card w-full flex items-center gap-4 p-4 transition-all active:scale-[0.98]"
                  style={{ animation: 'dashFadeIn 400ms ease both', animationDelay: (50 * i) + 'ms' }}
                >
                  <CryptoLogo type={m.cryptoType} size={48} color={meta?.color} />
                  <div className="flex-1 text-left">
                    <h2 className="text-base font-bold" style={{ color: '#fff' }}>{m.label}</h2>
                    <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{m.hint}</p>
                  </div>
                </button>
              );
            })}
            <p className="text-[11px] text-center mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{t("Minimum deposit $3.00 · Choose your preferred method")}</p>
          </div>
        )}

        {view !== 'choose' && view !== 'binance' && (
          <div className="flex flex-col gap-4" style={{ animation: 'dashFadeIn 400ms ease both' }}>
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{t("Send to one of the addresses below to deposit.")}</p>
            {networks.map((n, i) => (
              <div key={i} className="dash-card p-4 flex flex-col gap-3" style={{ animation: 'dashFadeIn 400ms ease both', animationDelay: (50 * i) + 'ms' }}>
                <div className="flex items-center gap-3">
                  <CoinLogo cryptoType={n.cryptoType} color={n.color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: '#fff' }}>{n.name}</p>
                  </div>
                  <CopyAddr addr={n.address} />
                </div>
                <div className="rounded-[14px] px-3 py-2.5" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(212,175,55,0.18)' }}>
                  <p className="text-[12px] break-all font-mono" style={{ color: 'rgba(255,255,255,0.85)' }}>{n.address}</p>
                </div>
                <TxIdRow amount={amount} method={view} network={n.name} />
              </div>
            ))}
          </div>
        )}

        {view === 'binance' && (
          <div className="flex flex-col gap-4 items-center" style={{ animation: 'dashFadeIn 400ms ease both' }}>
            <div className="dash-card p-5 flex flex-col items-center gap-3 w-full" style={{ boxShadow: '0 0 24px rgba(212,175,55,0.16), 0 8px 24px rgba(0,0,0,0.5)' }}>
              <div className="w-56 h-56 rounded-2xl overflow-hidden bg-white p-3 flex items-center justify-center" style={{ boxShadow: '0 0 0 1px rgba(212,175,55,0.4), 0 6px 18px rgba(0,0,0,0.5)' }}>
                <img src={payData.binance?.qr_image_url || 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/2a51a6e74_InShot_20260718_2329057661.jpg'} alt="Binance Pay QR" className="w-full h-full object-contain" />
              </div>
              <p className="text-[13px] text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>Scan the QR with your Binance app to pay <span className="font-bold" style={{ color: '#D4AF37' }}>${amount.toFixed(2)}</span></p>
            </div>
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