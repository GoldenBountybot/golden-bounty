import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';

// First-time players land on the promo code screen — UNLESS they joined through
// a Telegram referral link, in which case the $1 bonus is credited straight to
// their Stack and the promo screen is skipped.
export default function PromoWelcomeGate() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.promo_welcome_seen) return;
    if (location.pathname === '/promo-welcome') return;
    if (handled.current) return;
    handled.current = true;

    (async () => {
      try {
        const { data } = await supabase.rpc('claim_telegram_referral');
        if (data?.claimed) return; // referral bonus applied — no promo code screen
      } catch { /* fall through to the promo screen */ }
      navigate('/promo-welcome', { replace: true });
    })();
  }, [isAuthenticated, user, location.pathname, navigate]);

  return null;
}