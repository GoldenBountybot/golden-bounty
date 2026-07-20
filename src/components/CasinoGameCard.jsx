import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Play, Share2, Check } from 'lucide-react';

export default function CasinoGameCard({ game }) {
  const [copied, setCopied] = useState(false);

  const share = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/games/${game.id}`;
    try {
      navigator.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  const inner = (
    <div className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-amber-700/40 shadow-lg shadow-black/40 transition-transform hover:-translate-y-1 hover:shadow-amber-900/40">
      {game.image ? (
        <img src={game.image} alt={game.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${game.accent}`} />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {game.tag && (
        <span className="absolute top-1 left-1 px-1 py-px rounded bg-yellow-300 text-stone-900 text-[6px] font-black tracking-wider shadow" style={{ fontFamily: 'Georgia, serif' }}>
          {game.tag}
        </span>
      )}

      {!game.coming && (
        <button
          onClick={share}
          title="Share game link"
          className="absolute top-0.5 right-0.5 z-10 flex items-center justify-center w-[10px] h-[10px] rounded-full bg-black/50 border border-amber-600/40 text-amber-200/90 hover:bg-black/70 transition-colors"
        >
          {copied ? <Check className="w-[5px] h-[5px] text-emerald-300" /> : <Share2 className="w-[5px] h-[5px]" />}
        </button>
      )}

      <div className="absolute bottom-0 inset-x-0 p-1.5">
        <h3 className="text-white font-black italic text-[10px] leading-tight drop-shadow" style={{ fontFamily: 'Georgia, serif' }}>
          {game.title}
        </h3>
        <p className="text-[7px] text-amber-100/80 mt-0.5">{game.desc}</p>
      </div>

      {game.coming ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/45 backdrop-blur-[1px]">
          <Lock className="w-4 h-4 text-amber-200/80" />
          <span className="text-[7px] font-bold italic text-amber-100/90 tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>COMING SOON</span>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/35">
          <span className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-amber-400 text-stone-900 text-[9px] font-black italic shadow-lg" style={{ fontFamily: 'Georgia, serif' }}>
            <Play className="w-2.5 h-2.5" /> PLAY
          </span>
        </div>
      )}
    </div>
  );

  if (game.coming) {
    return <div className="cursor-default select-none">{inner}</div>;
  }
  return <Link to={`/games/${game.id}`}>{inner}</Link>;
}