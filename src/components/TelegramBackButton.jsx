import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tgWebApp } from '@/lib/telegram';

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

    // fullscreen chrome rebuild drops the arrow but Telegram still thinks it is
    // visible, so a plain show() is ignored. hide() then show() forces it back.
    const force = () => {
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

    force();
    const timers = [80, 250, 500, 900, 1400, 2200].map((ms) => setTimeout(force, ms));

    const reapply = () => force();
    try { wa?.onEvent?.('fullscreenChanged', reapply); } catch {}
    try { wa?.onEvent?.('viewportChanged', reapply); } catch {}
    try { wa?.onEvent?.('activated', reapply); } catch {}
    try { wa?.onEvent?.('themeChanged', reapply); } catch {}

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      const bb = tgWebApp()?.BackButton;
      try { bb?.offClick(goBack); } catch {}
      try { wa?.offEvent?.('fullscreenChanged', reapply); } catch {}
      try { wa?.offEvent?.('viewportChanged', reapply); } catch {}
      try { wa?.offEvent?.('activated', reapply); } catch {}
      try { wa?.offEvent?.('themeChanged', reapply); } catch {}
    };
  }, [pathname, navigate]);

  return null;
}
