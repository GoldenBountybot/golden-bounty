import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tgWebApp } from '@/lib/telegram';

// Floating in-app back button for the Telegram Mini App.
// Works in true fullscreen mode — where Telegram hides the native header
// (and therefore the native BackButton) — because this button is rendered
// inside the web content itself, not in Telegram's chrome.
export default function TelegramBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    setIsTelegram(!!tgWebApp());
  }, []);

  // Also try the native BackButton — visible whenever the header is shown
  // (i.e. when not in fullscreen). Harmless in fullscreen.
  useEffect(() => {
    const wa = tgWebApp();
    const bb = wa?.BackButton;
    if (!bb) return;
    const onClick = () => {
      if (window.history.length > 1) navigate(-1);
      else wa?.close?.();
    };
    try { bb.show(); bb.onClick(onClick); } catch { /* older clients */ }
    return () => { try { bb.offClick(onClick); } catch { /* ignore */ } };
  }, [navigate]);

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
