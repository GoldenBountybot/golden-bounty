import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tgWebApp } from '@/lib/telegram';

// Shows Telegram's native back button in the top-left corner of the mini app
// on every screen except the home lobby, and wires it to in-app navigation
// (history back, falling back to the lobby when there is nothing to go back to).
export default function TelegramBackButton() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = () => {
      if (window.history.length > 1) navigate(-1);
      else navigate('/');
    };

    let bb = null;
    let cancelled = false;

    // On some launch paths (e.g. a bot button that routes straight into a
    // sub-page via a startapp payload) the Telegram SDK's BackButton object
    // is not ready on the first render, so a one-shot `if (!bb) return` would
    // silently skip showing it — that is why the back button only appeared
    // from certain entry points. Poll briefly until the API is available,
    // then apply the correct visibility for the current route.
    const apply = () => {
      if (cancelled) return;
      bb = tgWebApp()?.BackButton;
      if (!bb) { setTimeout(apply, 150); return; }
      try {
        bb.onClick(onClick);
        if (pathname === '/') bb.hide(); else bb.show();
      } catch { /* older Telegram clients */ }
    };
    apply();

    return () => {
      cancelled = true;
      try { bb?.offClick(onClick); } catch { /* ignore */ }
    };
  }, [pathname, navigate]);

  return null;
}
