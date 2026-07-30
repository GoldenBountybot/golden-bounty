import React from 'react';
import { Star } from 'lucide-react';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Deep emerald luxury playing card with metallic gold bevel frame,
// ornamental gold corners, and a 3D gold star emblem on the back.
export default function LuxuryCard({ card, hidden }) {
  const isRed = card && (card.suit === 1 || card.suit === 2);
  return (
    <div
      className="relative rounded-2xl"
      style={{
        width: 116,
        height: 168,
        background: 'linear-gradient(160deg, #0B301E 0%, #072014 55%, #05140C 100%)',
        boxShadow:
          '0 10px 22px rgba(0,0,0,0.65), 0 0 0 1px #1a0f08, 0 0 0 3px #D4A72C, 0 0 0 4px #3a2a10, 0 0 0 5px #F6C94A, 0 0 18px rgba(246,201,74,0.28)',
      }}
    >
      {/* subtle diamond ornamental pattern */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          opacity: 0.14,
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(246,201,74,0.5) 0 1px, transparent 1px 12px), repeating-linear-gradient(-45deg, rgba(246,201,74,0.5) 0 1px, transparent 1px 12px)',
        }}
      />

      {/* ornamental gold corners */}
      {[
        { top: 5, left: 5, rot: 0 },
        { top: 5, right: 5, rot: 90 },
        { bottom: 5, right: 5, rot: 180 },
        { bottom: 5, left: 5, rot: 270 },
      ].map((c, i) => (
        <span
          key={i}
          className="absolute pointer-events-none"
          style={{
            ...c,
            width: 14,
            height: 14,
            transform: `rotate(${c.rot}deg)`,
            borderTop: '1.5px solid #F6C94A',
            borderLeft: '1.5px solid #F6C94A',
            boxShadow: '0 0 4px rgba(246,201,74,0.6)',
          }}
        />
      ))}

      {hidden || !card ? (
        // 3D metallic gold star emblem
        <div className="absolute inset-0 flex items-center justify-center">
          <Star
            className="relative"
            style={{
              width: 58,
              height: 58,
              fill: 'url(#hiloGoldStar)',
              stroke: '#FFE08A',
              strokeWidth: 1,
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6)) drop-shadow(0 0 10px rgba(246,201,74,0.85))',
            }}
          />
          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="hiloGoldStar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFE08A" />
                <stop offset="45%" stopColor="#F6C94A" />
                <stop offset="100%" stopColor="#9C7016" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ) : (
        // revealed face — gold/ivory rank + suit on emerald
        <>
          <div
            className="absolute leading-none font-black"
            style={{ top: 10, left: 12, fontFamily: "'Cinzel', Georgia, serif", fontSize: 20, color: isRed ? '#FFB37A' : '#FFE08A', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
          >
            <div>{RANKS[card.rank]}</div>
            <div style={{ fontSize: 16, marginTop: -2 }}>{SUITS[card.suit]}</div>
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ fontSize: 52, color: isRed ? '#FFB37A' : '#FFE08A', textShadow: '0 2px 6px rgba(0,0,0,0.6), 0 0 14px rgba(246,201,74,0.4)' }}
          >
            {SUITS[card.suit]}
          </div>
          <div
            className="absolute leading-none font-black"
            style={{ bottom: 10, right: 12, transform: 'rotate(180deg)', fontFamily: "'Cinzel', Georgia, serif", fontSize: 20, color: isRed ? '#FFB37A' : '#FFE08A', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
          >
            <div>{RANKS[card.rank]}</div>
            <div style={{ fontSize: 16, marginTop: -2 }}>{SUITS[card.suit]}</div>
          </div>
        </>
      )}
    </div>
  );
}