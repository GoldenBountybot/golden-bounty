import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tgWebApp } from '@/lib/telegram';

// Drives Telegram's NATIVE BackButton (top-left of the mini app, where the
// "Close" control sits). On the home lobby ('/') it hides so the launcher
// shows "Close"; on every other page it shows the native "‹ Back" arrow.
// Clicking it navigates browser history back, falling back to the lobby.
export default function TelegramBackButton() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const goBack = () => {
      if (window.history.length > 1) navigate(-1);
      else navigate('/');
    };

    let bb = null;
    let cancelled = false;

    // On some launch paths (e.g. a bot button routing straight into a sub-page
    // via a startapp payload) the BackButton object is not ready on the first
    // render, so poll briefly until the API is available.
    const apply = () => {
      if (cancelled) return;
      bb = tgWebApp()?.BackButton;
      if (!bb) { setTimeout(apply, 150); return; }
      try {
        bb.onClick(goBack);
        if (pathname === '/') bb.hide();
        else bb.show();
      } catch { /* older Telegram clients */ }
    };
    apply();

    return () => {
      cancelled = true;
      try { bb?.offClick(goBack); } catch { /* ignore */ }
    };
  }, [pathname, navigate]);

  return null;
}
