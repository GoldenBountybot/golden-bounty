import React, { useState } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { SYMBOLS, MULTIPLIERS } from './symbols';

// Symbol images (mirrored from SymbolTile so the paytable shows the real art)
const IMG = {
  bandit:   'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/47b80dfa7_file_00000000ed3081fa8b2b38b3213ec99a.png',
  revolver: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/1d7f9ad2f_file_00000000936c81fa8c6b61333fddd167.png',
  whiskey:  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/d20ec7196_file_0000000029f08207838de49974589b4b.png',
  hat:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c71ef50cc_file_000000003d0c8211b8397d0e8ffb44b1.png',
  scatter:  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/00ba69c97_file_0000000019208211ab3b4e56cdb92344.png',
  wild:     'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c970620bf_file_0000000037f88207a4992e01551e3e21.png',
  A: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/0fd153331_file_0000000005e881faa113be069715c687.png',
  K: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/82aafe905_file_000000003f80820786167aa236a07df2.png',
  Q: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/fea6fbacb_file_0000000071cc81faa25eed7055b02650.png',
  J: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/8257788f9_file_0000000090808211a1f59f4ce81dde17.png',
};

const CARD_STYLE = {
  A: { bg: 'linear-gradient(to bottom, #ca8a04, #92400e)', text: '#fef9c3' },
  K: { bg: 'linear-gradient(to bottom, #dc2626, #7f1d1d)', text: '#fee2e2' },
  Q: { bg: 'linear-gradient(to bottom, #16a34a, #14532d)', text: '#dcfce7' },
  J: { bg: 'linear-gradient(to bottom, #2563eb, #1e3a8a)', text: '#dbeafe' },
};

const BG = '#26252d';
const YELLOW = '#fcc419';
const WHITE = '#e0e0e0';

// Order: Wild, Scatter, then high→low payouts (matches reference image)
const ORDER = ['wild', 'scatter', 'bandit', 'revolver', 'whiskey', 'hat', 'A', 'K', 'Q', 'J'];
const LABELS = {
  wild: 'WILD', scatter: 'SCATTER', bandit: 'COWBOY', revolver: 'REVOLVER',
  whiskey: 'WHISKEY', hat: 'HAT', A: 'A', K: 'K', Q: 'Q', J: 'J',
};

function SymbolIcon({ id, size = 44 }) {
  const isCard = ['A', 'K', 'Q', 'J'].includes(id);
  if (IMG[id]) {
    return (
      <img
        src={IMG[id]}
        alt={LABELS[id]}
        className="object-contain"
        style={{ width: size, height: size, transform: 'scale(1.15)' }}
        draggable={false}
      />
    );
  }
  if (isCard) {
    const c = CARD_STYLE[id];
    return (
      <div
        className="flex items-center justify-center rounded"
        style={{ width: size, height: size, background: c.bg }}
      >
        <span className="font-black italic" style={{ color: c.text, fontFamily: 'Rye, Georgia, serif', fontSize: size * 0.5 }}>
          {id}
        </span>
      </div>
    );
  }
  return null;
}

