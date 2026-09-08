import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tgWebApp } from '@/lib/telegram';

// Shows Telegram's native back button in the top-left corner of the mini app
// on every screen, and wires it to in-app navigation (history back, falling
// back to closing the mini app when there is nothing to go back to).
export default function TelegramBackButton() {
  const navigate = useNavigate();

  useEffect(() => {
    const bb = tgWebApp()?.BackButton;
    if (!bb) return;

    const onClick = () => {
      if (window.history.length > 1) navigate(-1);
      else tgWebApp()?.close?.();
    };

    try {
      bb.show();
      bb.onClick(onClick);
    } catch { /* older Telegram clients */ }

    return () => { try { bb.offClick(onClick); } catch { /* ignore */ } };
  }, [navigate]);

  return null;
}
