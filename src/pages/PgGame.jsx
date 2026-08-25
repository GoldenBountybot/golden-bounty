import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { PG_GAMES } from '@/lib/pgGames';

// Launches a PG SOFT game: our backend creates the seamless-wallet session
// and returns the PG launch HTML, which we render inside a full-screen frame.
export default function PgGame() {
  const { gameId } = useParams();
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const title = PG_GAMES.find((g) => g.id === gameId)?.title || 'PG SOFT';

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
      <div className="flex items-center gap-3 px-3 py-2" style={{ borderBottom: '1px solid rgba(214,178,98,0.2)' }}>
        <Link to="/" className="p-1.5 rounded-full" style={{ border: '1px solid rgba(214,178,98,0.4)' }}>
          <ArrowLeft className="w-4 h-4 text-amber-300" />
        </Link>
        <span className="flex-1 text-center text-sm font-black italic text-amber-200 pr-8" style={{ fontFamily: 'Georgia, serif' }}>{title}</span>
      </div>

      <div className="flex-1 relative">
        {html ? (
          <iframe
            title={title}
            srcDoc={html}
            allow="autoplay; fullscreen"
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
            {error ? (
              <>
                <p className="text-sm text-amber-100/80">{error}</p>
                <Link to="/" className="px-4 py-2 rounded-lg text-xs font-bold"
                  style={{ background: 'linear-gradient(to bottom,#f5c542,#c8881e)', color: '#2a1a06' }}>Back to lobby</Link>
              </>
            ) : (
              <>
                <Loader2 className="w-7 h-7 text-amber-300 animate-spin" />
                <p className="text-xs text-amber-100/70">Starting {title}…</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}