function PayRow({ id }) {
  const sym = SYMBOLS[id];
  const pay = sym.pay;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5">
      <div className="flex items-center justify-center rounded-md overflow-hidden shrink-0" style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.04)' }}>
        <SymbolIcon id={id} size={44} />
      </div>
      <div className="flex-1 grid grid-cols-4 gap-1 text-center">
        {[6, 5, 4, 3].map((n) => (
          <div key={n} className="flex flex-col items-center">
            <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>{n}</span>
            <span className="text-sm font-black tabular-nums" style={{ color: YELLOW }}>{pay[n] || '-'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bullet({ children }) {
  return (
    <li className="flex gap-2 items-start py-1.5">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: YELLOW }} />
      <span className="text-[13px] leading-relaxed" style={{ color: WHITE }}>{children}</span>
    </li>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-center font-black text-base mt-5 mb-2 tracking-wide" style={{ color: '#ffffff' }}>
      {children}
    </h3>
  );
}

export default function WildBountyPaytable({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex flex-col" style={{ background: BG }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <ChevronLeft className="w-5 h-5" style={{ color: '#ffffff' }} strokeWidth={2.4} />
        </button>
        <h2 className="font-black text-lg tracking-wide" style={{ color: YELLOW, fontFamily: 'Rye, Georgia, serif' }}>Paytable</h2>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <X className="w-5 h-5" style={{ color: '#ffffff' }} strokeWidth={2.4} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-10">
        {/* Symbol Payout Values */}
        <SectionTitle>Symbol Payout Values</SectionTitle>
        <div className="grid grid-cols-4 gap-1 text-center mb-1">
          {['6', '5', '4', '3'].map((n) => (
            <span key={n} className="text-[10px] font-bold tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>SYMBOLS</span>
          ))}
        </div>
        <div className="rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
          {ORDER.map((id) => <PayRow key={id} id={id} />)}
        </div>

        <ul className="mt-3">
          <Bullet>Wild symbol substitutes for all symbols except Scatter symbol.</Bullet>
          <Bullet>Gold Framed symbols appears on reels 3 and 4 only.</Bullet>
        </ul>

        {/* Gold Frame Mechanic */}
        <SectionTitle>Gold Frame Mechanic</SectionTitle>
        <ul>
          <Bullet>During any spin, some symbols (excluding Wild symbol and Scatter symbol) in reels 3 and/or 4 may appear as gold framed symbols.</Bullet>
          <Bullet>At every new round after the new symbols have cascaded down, any gold framed symbol(s) that is involved in a win in the previous round will be transformed into Wild symbol(s).</Bullet>
        </ul>

        {/* Multiplier */}
        <SectionTitle>Multiplier</SectionTitle>
        <div className="flex items-center justify-center gap-2 py-3 flex-wrap">
          {MULTIPLIERS.map((m, i) => (
            <span
              key={m}
              className="px-2.5 py-1 rounded font-black text-sm"
              style={{
                background: i === 0 ? `linear-gradient(145deg, #d4a017, #8b6914)` : 'rgba(255,255,255,0.06)',
                color: i === 0 ? '#1a1206' : YELLOW,
                border: `1px solid ${i === 0 ? 'rgba(255,235,150,0.8)' : 'rgba(252,196,25,0.3)'}`,
              }}
            >
              ×{m}
            </span>
          ))}
        </div>
        <ul>
          <Bullet>At the start of any main game spin, the win multiplier is ×1.</Bullet>
          <Bullet>During any spin, if there are one or more winning symbols on the reels, after wins are paid and the new symbols have cascaded down, the win multiplier will be doubled.</Bullet>
          <Bullet>The maximum win multiplier is ×1,024.</Bullet>
        </ul>

        {/* Free Spins Feature */}
        <SectionTitle>Free Spins Feature</SectionTitle>
        <div className="flex items-center justify-center gap-3 py-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-md overflow-hidden" style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.04)' }}>
              <SymbolIcon id="scatter" size={48} />
            </div>
          ))}
        </div>
        <ul>
          <Bullet>3 Scatter symbols appearing anywhere will trigger the Free Spins Feature with 10 free spins. Each additional Scatter symbol will trigger 2 more free spins.</Bullet>
          <Bullet>At the start of every free spin, the win multiplier is ×8.</Bullet>
          <Bullet>During any free spin, if there are one or more winning symbols on the reels, after wins are paid and the new symbols have cascaded down, the win multiplier will be doubled.</Bullet>
          <Bullet>Free spins can be retriggered.</Bullet>
        </ul>

        {/* Maximum Win */}
        <SectionTitle>Maximum Win</SectionTitle>
        <ul>
          <Bullet>The maximum win amount is 5,000× of the bet amount.</Bullet>
        </ul>

        {/* Feature Buy */}
        <SectionTitle>Feature Buy</SectionTitle>
        <ul>
          <Bullet>Tap on Feature Buy button to open the Feature Buy menu.</Bullet>
          <Bullet>Tap on Start button to buy the Free Spins Feature at the price displayed in the Feature Buy menu.</Bullet>
        </ul>

        {/* 3,600 Ways */}
        <SectionTitle>3,600 Ways</SectionTitle>
        <ul>
          <Bullet>Bet ways win if the winning symbols are in succession from the leftmost reel to the right.</Bullet>
          <Bullet>Total number of winning bet ways for each symbol are calculated by multiplying the number of adjacent winning symbols on each reel from the leftmost reel to the right.</Bullet>
          <Bullet>From the above example: 2 × 2 × 2 = 8 winning ways.</Bullet>
          <Bullet>The winning symbol payout is multiplied by the number of winning bet ways.</Bullet>
          <Bullet>After the payout of every round is made, all winning symbols will explode allowing the symbols above them to cascade down for a new round.</Bullet>
          <Bullet>Additional winning combination will be tallied in every round until no more winning combination can be tallied.</Bullet>
          <Bullet>All wins shown in cash.</Bullet>
        </ul>
      </div>
    </div>
  );
}