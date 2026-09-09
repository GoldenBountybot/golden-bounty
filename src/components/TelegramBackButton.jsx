import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tgWebApp } from '@/lib/telegram';

// Shows Telegram's native BackButton on every page (except home).
// tgReady() in AuthContext runs AFTER this component's first effect and can
// reset the button, so we re-show it with a short delay and on every route
// change to keep it visible. A floating in-app button is rendered as a
// fallback for true fullscreen mode where the native header is hidden.
export default function TelegramBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    setIsTelegram(!!tgWebApp());
  }, []);

  // Native BackButton — re-shown after a delay so it survives tgReady()
  // and on every navigation so it stays visible across page changes.
  useEffect(() => {
    const wa = tgWebApp();
    const bb = wa?.BackButton;
    if (!bb) return;

    const onClick = () => {
      if (window.history.length > 1) navigate(-1);
      else wa?.close?.();
    };

    let cancelled = false;
    const show = () => {
      if (cancelled) return;
      try { bb.show(); bb.onClick(onClick); } catch { /* older clients */ }
    };

    show();
    const t1 = setTimeout(show, 200);
    const t2 = setTimeout(show, 600);

    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      try { bb.offClick(onClick); } catch { /* ignore */ }
    };
  }, [navigate, location.pathname]);

  // Hide the floating button on the root page — nothing to go back to
  if (!isTelegram || location.pathname === '/') return null;

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else tgWebApp()?.close?.();
  };

  return (
    <button
      onClick={handleBack}
      aria-label="Back"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top) + 0.5rem)',
        left: '0.5rem',
        zIndex: 9999,
        width: '2.5rem',
        height: '2.5rem',
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.45)',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        touchAction: 'manipulation',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  );
}
