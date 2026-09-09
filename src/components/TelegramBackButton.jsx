import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { tgWebApp } from '@/lib/telegram';

// Shows Telegram's native BackButton on every page except home.
// In fullscreen mode the Telegram header (and with it the native BackButton)
// turns invisible, so there we render an in-app floating back button instead.
// tgReady() in AuthContext runs after this component's first effect and can
// reset the button, so we re-show it with a delay and on every navigation.
export default function TelegramBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const wa = tgWebApp();
  const bb = wa?.BackButton;
  const isHome = location.pathname === '/';
  const [isFullscreen, setIsFullscreen] = useState(!!wa?.isFullscreen);

  // Track enter/leave fullscreen so the in-app back button appears and
  // disappears together with the mode. Bot API 8.0+.
  useEffect(() => {
    const sync = () => setIsFullscreen(!!wa?.isFullscreen);
    try { wa?.onEvent?.('fullscreenChanged', sync); } catch { /* older clients */ }
    const t = setTimeout(sync, 300);
    return () => {
      clearTimeout(t);
      try { wa?.offEvent?.('fullscreenChanged', sync); } catch { /* older clients */ }
    };
  }, [wa]);

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

  // Outside fullscreen the native header button is visible — nothing to draw.
  if (isHome || !isFullscreen) return null;

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else wa?.close?.();
  };

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Back"
      className="fixed z-[999] left-3 flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/40 bg-black/70 text-amber-300 shadow-lg backdrop-blur-sm active:scale-95"
      style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}
