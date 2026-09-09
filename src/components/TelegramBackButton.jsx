import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tgWebApp } from '@/lib/telegram';

// Drives Telegram's NATIVE BackButton (top-left of the mini app, where the
// "Close" control sits). On the home lobby ('/') it hides so the launcher
// shows "Close"; on every other page it shows the native "‹ Back" arrow.
// Clicking it navigates browser history back, falling back to the lobby.
//
// Robustness note: requesting fullscreen (and some launch paths — inline
// buttons, startapp deep links) makes Telegram rebuild its top chrome AFTER
// the app mounts, which wipes a back button that was shown too early. So we
// don't set it just once: we re-apply across the transition window with a few
// retries AND re-apply whenever Telegram fires a chrome/viewport event. That
// is what makes the arrow appear no matter which button or link opened the app.
export default function TelegramBackButton() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const wa = tgWebApp();
    const shouldShow = pathname !== '/';

    const goBack = () => {
      if (window.history.length > 1) navigate(-1);
      else navigate('/');
    };

    let cancelled = false;
    const timers = [];

    const apply = () => {
      if (cancelled) return;
      const bb = tgWebApp()?.BackButton;
      if (!bb) return;
      try {
        bb.onClick(goBack);
        if (shouldShow) bb.show();
        else bb.hide();
      } catch { /* older Telegram clients */ }
    };

    // Apply now, then retry across the fullscreen/viewport transition window.
    apply();
    [100, 300, 600, 1000, 1600, 2500].forEach((ms) => {
      timers.push(setTimeout(apply, ms));
    });

    // Re-apply whenever Telegram rebuilds its chrome or resizes the viewport.
    const reapply = () => apply();
    try { wa?.onEvent?.('fullscreenChanged', reapply); } catch { /* unsupported */ }
    try { wa?.onEvent?.('viewportChanged', reapply); } catch { /* unsupported */ }
    try { wa?.onEvent?.('activated', reapply); } catch { /* unsupported */ }

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      const bb = tgWebApp()?.BackButton;
      try { bb?.offClick(goBack); } catch { /* ignore */ }
      try { wa?.offEvent?.('fullscreenChanged', reapply); } catch { /* ignore */ }
      try { wa?.offEvent?.('viewportChanged', reapply); } catch { /* ignore */ }
      try { wa?.offEvent?.('activated', reapply); } catch { /* ignore */ }
    };
  }, [pathname, navigate]);

  return null;
}
