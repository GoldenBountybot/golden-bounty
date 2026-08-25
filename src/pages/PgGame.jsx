import React, { useEffect, useState } from 'react';
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
  const title = PG_GAMES.find((g) => g.id === gameId)?.title || 'PG SOFT';

  // Branded loading bar creeps up to 90% while the launch request is in flight,
  // then jumps to 100% once the PG game frame is handed over.
  useEffect(() => {
    if (html) { setProgress(100); return; }
    setProgress(6);
    const iv = setInterval(() => setProgress((p) => (p < 90 ? p + 3 : p)), 120);
    return () => clearInterval(iv);
  }, [html]);

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
      {html && (
        <Link
          to="/"
          className="absolute z-20 p-1.5 rounded-full bg-black/50"
          style={{ border: '1px solid rgba(214,178,98,0.4)', top: 'calc(env(safe-area-inset-top, 0px) + 8px)', left: '8px' }}
        >
          <ArrowLeft className="w-4 h-4 text-amber-300" />
        </Link>
      )}

      <div className="flex-1 relative">
        {html ? (
          <iframe
            title={title}
            srcDoc={html}
            allow="autoplay; fullscreen"
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
            <p className="text-sm text-amber-100/80">{error}</p>
            <Link to="/" className="px-4 py-2 rounded-lg text-xs font-bold"
              style={{ background: 'linear-gradient(to bottom,#f5c542,#c8881e)', color: '#2a1a06' }}>Back to lobby</Link>
          </div>
        ) : (
          <AppLoadingScreen progress={progress} />
        )}
      </div>
    </div>
  );
}