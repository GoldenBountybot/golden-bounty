import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import WesternFrame from '@/components/wildbounty/WesternFrame';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const STORAGE = 'hl_balance';
const START_BAL = 5000;
const BETS = [25, 50, 100, 250, 500];

function drawCard() {
  return { rank: Math.floor(Math.random() * 13), suit: Math.floor(Math.random() * 4) };
}

function CardFace({ card, hidden }) {
  const isRed = card && (card.suit === 1 || card.suit === 2);
  return (
    <div
      className="w-28 h-40 rounded-xl border-2 flex flex-col justify-between p-2 shadow-xl"
      style={{
        background: hidden ? 'linear-gradient(135deg,#7a4f17,#3a2810)' : '#fffdf7',
        borderColor: hidden ? '#b8862a' : '#d4b06a',
        fontFamily: 'Georgia, serif',
      }}
    >
      {hidden ? (
        <div className="w-full h-full rounded-lg flex items-center justify-center text-amber-300/80 text-3xl">★</div>
      ) : (
        <>
          <div className={`text-left leading-none text-2xl font-black ${isRed ? 'text-red-600' : 'text-stone-900'}`}>
            <div>{RANKS[card.rank]}</div>
            <div className="text-xl">{SUITS[card.suit]}</div>
          </div>
          <div className={`text-center text-5xl ${isRed ? 'text-red-600' : 'text-stone-900'}`}>{SUITS[card.suit]}</div>
          <div className={`text-right leading-none text-2xl font-black rotate-180 ${isRed ? 'text-red-600' : 'text-stone-900'}`}>
            <div>{RANKS[card.rank]}</div>
            <div className="text-xl">{SUITS[card.suit]}</div>
          </div>
        </>
      )}
    </div>
  );
}

