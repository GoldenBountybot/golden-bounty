import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useLanguage } from '@/lib/LanguageContext';
import { Wallet, ArrowLeft, Send, AlertTriangle, ArrowUpFromLine, Menu, Shield } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import StylishNotify from '@/components/StylishNotify';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

const LOGOS = {
  tether: 'https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661',
  tron: 'https://coin-images.coingecko.com/coins/images/1094/large/photo_2026-04-13_09-59-16.png?1776048311',
  bnb: 'https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png?1696501970',
  ethereum: 'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501628',
  polygon: 'https://coin-images.coingecko.com/coins/images/4713/large/polygon.png?1698233745',
  solana: 'https://coin-images.coingecko.com/coins/images/4128/large/solana.png?1718769756',
  ton: 'https://coin-images.coingecko.com/coins/images/17980/large/Gram_Circular_Badge.png?1781524778',
  avalanche: 'https://coin-images.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png?1696512369',
  aptos: 'https://coin-images.coingecko.com/coins/images/26455/large/Aptos-Network-Symbol-Black-RGB-1x.png?1761789140',
  bitcoin: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400',
};

const METHODS = [
  { id: 'usdt', label: 'USDT (Crypto)', logo: LOGOS.tether, color: '#26a17b', hint: 'Withdraw USDT to your wallet' },
];

const NET_COLORS = {
  trx: '#26a17b', bsc: '#f0b90b', eth: '#627eea', pol: '#8247e5',
  sol: '#14f195', ton: '#0098ea', avax: '#e84142', apt: '#06b6d4', btc: '#f7931a',
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
  if (k.includes('polygon') || k.includes('matic') || k.includes('pol')) return LOGOS.polygon;
  if (k.includes('btc') || k.includes('bitcoin')) return LOGOS.bitcoin;
  if (k.includes('usdt') || k.includes('tether')) return LOGOS.tether;
  return null;
}

const ALLOWED_NET_KEYS = ['bep', 'bsc', 'bnb', 'polygon', 'matic', 'pol'];

function isAllowedNetwork(network, name) {
  const k = String(network || '') + ' ' + String(name || '').toLowerCase();
  return ALLOWED_NET_KEYS.some(key => k.toLowerCase().includes(key));
}

const DEFAULT_USDT_NETS = [
  { name: 'USDT BEP 20', color: '#f0b90b', logo: LOGOS.bnb },
  { name: 'USDT POL Polygon Pos', color: '#8247e5', logo: LOGOS.polygon },
];

function CoinLogo({ logo, color }) {
  return (
    <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 overflow-hidden"
      style={{ background: logo ? '#fff' : color, boxShadow: '0 0 0 1px rgba(255,255,255,0.12)' }}>
      {logo
        ? <img src={logo} alt="" className="w-6 h-6 object-contain" />
        : <span className="text-sm font-extrabold" style={{ color }}>₮</span>}
    </div>
  );
}

