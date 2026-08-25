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

  // The PG frame mounts hidden behind our branded loader, so PG's own
  // "connecting" step happens *during* our loading screen instead of after it.
  useEffect(() => {
    setReady(false);
    setProgress(3);
    const iv = setInterval(() => setProgress((p) => (p < 96 ? p + 1 : p)), 260);
    return () => clearInterval(iv);
  }, [gameId]);

  // Once the PG document has loaded we keep our loader up and watch the frame
  // until the game itself is actually rendering (its canvas has real pixels) —
  // so PG's own black "connecting" screen never becomes visible. A hard cap
  // makes sure the player is never stuck on our loader.
  const onFrameLoad = () => {
    const started = Date.now();
    const reveal = () => { setProgress(100); setReady(true); };
    const poll = setInterval(() => {
      const elapsed = Date.now() - started;
      let painted = false;
      try {
        const doc = frameRef.current?.contentDocument;
        const c = doc?.querySelector('canvas');
        painted = !!c && c.clientWidth > 0 && c.clientHeight > 0;
      } catch { /* cross-origin — fall back to the time cap */ }
      if ((painted && elapsed > 4000) || elapsed > 20000) {
        clearInterval(poll);
        reveal();
      }
    }, 400);
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