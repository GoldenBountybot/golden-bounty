import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tgWebApp } from '@/lib/telegram';

// Shows Telegram's native BackButton on every page except home.
// tgReady() in AuthContext runs after this component's first effect and can
// reset the button, so we re-show it with a delay and on every navigation.
export default function TelegramBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const wa = tgWebApp();
  const bb = wa?.BackButton;
  const isHome = location.pathname === '/';

  useEffect(() => {
    if (!bb) return;
    const onClick = () => {
      if (window.history.length > 1) navigate(-1);
      else wa?.close?.();
    };
    let cancelled = false;
    const apply = () => {
      if (cancelled) return;
      try {
        if (isHome) { bb.hide(); }
        else { bb.show(); bb.onClick(onClick); }
      } catch { /* older clients */ }
    };
    apply();
    const t = setTimeout(apply, 300);
    return () => { cancelled = true; clearTimeout(t); try { bb.offClick(onClick); } catch {} };
  }, [navigate, bb, isHome]);

  return null;
}
