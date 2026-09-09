import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { tgWebApp } from '@/lib/telegram';

// One permanent in-app control at the spot of Telegram's close button
// (top-right). On the home page it closes the mini app; on every other
// page it becomes a back button. Telegram's own header controls are not
// used — this button works in fullscreen and in every launch mode.
export default function TelegramBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const wa = tgWebApp();
  if (!wa) return null;
  const isHome = location.pathname === '/';

  const handle = () => {
    if (isHome) { wa.close?.(); return; }
    if (window.history.length > 1) navigate(-1);
    else wa.close?.();
  };

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={isHome ? 'Close' : 'Back'}
      className="fixed z-[999] right-3 flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/40 bg-black/70 text-amber-300 shadow-lg backdrop-blur-sm active:scale-95"
      style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      {isHome ? <X className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
    </button>
  );
}