export default function HiLo() {
  const [balance, setBalance] = useState(() => parseFloat(localStorage.getItem(STORAGE) || String(START_BAL)));
  const [betIdx, setBetIdx] = useState(1);
  const [current, setCurrent] = useState(null);
  const [revealed, setRevealed] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | guessing | result
  const [pot, setPot] = useState(0);
  const [message, setMessage] = useState('Deal a card to start!');
  const [streak, setStreak] = useState(0);

  const bet = BETS[betIdx];
  useEffect(() => localStorage.setItem(STORAGE, String(balance)), [balance]);

  const deal = () => {
    if (phase === 'guessing') return;
    if (balance < bet) { setMessage('Insufficient balance! Reset below.'); return; }
    setBalance(b => b - bet);
    setPot(bet);
    setCurrent(drawCard());
    setRevealed(null);
    setStreak(0);
    setPhase('guessing');
    setMessage(`Will the next card be Higher or Lower than ${RANKS[current?.rank ?? 0]}?`);
    setMessage('Guess: Higher or Lower?');
  };

  const guess = (dir) => {
    if (phase !== 'guessing') return;
    const next = drawCard();
    setRevealed(next);
    const same = next.rank === current.rank;
    const correct = dir === 'high' ? next.rank > current.rank : next.rank < current.rank;
    if (same) {
      setPhase('result');
      setMessage(`Same rank — push lost! Card was ${RANKS[next.rank]}.`);
      setPot(0);
    } else if (correct) {
      const newPot = pot * 2;
      setPot(newPot);
      setStreak(s => s + 1);
      setMessage(`Correct! Pot is now $${newPot.toFixed(2)}. Continue or Collect.`);
      // prepare next round with revealed as new current after short delay
      setTimeout(() => {
        setCurrent(next);
        setRevealed(null);
      }, 1100);
    } else {
      setPhase('result');
      setMessage(`Wrong! The card was ${RANKS[next.rank]}. You lost the pot.`);
      setPot(0);
    }
  };

  const collect = () => {
    if (phase !== 'guessing' || pot === 0) return;
    setBalance(b => b + pot);
    setMessage(`Collected $${pot.toFixed(2)}!`);
    setPot(0);
    setPhase('idle');
    setCurrent(null);
    setRevealed(null);
    setStreak(0);
  };

  const reset = () => { setBalance(START_BAL); setPhase('idle'); setCurrent(null); setRevealed(null); setPot(0); setStreak(0); setMessage('Balance reset'); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-green-950 to-stone-950">
      <header className="sticky top-0 z-20 bg-stone-950/90 backdrop-blur-xl border-b border-emerald-600/30">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-stone-300 hover:text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm italic tracking-wide">Lobby</span>
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-base font-black italic text-emerald-200" style={{ fontFamily: 'Georgia, serif' }}>High or Low</h1>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 flex flex-col items-center gap-5">
        {/* Felt table */}
        <WesternFrame className="w-full py-6 flex flex-col items-center gap-3" >
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-amber-300/70 tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif' }}>Current</span>
              <CardFace card={current} hidden={!current} />
            </div>
            <span className="text-2xl text-amber-400/70 italic" style={{ fontFamily: 'Georgia, serif' }}>→</span>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-amber-300/70 tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif' }}>Next</span>
              <CardFace card={revealed} hidden={!revealed} />
            </div>
          </div>
        </WesternFrame>

        <WesternFrame glow className="w-full text-center py-2">
          <span className="font-black italic text-base text-amber-300 px-2" style={{ fontFamily: 'Georgia, serif' }}>{message}</span>
        </WesternFrame>

        <div className="grid grid-cols-3 gap-2 w-full">
          <WesternFrame className="flex flex-col items-center py-2">
            <span className="text-[9px] text-amber-300/70 tracking-widest uppercase">Balance</span>
            <span className="text-sm font-bold italic text-yellow-100 tabular-nums">${balance.toFixed(2)}</span>
          </WesternFrame>
          <WesternFrame className="flex flex-col items-center py-2">
            <span className="text-[9px] text-amber-300/70 tracking-widest uppercase">Pot</span>
            <span className="text-sm font-bold italic text-yellow-100 tabular-nums">${pot.toFixed(2)}</span>
          </WesternFrame>
          <WesternFrame className="flex flex-col items-center py-2">
            <span className="text-[9px] text-amber-300/70 tracking-widest uppercase">Streak</span>
            <span className="text-sm font-bold italic text-yellow-100 tabular-nums">{streak}x</span>
          </WesternFrame>
        </div>

        {/* Bet selector (only when idle) */}
        {phase === 'idle' && (
          <div className="flex gap-2 flex-wrap justify-center">
            {BETS.map((b, i) => (
              <button
                key={b}
                onClick={() => setBetIdx(i)}
                className={`px-3 py-1.5 rounded-md text-sm font-bold italic border transition-colors ${betIdx === i ? 'bg-amber-400 text-stone-900 border-amber-300' : 'bg-black/30 text-amber-100/80 border-amber-700/40 hover:bg-black/50'}`}
                style={{ fontFamily: 'Georgia, serif' }}
              >
                ${b}
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        {phase === 'idle' && (
          <button
            onClick={deal}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-700 text-white text-lg font-black italic shadow-lg hover:from-emerald-400 hover:to-green-600 transition-colors"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            DEAL · ${bet}
          </button>
        )}

        {phase === 'guessing' && (
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={() => guess('high')}
              className="py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 text-lg font-black italic shadow-lg hover:from-amber-400 hover:to-orange-500 transition-colors flex items-center justify-center gap-2"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              <ArrowUp className="w-5 h-5" /> HIGHER
            </button>
            <button
              onClick={() => guess('low')}
              className="py-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-700 text-white text-lg font-black italic shadow-lg hover:from-sky-400 hover:to-blue-600 transition-colors flex items-center justify-center gap-2"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              <ArrowDown className="w-5 h-5" /> LOWER
            </button>
            <button
              onClick={collect}
              className="col-span-2 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-600 text-stone-950 text-base font-black italic shadow-lg hover:from-yellow-300 hover:to-amber-500 transition-colors flex items-center justify-center gap-2"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              <RotateCcw className="w-4 h-4" /> COLLECT ${pot.toFixed(2)}
            </button>
          </div>
        )}

        {phase === 'result' && (
          <button
            onClick={() => { setPhase('idle'); setCurrent(null); setRevealed(null); setMessage('Deal a card to start!'); }}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-700 text-white text-lg font-black italic shadow-lg hover:from-emerald-400 hover:to-green-600 transition-colors"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            NEW HAND
          </button>
        )}

        <button onClick={reset} className="text-[10px] italic text-amber-600/80 hover:text-amber-300 tracking-[0.2em] uppercase" style={{ fontFamily: 'Georgia, serif' }}>
          Reset Balance
        </button>
      </main>
    </div>
  );
}