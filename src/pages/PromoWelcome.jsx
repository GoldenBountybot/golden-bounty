import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Ticket, Loader2, Check, Gift, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import FadeImage from '@/components/FadeImage';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";
const BANNER = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f23530b9f_file_00000000588c81f7b3cdd650f71b7b28.png';

export default function PromoWelcome() {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [profile, setProfile] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let me = await base44.auth.me();
        // Returning users who already saw the promo welcome page are sent
        // straight to home — the promo code input is only for first-time
        // registrations (prevents logout → re-register showing it again).
        if (me?.promo_welcome_seen) {
          window.location.href = '/';
          return;
        }
        // Google sign-up users skip the OTP flow, so they may not have a
        // uid / promo_code yet — set them up here so the promo card shows.
        if (me && (!me.uid || !me.promo_code)) {
          const uid = me.uid || Math.floor(1000000000 + Math.random() * 9000000000).toString();
          const promoCode = me.promo_code || ('GB' + uid);
          let avatar_url = me.avatar_url || "";
          if (!avatar_url) {
            try {
              const r = await base44.functions.invoke("assignAvatar", { gender: me.gender || "male" });
              avatar_url = r?.data?.image_url || "";
            } catch { /* avatar optional */ }
          }
          try { await base44.auth.updateMe({ uid, promo_code: promoCode, avatar_url, promo_welcome_seen: true }); } catch { /* ignore */ }
          me = { ...me, uid, promo_code: promoCode, avatar_url, promo_welcome_seen: true };
        } else {
          // Mark as seen so a future re-registration skips this page.
          try { await base44.auth.updateMe({ promo_welcome_seen: true }); } catch { /* ignore */ }
          me = { ...me, promo_welcome_seen: true };
        }
        setProfile(me);
      } catch { /* ignore */ }
      setChecking(false);
    })();
  }, []);

  const myPromo = profile?.promo_code || (profile?.uid ? 'GB' + profile.uid : '');
  const claimed = !!profile?.promo_claimed;

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
      // invoke() throws on non-2xx; the error body is at e.response.data
      const msg = e?.response?.data?.error || e?.data?.error || e?.message || 'Failed to redeem promo code';
      toast({ title: msg });
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => { window.location.href = '/'; };

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: '#0D0D0D', fontFamily: SANS }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(120% 60% at 50% -10%, rgba(212,175,55,0.12), transparent 60%)' }} />

      <main className="relative z-10 max-w-none w-full mx-auto flex-1 flex flex-col justify-center px-4 py-6 gap-5">
        {/* Banner */}
        <div className="rounded-2xl overflow-hidden border shadow-lg" style={{ borderColor: 'rgba(212,175,55,0.4)', boxShadow: '0 10px 36px rgba(0,0,0,0.6), 0 0 22px rgba(212,175,55,0.18)' }}>
          <FadeImage src={BANNER} alt="Use promo code to get $1 USDT — only for Stack" className="w-full h-auto block" />
        </div>

        {checking ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#D4AF37' }} />
          </div>
        ) : done || claimed ? (
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

      </main>
    </div>
  );
}