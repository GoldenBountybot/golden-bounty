import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getEndorphinaGame } from '@/lib/endorphinaGames';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import { useGameFullscreen } from '@/lib/useGameFullscreen';
import { useProviderBalanceSync } from '@/lib/useProviderBalanceSync';

// Launches an Endorphina game: our backend creates the seamless-wallet session
// token, signs the launch URL, and we render it full screen.
export default function EndorphinaGame() {
  const { gameId } = useParams();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const game = getEndorphinaGame(gameId);
  useGameFullscreen();
  useProviderBalanceSync();

  useEffect(() => {
    setReady(false);
    setProgress(3);
    const iv = setInterval(() => setProgress((p) => (p < 96 ? p + 1 : p)), 260);
    return () => clearInterval(iv);
  }, [gameId]);

  useEffect(() => {
    let alive = true;
    setUrl(''); setError('');
    base44.functions
      .invoke('endorphinaLaunchGame', { game_id: game?.code || gameId })
      .then(({ data }) => {
        if (!alive) return;
        if (data?.ok && data.url) setUrl(data.url);
        else setError(data?.reason || 'Could not start this game.');
      })
      .catch((e) => { if (alive) setError(e.message || 'Could not start this game.'); });
    return () => { alive = false; };
  }, [gameId, game?.code]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {url && ready && (
        <Link
          to="/"
          className="absolute z-20 p-1.5 rounded-full bg-black/50"
          style={{ border: '1px solid rgba(214,178,98,0.4)', top: 'calc(env(safe-area-inset-top, 0px) + 8px)', left: '8px' }}
        >
          <ArrowLeft className="w-4 h-4 text-amber-300" />
        </Link>
      )}

      <div className="flex-1 relative">
        {url && (
          <iframe
            title={game?.name || 'Endorphina'}
            src={url}
            allow="autoplay; fullscreen"
            onLoad={() => { setProgress(100); setReady(true); }}
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