export default function Withdraw() {
  const params = new URLSearchParams(window.location.search);
  const amount = Number(params.get('amount') || 0);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { demoMode, wagerRemaining, maxWithdrawable } = useCasinoBalance();
  const { user } = useAuth();
  const [view, setView] = useState('choose');
  const [usdtNets, setUsdtNets] = useState(DEFAULT_USDT_NETS);
  const [selectedNet, setSelectedNet] = useState(null);
  const [walletAddr, setWalletAddr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notify, setNotify] = useState(null);
  const showNotify = (title, description) => setNotify({ title, description });

  useEffect(() => {
    base44.entities.PaymentAddress.filter({ method: 'usdt', active: true }, 'order', 100)
    .then(list => {
      const allowed = list.filter(r => isAllowedNetwork(r.network, r.label));
      if (allowed.length) setUsdtNets(allowed.map(r => {
        const name = r.label || r.network;
        const logo = logoFor(r.network, name);
        return { name, color: r.color || '#26a17b', logo };
      }));
    })
    .catch(() => {});
  }, []);

  const submit = async () => {
    if (view === 'usdt') {
      if (!selectedNet) { toast({ title: t("Select a network first") }); return; }
      if (!walletAddr.trim()) { toast({ title: t("Enter your wallet address") }); return; }
    }
    setSubmitting(true);
    try {
      const me = await base44.auth.me().catch(() => null);
      if (!me) { toast({ title: t("Please log in first") }); setSubmitting(false); return; }
      // All validation now happens server-side in submitWithdrawal (balance,
      // wager requirement, banned check, pending-withdrawal spam limit).
      // The client-side maxWithdrawable check is kept only for a faster
      // user-facing hint; the server is the real authority.
      if (amount > maxWithdrawable) {
        showNotify(
          t("Wagering requirement not met"),
          wagerRemaining > 0
            ? `Play through or stack $${wagerRemaining.toFixed(2)} of your deposit before withdrawing.`
            : t("Only winnings above your locked deposit can be withdrawn.")
        );
        setSubmitting(false);
        return;
      }
      let result;
      try {
        result = await base44.functions.invoke('submitWithdrawal', {
          amount,
          method: 'usdt',
          reference: walletAddr.trim(),
          note: `${selectedNet.name} · ${walletAddr.trim().slice(0, 14)}...`,
        });
      } catch (err) {
        const msg = err?.message || err?.error || t("Submission failed");
        // Surface server-side validation errors (insufficient balance,
        // wager requirement, banned, too many pending) to the user.
        showNotify(t("Withdrawal rejected"), msg);
        setSubmitting(false);
        return;
      }
      if (!result?.data?.ok) {
        showNotify(t("Withdrawal rejected"), result?.data?.error || t("Submission failed"));
        setSubmitting(false);
        return;
      }
      // Auto-notify every admin by email (admins auto-picked server-side).
      try {
        await base44.functions.invoke('notifyAdminWithdrawal', {
          amount,
          network: selectedNet.name,
          wallet: walletAddr.trim(),
        });
      } catch (_e) { /* non-critical — withdrawal already saved */ }
      toast({ title: t("Withdrawal requested"), description: t("Pending admin approval.") });
      setWalletAddr(''); setSelectedNet(null);
      setTimeout(() => { window.location.href = '/dashboard?tab=wallet'; }, 1000);
    } catch {
      toast({ title: t("Submission failed"), description: t("Please try again.") });
    }
    setSubmitting(false);
  };

  const heading = { fontFamily: SANS, fontWeight: 700, letterSpacing: '-0.01em' };

  return (
    <div className="relative min-h-screen pb-24" style={{ background: '#0D0D0D', fontFamily: SANS }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(120% 60% at 50% -10%, rgba(212,175,55,0.12), transparent 60%), radial-gradient(80% 50% at 100% 110%, rgba(212,175,55,0.06), transparent 60%)' }} />

      {/* Sticky top navigation */}
      <header
        className="sticky top-0 z-30"
        style={{ background: 'rgba(13,13,13,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(212,175,55,0.22)' }}
      >
        <div className="max-w-md lg:max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => (view !== 'choose' ? (setView('choose'), setSelectedNet(null)) : window.history.back())}
            title="Back"
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>

          <div className="flex-1 flex items-center justify-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'linear-gradient(135deg,#34d399,#059669)', boxShadow: '0 0 14px rgba(52,211,153,0.45)' }}>
              <ArrowUpFromLine className="w-5 h-5" style={{ color: '#062018' }} />
            </div>
            <span className="text-lg font-extrabold tracking-tight" style={{ ...heading, color: '#D4AF37' }}>
              {view === 'choose' ? t("Withdraw") : t("USDT Withdraw")}
            </span>
          </div>

          <button
            onClick={() => window.location.href = '/dashboard'}
            title="Menu"
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-md lg:max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4">
        {demoMode ? (
          <div className="dash-card p-5 flex flex-col items-center gap-3 text-center" style={{ animation: 'dashFadeIn 400ms ease both', borderColor: 'rgba(251,146,60,0.4)' }}>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: 'rgba(251,146,60,0.14)', border: '1px solid rgba(251,146,60,0.35)' }}>
              <AlertTriangle className="w-6 h-6" style={{ color: '#fb923c' }} />
            </div>
            <p className="text-sm font-bold" style={{ color: '#fb923c' }}>{t("Demo Mode is active.")}</p>
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{t("Deposits are disabled while using the practice balance. Turn off Demo from the home page to deposit real funds.")}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="dash-btn-gold px-6 py-3 text-sm"
            >{t("Back to Home")}</button>
          </div>
        ) : (
          <>
            {/* Amount card */}
            <div
              className="dash-card relative overflow-hidden p-5"
              style={{ animation: 'dashFadeIn 400ms ease both', background: 'linear-gradient(135deg, rgba(52,211,153,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(52,211,153,0.35)' }}
            >
              <div className="pointer-events-none absolute -top-10 -right-8 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.22), transparent 70%)' }} />
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(52,211,153,0.85)' }}>{t("Withdrawing")}</p>
                <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: 'linear-gradient(135deg,#34d399,#059669)', boxShadow: '0 0 18px rgba(52,211,153,0.5)' }}>
                  <Wallet className="w-5 h-5" style={{ color: '#062018' }} />
                </div>
              </div>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-3xl font-extrabold tabular-nums" style={{ color: '#fff', ...heading }}>
                  $<span>{amount.toFixed(2)}</span>
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                <span>{t("Withdrawable:")} <span style={{ color: '#34d399', fontWeight: 700 }}>${maxWithdrawable.toFixed(2)}</span></span>
              </div>
            </div>

            {view === 'choose' && (
              <div className="flex flex-col gap-3" style={{ animation: 'dashFadeIn 400ms ease both' }}>
                {METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setView(m.id)}
                    className="dash-card w-full flex items-center gap-4 p-4 text-left transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0 overflow-hidden"
                      style={{ background: '#fff', boxShadow: '0 0 0 1px rgba(255,255,255,0.12)' }}>
                      <img src={m.logo} alt={m.label} className="w-8 h-8 object-contain" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-bold" style={{ ...heading, color: '#fff' }}>{m.label}</h2>
                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{t(m.hint)}</p>
                    </div>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="#D4AF37" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                ))}
                <p className="text-[11px] text-center mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{t("Choose your preferred withdrawal method · Approved by admin")}</p>
                {wagerRemaining > 0 && (
                  <div className="dash-card p-3 flex flex-col gap-1 text-center" style={{ borderColor: 'rgba(251,146,60,0.35)' }}>
                    <p className="text-[11px] font-bold" style={{ color: '#fb923c' }}>{t("Deposit play-through required")}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {t("{x} of your deposit must be played in games or stacked before withdrawal. Withdrawable now: {y}.", { x: `$${wagerRemaining.toFixed(2)}`, y: `$${maxWithdrawable.toFixed(2)}` })}
                    </p>
                  </div>
                )}
              </div>
            )}

            {view === 'usdt' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3" style={{ animation: 'dashFadeIn 400ms ease both' }}>
                <p className="text-[12px] px-1 lg:col-span-2" style={{ color: 'rgba(255,255,255,0.55)' }}>{t("Select a network, then enter your wallet address.")}</p>
                {usdtNets.map((n, i) => {
                  const active = selectedNet?.name === n.name;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedNet(n)}
                      className="dash-card w-full flex items-center gap-3 p-3 transition-all active:scale-[0.98]"
                      style={active ? { borderColor: `${n.color}aa`, boxShadow: `0 0 14px ${n.color}55` } : undefined}
                    >
                      <CoinLogo logo={n.logo} color={n.color} />
                      <span className="flex-1 text-left text-sm font-bold" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.8)' }}>{n.name}</span>
                      {active && <span className="text-xs font-bold" style={{ color: n.color }}>✓</span>}
                    </button>
                  );
                })}

                {selectedNet && (
                  <div className="dash-card p-5 flex flex-col gap-3 lg:col-span-2" style={{ animation: 'dashFadeIn 300ms ease both' }}>
                    <div className="flex items-center gap-2">
                      <CoinLogo logo={selectedNet.logo} color={selectedNet.color} />
                      <h2 className="text-base font-bold" style={{ ...heading, color: '#D4AF37' }}>{t("Your Wallet Address")}</h2>
                    </div>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{t("Network:")} {selectedNet.name}</p>
                    <input
                      type="text"
                      value={walletAddr}
                      onChange={e => setWalletAddr(e.target.value)}
                      placeholder={t("Paste your USDT wallet address")}
                      className="dash-input w-full px-4 py-3 text-sm"
                      style={{ fontFamily: 'ui-monospace, monospace' }}
                    />
                    <button
                      onClick={submit}
                      disabled={submitting}
                      className="dash-btn-gold w-full px-6 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" /> {submitting ? t("Submitting...") : t("Submit Withdrawal")}
                    </button>
                    <p className="text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>{t("Funds sent after admin approves your request.")}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
      <StylishNotify data={notify} onDone={() => setNotify(null)} />
    </div>
  );
}