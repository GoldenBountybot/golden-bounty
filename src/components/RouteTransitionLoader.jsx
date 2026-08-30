import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import AppLoadingScreen from '@/components/AppLoadingScreen';

// Shows the same branded loading screen used when entering the app whenever the
// user navigates from one page to another, so every transition feels identical.
const DURATION = 2000;

export default function RouteTransitionLoader() {
  const { pathname } = useLocation();
  const first = useRef(true);
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // The app's own entry loading screen already covers the first render.
    if (first.current) { first.current = false; return; }
    // Game pages show their own asset loading screen. Running this one too
    // stacked two identical loaders on top of each other for a moment, and
    // their doubled gold glows read as a sudden lightning-like flash.
    if (pathname.startsWith('/games/') || pathname === '/free-spin') return;
    setShow(true);
    setProgress(8);
    const start = Date.now();
    const iv = setInterval(() => {
      setProgress(Math.min(100, Math.round(((Date.now() - start) / DURATION) * 100)));
    }, 60);
    const done = setTimeout(() => { setProgress(100); setShow(false); }, DURATION);
    return () => { clearInterval(iv); clearTimeout(done); };
  }, [pathname]);

  if (!show) return null;
  return <AppLoadingScreen progress={progress} />;
}