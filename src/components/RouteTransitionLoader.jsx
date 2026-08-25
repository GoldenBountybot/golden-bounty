import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import AppLoadingScreen from '@/components/AppLoadingScreen';

// Shows the same branded loading screen used when entering the app whenever the
// user navigates from one page to another, so every transition feels identical.
const DURATION = 700;

export default function RouteTransitionLoader() {
  const { pathname } = useLocation();
  const first = useRef(true);
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // The app's own entry loading screen already covers the first render.
    if (first.current) { first.current = false; return; }
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