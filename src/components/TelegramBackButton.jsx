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
    const bb = tgWebApp()?.BackButton;
    if (!bb) return;

    const onClick = () => {
      if (window.history.length > 1) navigate(-1);
      else navigate('/');
    };

    try {
      bb.onClick(onClick);
      if (pathname === '/') bb.hide(); else bb.show();
    } catch { /* older Telegram clients */ }

    return () => { try { bb.offClick(onClick); } catch { /* ignore */ } };
  }, [pathname, navigate]);

  return null;
}