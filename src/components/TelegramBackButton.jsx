import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tgWebApp } from '@/lib/telegram';

// Fullscreen Telegram Mini App with a floating in-app back button.
// In true fullscreen (Bot API 8.0+) Telegram hides its native header, so the
// native BackButton is invisible — this component renders a custom floating
// back button inside the web content that works in fullscreen mode.
export default function TelegramBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const wa = tgWebApp();
  const isTelegram = !!wa;

  // Ensure fullscreen is requested (also done in tgReady, but re-request here
  // with a delay in case the early call was too soon for some clients).
  useEffect(() => {
    if (!wa) return;
    let cancelled = false;
    const enter = () => {
      if (cancelled) return;
      try { wa.requestFullscreen?.(); } catch { /* older clients */ }
    };
    enter();
    const t = setTimeout(enter, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  // Also show the native BackButton for clients that don't support fullscreen.
  useEffect(() => {
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
    const t = setTimeout(show, 300);
    return () => { cancelled = true; clearTimeout(t); try { bb.offClick(onClick); } catch {} };
  }, [navigate, location.pathname]);

  // Hide the floating button on the root page — nothing to go back to
  if (!isTelegram || location.pathname === '/') return null;

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else wa?.close?.();
  };

  return (
    <button
      onClick={handleBack}
      aria-label="Back"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top) + 0.5rem)',
        left: '0.5rem',
        zIndex: 99999,
        width: '2.75rem',
        height: '2.75rem',
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.55)',
        border: '1px solid rgba(212,175,55,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        touchAction: 'manipulation',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  );
}
