import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tgWebApp } from '@/lib/telegram';

// Shows Telegram's native BackButton on every page except home.
// tgReady() in AuthContext runs after this component's first effect and can
// reset the button, so we re-show it with a delay and on every navigation.
export default function TelegramBackButton() {
  const navigate = useNavigate();
  const wa = tgWebApp();
  const bb = wa?.BackButton;

  useEffect(() => {
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
  }, [navigate, bb]);

  return null;
}
