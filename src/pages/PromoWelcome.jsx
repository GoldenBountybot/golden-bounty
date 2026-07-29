import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Ticket, Loader2, Check, Copy, Gift, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";
const BANNER = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f23530b9f_file_00000000588c81f7b3cdd650f71b7b28.png';

export default function PromoWelcome() {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setProfile).catch(() => {});
  }, []);

  const myPromo = profile?.promo_code || (profile?.uid ? 'GB' + profile.uid : '');
  const claimed = !!profile?.promo_claimed;

  const copy = async (text, label) => {
    try { await navigator.clipboard.writeText(text); toast({ title: `${label} copied` }); } catch { /* ignore */ }
  };

  const claim = async () => {
    if (!code.trim()) { toast({ title: 'Enter a promo code' }); return; }
    if (myPromo && code.trim().toUpperCase() === myPromo.toUpperCase()) {
      toast({ title: 'You cannot use your own promo code' });
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('redeemPromoCode', { promo_code: code.trim() });
      const data = res?.data || res;
      if (data?.ok) {
        setDone(true);
        toast({ title: '$1 bonus added to your Stack!' });
      } else {
        toast({ title: data?.error || 'Invalid promo code' });
      }
    } catch (e) {
      toast({ title: e?.message || 'Failed to redeem promo code' });
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => { window.location.href = '/'; };

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: '#0D0D0D', fontFamily: SANS }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(120% 60% at 50% -10%, rgba(212,175,55,0.12), transparent 60%)' }} />

      <main className="relative z-10 max-w-md w-full mx-auto flex-1 flex flex-col px-4 py-6 gap-5">
        {/* Banner */}
        <div className="rounded-2xl overflow-hidden border shadow-lg" style={{ borderColor: 'rgba(212,175,55,0.4)', boxShadow: '0 10px 36px rgba(0,0,0,0.6), 0 0 22px rgba(212,175,55,0.18)' }}>
          <img src={BANNER} alt="Use promo code to get $1 USDT — only for Stack" className="w-full h-auto block" />
        </div>

        {done || claimed ? (
          <div className="dash-card p-5 flex flex-col items-center gap-3 text-center" style={{ animation: 'dashFadeIn 400ms ease both' }}>
            <div className="flex items-center justify-center w-14 h-14 rounded-full" style={{ background: 'rgba(52,211,153,0.14)', border: '1px solid rgba(52,211,153,0.45)' }}>
              <Check className="w-7 h-7" style={{ color: '#34d399' }} />
            </div>
            <h2 className="text-lg font-extrabold" style={{ color: '#fff' }}>$1 Stack bonus claimed!</h2>
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Your $1 bonus is locked in your Stack and earning daily profit. Open the Stack tab to view it.
            </p>
            <button onClick={goHome} className="dash-btn-gold px-6 py-3 text-sm flex items-center gap-2">
              Go to Home <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="dash-card p-5 flex flex-col gap-3" style={{ animation: 'dashFadeIn 400ms ease both' }}>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.35)' }}>
                <Ticket className="w-4 h-4" style={{ color: '#D4AF37' }} />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: '#D4AF37' }}>Enter a promo code</h2>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Get $1 in your Stack · stack-only bonus</p>
              </div>
            </div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ENTER PROMO CODE"
              className="dash-input w-full px-4 py-3 text-sm text-center font-bold tracking-[0.2em] uppercase"
              style={{ letterSpacing: '0.15em' }}
            />
            <button onClick={claim} disabled={loading} className="dash-btn-gold w-full py-3 text-sm flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Claiming...</> : <><Gift className="w-4 h-4" /> Claim $1 Bonus</>}
            </button>
            <button onClick={goHome} className="text-[12px] font-semibold mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Skip for now
            </button>
          </div>
        )}

        {/* Share your own promo code */}
        {myPromo && (
          <div className="dash-card p-5 flex flex-col gap-3" style={{ animation: 'dashFadeIn 500ms ease both' }}>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.35)' }}>
                <Gift className="w-4 h-4" style={{ color: '#D4AF37' }} />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: '#D4AF37' }}>Your promo code</h2>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Share it — earn 5% on every deposit your referrals make</p>
              </div>
            </div>
            <button
              onClick={() => copy(myPromo, 'Promo code')}
              className="w-full px-4 py-3 rounded-2xl flex items-center justify-between gap-2 transition-all active:scale-[0.98]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.35)' }}
            >
              <span className="text-[15px] font-bold tracking-[0.15em]" style={{ color: '#fff' }}>{myPromo}</span>
              <Copy className="w-4 h-4" style={{ color: 'rgba(212,175,55,0.7)' }} />
            </button>
            <button onClick={goHome} className="dash-btn-gold w-full py-3 text-sm">Start Playing</button>
          </div>
        )}
      </main>
    </div>
  );
}