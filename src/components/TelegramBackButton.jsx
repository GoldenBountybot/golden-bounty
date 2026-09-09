import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tgWebApp, isTelegramFullscreen } from '@/lib/telegram';

// Back navigation for the Telegram mini app.
//
// The app launches in Telegram's TRUE fullscreen mode (Bot API 8.0+), which
// hides Telegram's entire top chrome — and the native BackButton lives in that
// chrome. So calling BackButton.show() succeeds but nothing is ever visible.
// That is why the native back button disappeared after fullscreen was enabled.
//
// This component handles both worlds:
//   * Not fullscreen (older clients / non-fullscreen launch): drive the real
//     native BackButton in the top-left, exactly as before.
//   * Fullscreen: the native button is invisible, so render our own floating
//     in-app back button in the same top-left spot instead.
// In every case it is hidden on the home lobby ('/') and navigates history
// back (falling back to the lobby when there is nothing to go back to).
export default function TelegramBackButton() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [fullscreen, setFullscreen] = useState(isTelegramFullscreen());

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  // Keep the fullscreen flag in sync — Telegram may enter fullscreen a moment
  // after launch, and can toggle it, via the fullscreenChanged event.
  useEffect(() => {
    const wa = tgWebApp();
    if (!wa) return;
    const sync = () => setFullscreen(isTelegramFullscreen());
    sync();
    try { wa.onEvent?.('fullscreenChanged', sync); } catch { /* older clients */ }
    // Fullscreen can also settle slightly after ready(); re-check briefly.
    const timers = [setTimeout(sync, 200), setTimeout(sync, 800), setTimeout(sync, 1600)];
    return () => {
      timers.forEach(clearTimeout);
      try { wa.offEvent?.('fullscreenChanged', sync); } catch { /* ignore */ }
    };
  }, []);

  // Drive the native BackButton whenever we are NOT in fullscreen (where it is
  // visible). In fullscreen we hide it and use the in-app button below instead.
  useEffect(() => {
    let bb = null;
    let cancelled = false;

    // On some launch paths (e.g. a bot button that routes straight into a
    // sub-page via a startapp payload) the BackButton object is not ready on
    // the first render, so poll briefly until the API is available.
    const apply = () => {
      if (cancelled) return;
      bb = tgWebApp()?.BackButton;
      if (!bb) { setTimeout(apply, 150); return; }
      try {
        bb.onClick(goBack);
        if (fullscreen || pathname === '/') bb.hide();
        else bb.show();
      } catch { /* older Telegram clients */ }
    };
    apply();

    return () => {
      cancelled = true;
      try { bb?.offClick(goBack); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, navigate, fullscreen]);

  // In-app fallback button, shown only in fullscreen (native one is invisible)
  // and never on the home lobby. Sits in the top-left safe area so it clears
  // the notch / status bar that fullscreen exposes.
  if (!fullscreen || pathname === '/') return null;

  return (
    <button
      onClick={goBack}
      aria-label="Back"
      className="fixed left-3 z-[60] flex items-center justify-center w-9 h-9 rounded-full transition-all active:scale-95"
      style={{
        top: 'max(env(safe-area-inset-top, 0px), 12px)',
        border: '1px solid rgba(214,178,98,0.55)',
        background: 'rgba(11,8,5,0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: '#e8c878',
      }}
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}
