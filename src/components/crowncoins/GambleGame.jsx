import React, { useState, useEffect, useRef } from 'react';
import { X, Spade, Heart, Diamond, Club } from 'lucide-react';

// Classic Risk Game — pick a card higher than the dealer's to double the pot.
// Win doubles the pot (up to 10 rounds); lose/tie forfeits it.
const SUITS = ['♠', '♥', '♦', '♣'];
const RANK_LABEL = (r) => r === 14 ? 'A' : r === 13 ? 'K' : r === 12 ? 'Q' : r === 11 ? 'J' : String(r);

function randomCard() {
  return { rank: 2 + Math.floor(Math.random() * 13), suit: SUITS[Math.floor(Math.random() * 4)] };
}
function dealFour() {
  return Array.from({ length: 4 }, () => randomCard());
}

function CardFace({ card, faceDown, highlight }) {
  const isRed = card && (card.suit === '♥' || card.suit === '♦');
  return (
    <div
      className="w-16 h-24 rounded-lg flex flex-col items-center justify-center relative"
      style={{
        border: '2px solid #d4af37',
        background: faceDown
          ? 'linear-gradient(135deg,#5a1018,#2a0608)'
          : 'linear-gradient(to bottom,#fdfdfd,#ece0c0)',
        boxShadow: highlight ? '0 0 14px rgba(255,210,80,0.9)' : '0 2px 6px rgba(0,0,0,0.5)',
      }}
    >
      {faceDown ? (
        <span className="text-2xl text-yellow-300/70" style={{ fontFamily: 'Rye, Georgia, serif' }}>♛</span>
      ) : (
        <>
          <span className="text-lg font-black" style={{ color: isRed ? '#b91c1c' : '#1a1a1a', fontFamily: 'Georgia, serif' }}>{RANK_LABEL(card.rank)}</span>
          <span className="text-2xl leading-none" style={{ color: isRed ? '#b91c1c' : '#1a1a1a' }}>{card.suit}</span>
        </>
      )}
    </div>
  );
}

export default function GambleGame({ stake, onCollect, onClose }) {
  const [pot, setPot] = useState(stake);
  const [round, setRound] = useState(1);
  const [dealer, setDealer] = useState(() => randomCard());
  const [cards, setCards] = useState(() => dealFour());
  const [phase, setPhase] = useState('pick'); // 'pick' | 'result'
  const [result, setResult] = useState(null); // 'win' | 'lose' | null
  const [picked, setPicked] = useState(-1);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(t => clearTimeout(t)), []);

  const redeal = () => {
    setDealer(randomCard());
    setCards(dealFour());
    setPicked(-1);
    setPhase('pick');
    setResult(null);
  };

  const pick = (i) => {
    if (phase !== 'pick') return;
    setPicked(i);
    setPhase('result');
    const player = cards[i];
    if (player.rank > dealer.rank) {
      setResult('win');
      const newPot = pot * 2;
      setPot(newPot);
      const t = setTimeout(() => {
        if (round >= 10) {
          onCollect(newPot);
        } else {
          setRound(r => r + 1);
          redeal();
        }
      }, 1100);
      timers.current.push(t);
    } else {
      setResult('lose');
      setPot(0);
      const t = setTimeout(() => { onCollect(0); }, 1400);
      timers.current.push(t);
    }
  };

  const take = () => {
    if (phase === 'result' && result === 'win') return; // mid-animation
    onCollect(pot);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl p-4 relative" style={{ border: '3px solid #d4af37', background: 'linear-gradient(to bottom, #2a0608, #140204)' }}>
        <button onClick={onClose} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 border border-yellow-700/50 flex items-center justify-center text-yellow-100"><X className="w-4 h-4" /></button>
        <h3 className="text-center text-lg font-black text-yellow-300 mb-1" style={{ fontFamily: 'Rye, Georgia, serif' }}>Risk Game</h3>
        <p className="text-center text-[10px] text-yellow-200/70 italic mb-3">Pick a card higher than the dealer's to double · round {round}/10</p>

        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] text-yellow-300/70 font-bold tracking-wider">DEALER</span>
            <CardFace card={dealer} highlight={phase === 'result'} />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-3">
          {cards.map((c, i) => (
            <button key={i} onClick={() => pick(i)} disabled={phase !== 'pick'} className="transition-transform hover:scale-105 disabled:opacity-90" style={{ opacity: phase === 'pick' ? 1 : (picked === i ? 1 : 0.55) }}>
              <CardFace card={c} faceDown={phase === 'pick'} highlight={picked === i && phase === 'result'} />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex flex-col">
            <span className="text-[9px] text-yellow-300/70 font-bold tracking-wider">POT</span>
            <span className={`text-xl font-black tabular-nums ${result === 'lose' ? 'text-red-400' : 'text-emerald-300'}`} style={{ fontFamily: 'Georgia, serif' }}>${pot.toFixed(2)}</span>
          </div>
          <button onClick={take} disabled={phase !== 'pick' && !(phase === 'result' && result === 'win' && round >= 10)} className="px-4 py-2 rounded-lg text-stone-950 font-black italic disabled:opacity-50" style={{ fontFamily: 'Georgia, serif', background: 'linear-gradient(to bottom,#f5d590,#e8a93a)' }}>
            Take ${pot.toFixed(2)}
          </button>
        </div>

        {result === 'win' && <p className="mt-2 text-center text-xs font-black text-emerald-300" style={{ fontFamily: 'Georgia, serif' }}>WIN! Doubling…</p>}
        {result === 'lose' && <p className="mt-2 text-center text-xs font-black text-red-400" style={{ fontFamily: 'Georgia, serif' }}>Lost the round</p>}
      </div>
    </div>
  );
}