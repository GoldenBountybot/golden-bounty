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

    const apply = () => {
      if (cancelled) return;
      const bb = tgWebApp()?.BackButton;
      if (!bb) return;
      try {
        bb.onClick(goBack);
        if (shouldShow) bb.show();
        else bb.hide();
      } catch {}
    };

    apply();
    const interval = setInterval(apply, 400);

    const reapply = () => apply();
    try { wa?.onEvent?.('fullscreenChanged', reapply); } catch {}
    try { wa?.onEvent?.('viewportChanged', reapply); } catch {}
    try { wa?.onEvent?.('activated', reapply); } catch {}
    try { wa?.onEvent?.('themeChanged', reapply); } catch {}

    return () => {
      cancelled = true;
      clearInterval(interval);
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
