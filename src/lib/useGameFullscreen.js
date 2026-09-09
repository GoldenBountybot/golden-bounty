import { useEffect } from 'react';
import { tgWebApp } from '@/lib/telegram';

// Maximizes a game screen inside the mini app: expand to full height and stop
// an accidental swipe-down from closing the app. Never requests Telegram's
// fullscreen mode — that hides the native header, and the header's Back
// button is the only way back on game pages.
export function useGameFullscreen() {
  useEffect(() => {
    const wa = tgWebApp();
    try {
      wa?.expand?.();
      wa?.disableVerticalSwipes?.();
    } catch { /* older Telegram clients */ }
  }, []);
}
