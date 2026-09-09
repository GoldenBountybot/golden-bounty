import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tgWebApp } from '@/lib/telegram';

// Controls Telegram's native header button: on the home page the native
// "Close" button stays as-is; on every other page it becomes the native
// "Back" button, which navigates back inside the app.
export default function TelegramBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const wa = tgWebApp();
  const bb = wa?.BackButton;
  const isHome = location.pathname === '/';

  useEffect(() => {
    if (!bb) return;
    const onClick = () => navigate(-1);
    if (isHome) {
      bb.hide();
    } else {
      bb.onClick(onClick);
      bb.show();
    }
    return () => bb.offClick(onClick);
  }, [bb, isHome, navigate]);

  return null;
}
