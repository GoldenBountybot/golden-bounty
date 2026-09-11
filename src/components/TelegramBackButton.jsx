import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tgWebApp } from '@/lib/telegram';
import { navDiag, navDiagRoute } from '@/lib/navDiag';

export default function TelegramBackButton() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const arrivedRef = useRef(Date.now());

  useEffect(() => {
    const wa = tgWebApp();
    const shouldShow = pathname !== '/';

    navDiagRoute(pathname + (window.location.search || ''));
    arrivedRef.current = Date.now();

    // A back event in the first moment after a page opens is spurious —
    // Telegram rebuilds the fullscreen chrome and closes the keyboard right
    // then, and the re-delivered state bounced the user straight off the
    // freshly opened page (deposit tap -> loading -> back to the dashboard).
    // A real user needs a moment to see the page and aim at the arrow anyway.
    const goBack = () => {
      const sinceArrival = Date.now() - arrivedRef.current;
      if (sinceArrival < 1500) { navDiag('nav-back-blocked', pathname + ' +' + sinceArrival + 'ms'); return; }
      navDiag('nav-back', pathname + ' len=' + window.history.length);
      if (window.history.length > 1) navigate(-1);
      else navigate('/');
    };

    // A popstate with no matching nav-back row means the back came from the
    // webview/system level, not from our arrow handler.
    const onPop = () => navDiag('popstate', '-> ' + document.location.pathname);
    window.addEventListener('popstate', onPop);

    let cancelled = false;

    // Plain show()/hide() is safe to call any time. A hide() -> show() cycle is
    // only needed when Telegram rebuilds the native chrome (fullscreen toggle,
    // app reactivation) — there the button state goes stale and a plain show()
    // is ignored. But hiding the button right as a page opens — exactly when
    // the keyboard closes after tapping Deposit — made the Android client emit
    // a spurious back event that bounced the user off the freshly opened page
    // (deposit tap -> loading -> back to the dashboard, first time only).
    const apply = () => {
      if (cancelled) return;
      const bb = tgWebApp()?.BackButton;
      if (!bb) return;
      try {
        bb.onClick(goBack);
        if (shouldShow) bb.show(); else bb.hide();
      } catch {}
    };
    const applyHard = () => {
      if (cancelled) return;
      const bb = tgWebApp()?.BackButton;
      if (!bb) return;
      try {
        bb.onClick(goBack);
        if (shouldShow) {
          try { bb.hide(); } catch {}
          bb.show();
        } else {
          bb.hide();
        }
      } catch {}
    };

    apply();
    const timers = [80, 250, 500, 900, 1400, 2200].map((ms) => setTimeout(apply, ms));

    try { wa?.onEvent?.('fullscreenChanged', applyHard); } catch {}
    try { wa?.onEvent?.('activated', applyHard); } catch {}
    try { wa?.onEvent?.('viewportChanged', apply); } catch {}
    try { wa?.onEvent?.('themeChanged', apply); } catch {}

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      window.removeEventListener('popstate', onPop);
      const bb = tgWebApp()?.BackButton;
      try { bb?.offClick(goBack); } catch {}
      try { wa?.offEvent?.('fullscreenChanged', applyHard); } catch {}
      try { wa?.offEvent?.('activated', applyHard); } catch {}
      try { wa?.offEvent?.('viewportChanged', apply); } catch {}
      try { wa?.offEvent?.('themeChanged', apply); } catch {}
    };
  }, [pathname, navigate]);

  return null;
}
