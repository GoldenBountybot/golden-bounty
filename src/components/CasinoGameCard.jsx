import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Play } from 'lucide-react';
import { preloadAssets, isCached } from '@/lib/assetPreloader';
import { GAME_ASSET_MAP } from '@/lib/gameAssets';
import FadeImage from '@/components/FadeImage';

// Minimal Play-Store style game tile — sharp golden frame, clean image.
function CasinoGameCard({ game }) {
  const path = game.path || `/games/${game.id}`;

  // Start preloading this game's assets the moment the player hovers or
  // touches the card, so most images are already cached by the time the
  // loading screen appears — making the wait much shorter.
  const warm = () => {
    const assets = GAME_ASSET_MAP[game.id];
    if (assets && !isCached(assets[0])) preloadAssets(assets);
  };

  const inner = (
    <div
      className="group relative aspect-[3/4] overflow-hidden rounded-[7px] bg-stone-900 transition-transform hover:-translate-y-0.5"
      style={{
        border: '1px solid rgba(214,178,98,0.42)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        // Skip painting tiles that are off-screen while scrolling.
        contentVisibility: 'auto',
        containIntrinsicSize: '180px',
      }}
    >
      {game.image && game.provider ? (
        // Provider (PG SOFT / JILI) covers are square icons — show the whole
        // artwork uncropped on top of a blurred copy of itself, so nothing is
        // cut off and the tile still fills edge to edge.
        <>
          <div
            className="absolute inset-0 scale-125"
            style={{ backgroundImage: `url(${game.image})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(14px) brightness(0.55) saturate(1.3)' }}
          />
          <FadeImage src={game.image} alt={game.title} className="absolute inset-x-0 top-0 w-full h-[76%] object-contain object-top" durationMs={350} loading="lazy" decoding="async" style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))' }} />
        </>
      ) : game.image ? (
        <FadeImage src={game.image} alt={game.title} className="absolute inset-0 w-full h-full object-cover" durationMs={350} loading="lazy" decoding="async" />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${game.accent}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {game.tag && (
        <span
          className="absolute top-1 left-1 px-1 py-px rounded-[3px] text-[6px] font-black tracking-wider"
          style={{ background: 'linear-gradient(to bottom,#f5c542,#c8881e)', color: '#2a1a06', fontFamily: 'Georgia, serif' }}
        >
          {game.tag}
        </span>
      )}

      <div className="absolute bottom-0 inset-x-0 p-2">
        <h3 className="text-white font-black italic text-xs leading-tight drop-shadow" style={{ fontFamily: 'Georgia, serif' }}>
          {game.title}
        </h3>
        <p className="text-[9px] text-amber-100/75 mt-0.5">{game.desc}</p>
      </div>

      {game.coming ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/55">
          <Lock className="w-4 h-4 text-amber-200/80" />
          <span className="text-[7px] font-bold italic text-amber-100/90 tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>COMING SOON</span>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <span className="flex items-center gap-0.5 px-2 py-1 rounded-[5px] text-[9px] font-black italic" style={{ background: 'linear-gradient(to bottom,#f5c542,#c8881e)', color: '#2a1a06', fontFamily: 'Georgia, serif' }}>
            <Play className="w-2.5 h-2.5" /> PLAY
          </span>
        </div>
      )}
    </div>
  );

  if (game.coming) {
    return <div className="cursor-default select-none">{inner}</div>;
  }
  return <Link to={path} onMouseEnter={warm} onTouchStart={warm}>{inner}</Link>;
}

export default React.memo(CasinoGameCard);