import { useEffect } from 'react';
import { tgWebApp } from '@/lib/telegram';

// Puts a game screen into real fullscreen: Telegram's own fullscreen mode
// (hides the mini-app chrome) plus the browser Fullscreen API where it is
// allowed. Both are restored when leaving the game.
export function useGameFullscreen() {
  useEffect(() => {
    const wa = tgWebApp();
    try {
      wa?.requestFullscreen?.();
      wa?.expand?.();
      wa?.disableVerticalSwipes?.();
    } catch { /* older Telegram clients */ }

    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => { /* needs a user gesture — Telegram fullscreen still applies */ });
    }

    return () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, []);
}