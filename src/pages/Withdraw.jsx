import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useLanguage } from '@/lib/LanguageContext';
import { Wallet, ArrowLeft, Send, AlertTriangle, ArrowUpFromLine, Menu, Shield } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

const METHODS = [
  { id: 'binance', label: 'Binance Pay', badge: 'B', color: '#f0b90b', hint: 'Withdraw to your Binance UID' },
  { id: 'usdt', label: 'USDT (Crypto)', badge: '₮', color: '#26a17b', hint: 'Withdraw USDT to your wallet' },
];

const DEFAULT_USDT_NETS = [
  { name: 'USDT TRX Network', color: '#26a17b', logo: 'trx' },
  { name: 'USDT BEP 20', color: '#f0b90b', logo: 'bsc' },
  { name: 'USDT ETH Network', color: '#627eea', logo: 'eth' },
  { name: 'USDT POL Polygon Pos', color: '#8247e5', logo: 'pol' },
  { name: 'USDT SOL Solana Network', color: '#14f195', logo: 'sol' },
  { name: 'USDT TON Network', color: '#0098ea', logo: 'ton' },
];

function NetworkLogo({ type, color }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24' };
  switch (type) {
    case 'trx':
      return (
        <svg {...common} fill={color}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.6 5.2l-1.4 9.3c-.1.6-.4.8-.9.5l-2.5-1.8-1.2 1.2c-.2.2-.4.3-.7.3l.2-2.6 4.7-4.2c.2-.2 0-.3-.3-.1l-5.8 3.6-2.5-.8c-.5-.2-.6-.6.1-.9l9.8-3.8c.5-.2.9.1.7.7z"/>
        </svg>
      );
    case 'bsc':
      return (
        <svg {...common} fill={color}>
          <path d="M12 2l3 1.7v3.5L12 9.2 9 7.2V3.7L12 2zm6 3.5l3 1.7v3.5l-3 1.7-3-1.7V7.2l3-1.7zM6 5.5l3 1.7v3.5l-3 1.7-3-1.7V7.2l3-1.7zm6 7l3 1.7v3.5l-3 1.7-3-1.7v-3.5l3-1.7zm6 0l3 1.7v3.5l-3 1.7-3-1.7v-3.5l3-1.7zm-12 0l3 1.7v3.5l-3 1.7-3-1.7v-3.5l3-1.7z"/>
        </svg>
      );
    case 'eth':
      return (
        <svg {...common} fill={color}>
          <path d="M12 2L5 12.5l7 4 7-4L12 2zm0 16.5l-7-4 7 9.5 7-9.5-7 4z"/>
        </svg>
      );
    case 'pol':
      return (
        <svg {...common} fill={color}>
          <path d="M12 2l3.5 2v4L12 10 8.5 8V4L12 2zm0 8l3.5 2v4L12 18l-3.5-2v-4L12 10zm0 8l3.5 2v0L12 22l-3.5-2v0L12 18z"/>
        </svg>
      );
    case 'sol':
      return (
        <svg {...common} fill={color}>
          <path d="M5 7.5l1.4-1.4h11.2L16.2 7.5H5zm0 3.5l1.4-1.4h11.2L16.2 11H5zm14 3.5l-1.4 1.4H6.4L7.8 18H19z"/>
        </svg>
      );
    case 'ton':
      return (
        <svg {...common} fill={color}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-3.5 6h7c.6 0 1 .5 1 1 0 .2 0 .3-.1.5l-3.5 6.5c-.2.4-.6.5-1 .5s-.8-.2-1-.5L7.6 9.5c-.1-.2-.1-.3-.1-.5 0-.5.4-1 1-1zm3.5 2.2h-3.4l2.9 5.4c.1.2.2.2.3 0l2.9-5.4H12z"/>
        </svg>
      );
    default:
      return <span className="text-sm font-extrabold" style={{ color }}>₮</span>;
  }
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
  const [binanceUid, setBinanceUid] = useState('');
  const [walletAddr, setWalletAddr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    base44.entities.PaymentAddress.filter({ method: 'usdt', active: true }, 'order', 100)
      .then(list => { if (list.length) setUsdtNets(list.map(r => ({ name: r.label || r.network, color: r.color || '#26a17b' }))); })
      .catch(() => {});
  }, []);

  const submit = async () => {
    if (view === 'binance' && !binanceUid.trim()) { toast({ title: t("Enter your Binance UID") }); return; }
    if (view === 'usdt') {
      if (!selectedNet) { toast({ title: t("Select a network first") }); return; }
      if (!walletAddr.trim()) { toast({ title: t("Enter your wallet address") }); return; }
    }
    setSubmitting(true);
    try {
      const me = await base44.auth.me().catch(() => null);
      if (!me) { toast({ title: t("Please log in first") }); setSubmitting(false); return; }
      if (amount > maxWithdrawable) {
        toast({
          title: t("Wagering requirement not met"),
          description: wagerRemaining > 0
            ? `Play through or stack $${wagerRemaining.toFixed(2)} of your deposit before withdrawing.`
            : t("Only winnings above your locked deposit can be withdrawn."),
        });
        setSubmitting(false);
        return;
      }
      await base44.entities.Transaction.create({
        user_id: me.id,
        user_email: me.email,
        type: 'withdraw',
        amount,
        status: 'pending',
        method: view === 'binance' ? 'binance' : 'usdt',
        reference: view === 'binance' ? binanceUid.trim() : walletAddr.trim(),
        note: view === 'binance' ? `Binance Pay · UID ${binanceUid.trim()}` : `${selectedNet.name} · ${walletAddr.trim().slice(0, 14)}...`,
      });
      toast({ title: t("Withdrawal requested"), description: t("Pending admin approval.") });
      setBinanceUid(''); setWalletAddr(''); setSelectedNet(null);
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
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
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
              {view === 'choose' ? t("Withdraw") : view === 'binance' ? t("Binance Pay") : t("USDT Withdraw")}
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

      <main className="relative z-10 max-w-md mx-auto px-4 py-4 flex flex-col gap-4">
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
                {wagerRemaining > 0 && <span>{t("Locked:")} <span style={{ color: '#fb923c', fontWeight: 700 }}>${wagerRemaining.toFixed(2)}</span></span>}
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
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
                      style={{ background: `${m.color}22`, border: `1px solid ${m.color}66` }}
                    >
                      <span className="text-2xl font-extrabold" style={{ color: m.color }}>{m.badge}</span>
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

            {view === 'binance' && (
              <div className="dash-card p-5 flex flex-col gap-3" style={{ animation: 'dashFadeIn 400ms ease both' }}>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'rgba(240,185,11,0.14)', border: '1px solid rgba(240,185,11,0.35)' }}>
                    <span className="text-lg font-extrabold" style={{ color: '#f0b90b' }}>B</span>
                  </div>
                  <h2 className="text-base font-bold" style={{ ...heading, color: '#D4AF37' }}>{t("Enter Binance UID")}</h2>
                </div>
                <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{t("Enter your Binance Pay ID where you want to receive the funds.")}</p>
                <input
                  type="text"
                  value={binanceUid}
                  onChange={e => setBinanceUid(e.target.value)}
                  placeholder="e.g. 384920173"
                  className="dash-input w-full px-4 py-3 text-sm"
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

            {view === 'usdt' && (
              <div className="flex flex-col gap-3" style={{ animation: 'dashFadeIn 400ms ease both' }}>
                <p className="text-[12px] px-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{t("Select a network, then enter your wallet address.")}</p>
                {usdtNets.map((n, i) => {
                  const active = selectedNet?.name === n.name;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedNet(n)}
                      className="dash-card w-full flex items-center gap-3 p-3 transition-all active:scale-[0.98]"
                      style={active ? { borderColor: `${n.color}aa`, boxShadow: `0 0 14px ${n.color}55` } : undefined}
                    >
                      <span className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0" style={{ background: `${n.color}22`, border: `1px solid ${n.color}66` }}>
                        <NetworkLogo type={n.logo} color={n.color} />
                      </span>
                      <span className="flex-1 text-left text-sm font-bold" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.8)' }}>{n.name}</span>
                      {active && <span className="text-xs font-bold" style={{ color: n.color }}>✓</span>}
                    </button>
                  );
                })}

                {selectedNet && (
                  <div className="dash-card p-5 flex flex-col gap-3" style={{ animation: 'dashFadeIn 300ms ease both' }}>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: `${selectedNet.color}22`, border: `1px solid ${selectedNet.color}66` }}>
                        <NetworkLogo type={selectedNet.logo} color={selectedNet.color} />
                      </div>
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
    </div>
  );
}