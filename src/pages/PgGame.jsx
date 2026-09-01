import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { PG_GAMES } from '@/lib/pgGames';
import AppLoadingScreen from '@/components/AppLoadingScreen';

// Launches a PG SOFT game: our backend creates the seamless-wallet session
// and returns the PG launch HTML, which we render inside a full-screen frame.
export default function PgGame() {
  const { gameId } = useParams();
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false); // our loader stays until PG is done connecting
  const title = PG_GAMES.find((g) => g.id === gameId)?.title || 'PG SOFT';

  const frameRef = useRef(null);
  const progressRef = useRef(0);
  const connectTimer = useRef(null);

  // Keep the latest progress readable from the frame-load handler.
  useEffect(() => { progressRef.current = progress; }, [progress]);

  // The PG frame mounts hidden behind our branded loader, so PG's own
  // "connecting" step happens *during* our loading screen instead of after it.
  // We only creep up to ~70% here, leaving the last stretch for the connection
  // phase that runs once the frame has loaded.
  useEffect(() => {
    setReady(false);
    setProgress(3);
    const iv = setInterval(() => setProgress((p) => (p < 70 ? p + 1 : p)), 220);
    return () => {
      clearInterval(iv);
      if (connectTimer.current) clearInterval(connectTimer.current);
    };
  }, [gameId]);

  // Once the PG document has loaded, PG runs its own connecting/handshake step
  // inside the hidden frame. We hold our branded loader for that whole window
  // (PG's frame is cross-origin, so we can't inspect it) and drive the progress
  // bar smoothly to 100 over the same period — so the connection completes
  // *inside* our loading screen and PG's own loader is what appears next.
  const onFrameLoad = () => {
    const CONNECT_MS = 9000;
    const started = Date.now();
    const from = progressRef.current;
    const tick = setInterval(() => {
      const t = Math.min(1, (Date.now() - started) / CONNECT_MS);
      setProgress(Math.round(from + (100 - from) * t));
      if (t >= 1) {
        clearInterval(tick);
        setReady(true);
      }
    }, 120);
    connectTimer.current = tick;
  };

  useEffect(() => {
    let alive = true;
    setHtml(''); setError('');
    base44.functions
      .invoke('pgsoftLaunchGame', { game_id: gameId, language: 'en' })
      .then(({ data }) => {
        if (!alive) return;
        if (data?.ok && data.html) setHtml(data.html);
        else setError([data?.reason, data?.detail].filter(Boolean).join(' — ') || 'Could not start this game.');
      })
      .catch((e) => { if (alive) setError(e.message || 'Could not start this game.'); });
    return () => { alive = false; };
  }, [gameId]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Floating back button — no header bar, game runs full screen */}
      {html && ready && (
        <Link
          to="/"
          className="absolute z-20 p-1.5 rounded-full bg-black/50"
          style={{ border: '1px solid rgba(214,178,98,0.4)', top: 'calc(env(safe-area-inset-top, 0px) + 8px)', left: '8px' }}
        >
          <ArrowLeft className="w-4 h-4 text-amber-300" />
        </Link>
      )}

      <div className="flex-1 relative">
        {html && (
          <iframe
            ref={frameRef}
            title={title}
            srcDoc={html}
            allow="autoplay; fullscreen"
            onLoad={onFrameLoad}
            className="absolute inset-0 w-full h-full border-0"
            style={{ opacity: ready ? 1 : 0, transition: 'opacity 400ms ease-out' }}
          />
        )}

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
            <p className="text-sm text-amber-100/80">{error}</p>
            <Link to="/" className="px-4 py-2 rounded-lg text-xs font-bold"
              style={{ background: 'linear-gradient(to bottom,#f5c542,#c8881e)', color: '#2a1a06' }}>Back to lobby</Link>
          </div>
        ) : !ready ? (
          <AppLoadingScreen progress={progress} />
        ) : null}
      </div>
    </div>
  );
}