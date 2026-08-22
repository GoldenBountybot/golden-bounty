import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

// First-time players (auto signed in from Telegram) land on the promo code
// screen right after loading finishes. Returning players are untouched.
export default function PromoWelcomeGate() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.promo_welcome_seen) return;
    if (location.pathname === '/promo-welcome') return;
    navigate('/promo-welcome', { replace: true });
  }, [isAuthenticated, user, location.pathname, navigate]);

  return null;
}