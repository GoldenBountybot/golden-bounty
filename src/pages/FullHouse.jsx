import React, { useState } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp, RotateCcw, Share2, Check, DollarSign, Spade, Heart, Diamond, Club } from 'lucide-react';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import GameHeader from '@/components/GameHeader';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';

const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUITS = ['♠','♥','♦','♣'];
const RANK_VAL = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 };

const PAYOUTS = [
  { name: 'Royal Flush', mult: 250 },
  { name: 'Straight Flush', mult: 50 },
  { name: 'Four of a Kind', mult: 25 },
  { name: 'Full House', mult: 9 },
  { name: 'Flush', mult: 6 },
  { name: 'Straight', mult: 4 },
  { name: 'Three of a Kind', mult: 3 },
  { name: 'Two Pair', mult: 2 },
  { name: 'Jacks or Better', mult: 1 },
];

const BETS = [0.1, 1, 5, 10];
const MIN_BET = 0.05;
const W = { fontFamily: 'Rye, Georgia, serif' };

let _actx = null;
function actx() {
  if (typeof window === 'undefined') return null;
  if (!_actx) {
    try { _actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { _actx = null; }
  }
  return _actx;
}
function playDeal() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  [0, 1, 2, 3, 4].forEach((i) => {
    const s = t + i * 0.07;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle'; o.frequency.value = 1200;
    o.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(0.08, s + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, s + 0.12);
    o.start(s); o.stop(s + 0.14);
  });
}
function playHold() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'square'; o.frequency.value = 660;
  o.connect(g); g.connect(ac.destination);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  o.start(t); o.stop(t + 0.1);
}
function playWin() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  notes.forEach((f, i) => {
    const s = t + i * 0.09;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    o.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(0.13, s + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, s + 0.4);
    o.start(s); o.stop(s + 0.42);
    const o2 = ac.createOscillator();
    const g2 = ac.createGain();
    o2.type = 'sine'; o2.frequency.value = f * 2;
    o2.connect(g2); g2.connect(ac.destination);
    g2.gain.setValueAtTime(0.0001, s);
    g2.gain.exponentialRampToValueAtTime(0.05, s + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.0001, s + 0.3);
    o2.start(s); o2.stop(s + 0.32);
  });
}
function playLose() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  const notes = [440, 369.99, 293.66];
  notes.forEach((f, i) => {
    const s = t + i * 0.13;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine'; o.frequency.value = f;
    o.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(0.08, s + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, s + 0.3);
    o.start(s); o.stop(s + 0.32);
  });
}

function makeDeck() {
  const deck = [];
  for (const s of SUITS) for (const r of RANKS) deck.push({ rank: r, suit: s });
  return deck;
}
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function evaluateHand(cards) {
  const vals = cards.map(c => RANK_VAL[c.rank]).sort((a, b) => a - b);
  const suits = cards.map(c => c.suit);
  const isFlush = suits.every(s => s === suits[0]);
  const counts = {};
  vals.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const countVals = Object.values(counts).sort((a, b) => b - a);
  let isStraight = false;
  const unique = [...new Set(vals)].sort((a, b) => a - b);
  if (unique.length === 5) {
    if (unique[4] - unique[0] === 4) isStraight = true;
    if (unique[0] === 2 && unique[1] === 3 && unique[2] === 4 && unique[3] === 5 && unique[4] === 14) isStraight = true;
  }
  const isRoyal = isFlush && vals[0] === 10 && vals[1] === 11 && vals[2] === 12 && vals[3] === 13 && vals[4] === 14;
  if (isRoyal) return PAYOUTS[0];
  if (isStraight && isFlush) return PAYOUTS[1];
  if (countVals[0] === 4) return PAYOUTS[2];
  if (countVals[0] === 3 && countVals[1] === 2) return PAYOUTS[3];
  if (isFlush) return PAYOUTS[4];
  if (isStraight) return PAYOUTS[5];
  if (countVals[0] === 3) return PAYOUTS[6];
  if (countVals[0] === 2 && countVals[1] === 2) return PAYOUTS[7];
  if (countVals[0] === 2) {
    const pairRank = Number(Object.keys(counts).find(k => counts[k] === 2));
    if (pairRank >= 11) return PAYOUTS[8];
  }
  return null;
}

const woodBtn = (active) => ({
  border: '1px solid rgba(190,140,55,0.85)',
  background: active
    ? 'linear-gradient(to bottom, rgba(255,210,120,0.95), rgba(200,150,60,0.95))'
    : 'linear-gradient(to bottom, rgba(58,40,18,0.95), rgba(26,18,9,0.95))',
  boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.3), inset 0 0 0 1px rgba(46,30,12,0.6), 0 2px 5px rgba(0,0,0,0.55)',
  color: active ? '#1a1206' : 'rgba(255,220,150,0.92)',
});

function SuitIcon({ suit, className }) {
  const props = { className };
  if (suit === '♠') return <Spade {...props} />;
  if (suit === '♥') return <Heart {...props} />;
  if (suit === '♦') return <Diamond {...props} />;
  if (suit === '♣') return <Club {...props} />;
  return null;
}

export default function FullHouse() {
  const { balance, setBalance } = useCasinoBalance();
  const { rtp } = useGameSettings('fullhouse');
  const [betIdx, setBetIdx] = useState(0);
  const bet = BETS[betIdx];
  const [phase, setPhase] = useState('idle');
  const [cards, setCards] = useState([null, null, null, null, null]);
  const [held, setHeld] = useState([false, false, false, false, false]);
  const [deck, setDeck] = useState([]);
  const [result, setResult] = useState(null);
  const [lastWin, setLastWin] = useState(0);
  const [message, setMessage] = useState('Place yer bet and DEAL');
  const [copied, setCopied] = useState(false);
  const logActivity = useLogActivity();

  const share = () => {
    try { navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch {}
  };

  const deal = () => {
    if (balance < bet) { setMessage('Not enough gold, partner'); return; }
    setBalance(b => b - bet);
    const d = shuffle(makeDeck());
    const hand = d.splice(0, 5);
    setCards(hand);
    setHeld([false, false, false, false, false]);
    setDeck(d);
    setResult(null);
    setLastWin(0);
    setPhase('dealt');
    setMessage('Hold yer cards, then DRAW');
    playDeal();
  };

  const toggleHold = (i) => {
    if (phase !== 'dealt') return;
    const h = [...held]; h[i] = !h[i]; setHeld(h);
    playHold();
  };

  const draw = () => {
    const d = [...deck];
    const newCards = [...cards];
    for (let i = 0; i < 5; i++) {
      if (!held[i]) newCards[i] = d.shift();
    }

    let finalCards = newCards;
    let hand = evaluateHand(newCards);

    // RTP nudge: if losing and luck roll passes, try to create Jacks or Better
    if (!hand && Math.random() < rtp / 100) {
      for (let pass = 0; pass < 3 && !hand; pass++) {
        const candidates = newCards.map((c, i) => ({ c, i })).filter(x => !held[x.i]);
        if (!candidates.length) break;
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        const existingRanks = newCards.filter((_, i) => i !== target.i).map(c => RANK_VAL[c.rank]);
        const jPlusRanks = existingRanks.filter(v => v >= 11);
        if (jPlusRanks.length) {
          const pairRankVal = jPlusRanks[Math.floor(Math.random() * jPlusRanks.length)];
          const pairRankName = Object.keys(RANK_VAL).find(k => RANK_VAL[k] === pairRankVal);
          const used = new Set(newCards.map(c => c.rank + c.suit));
          const replacement = d.find(c => c.rank === pairRankName && !used.has(c.rank + c.suit));
          if (replacement) {
            finalCards = [...newCards];
            finalCards[target.i] = replacement;
            hand = evaluateHand(finalCards);
          }
        }
      }
    }

    setCards(finalCards);
    setDeck(d);

    if (hand) {
      const win = bet * hand.mult;
      setBalance(b => b + win);
      setLastWin(win);
      setResult(hand);
      setMessage(`${hand.name}! +$${win.toFixed(2)} (${hand.mult}x)`);
      logActivity('fullhouse', bet, win, 'win');
      playWin();
    } else {
      setMessage('No win — try again, partner');
      logActivity('fullhouse', bet, 0, 'loss');
      playLose();
    }
    setPhase('over');
  };

  const newGame = () => {
    setPhase('idle');
    setCards([null, null, null, null, null]);
    setHeld([false, false, false, false, false]);
    setResult(null);
    setLastWin(0);
    setMessage('Place yer bet and DEAL');
  };

  const isRed = (suit) => suit === '♥' || suit === '♦';

  return (
    <div className="min-h-screen text-amber-100 flex flex-col relative" style={{ background: 'linear-gradient(to bottom, #1a1108, #0d0905)', ...W }}>
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 50% 0%, rgba(120,80,30,0.18), transparent 65%)", backgroundSize: 'cover' }} />
      <GameHeader title="Full House Poker" accent="text-amber-200" border="border-amber-600/40" />

      <main className="max-w-md w-full mx-auto px-4 py-5 flex flex-col gap-4 flex-1 relative">
        {/* Balance bar */}
        <WesternFrame className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg relative" style={{ background: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/00dc49c08_generated_image.png') center / cover, radial-gradient(circle, rgba(255,210,120,0.25), rgba(120,80,30,0.4))", border: '1px solid rgba(190,140,55,0.7)' }}>
              <DollarSign className="w-5 h-5 text-amber-300 relative" />
            </span>
            <div>
              <p className="text-[10px] tracking-widest text-amber-300/70" style={W}>BALANCE</p>
              <p className="text-lg text-amber-200 tabular-nums" style={W}>${balance.toFixed(2)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-widest text-amber-300/70" style={W}>LAST WIN</p>
            <p className={`text-sm tabular-nums ${lastWin > 0 ? 'text-amber-300' : 'text-amber-100/50'}`} style={W}>
              {lastWin > 0 ? `+$${lastWin.toFixed(2)}` : '$0.00'}
            </p>
          </div>
        </WesternFrame>

        {/* Cards */}
        <WesternFrame className="p-3">
          <div className="grid grid-cols-5 gap-2">
            {cards.map((card, i) => {
              const empty = !card;
              const isHeld = held[i];
              const isWinCard = phase === 'over' && result;
              return (
                <button
                  key={i}
                  onClick={() => toggleHold(i)}
                  disabled={phase !== 'dealt'}
                  className="relative aspect-[2/3] rounded-md flex flex-col items-center justify-center transition-all duration-150 select-none"
                  style={
                    empty
                      ? { background: 'linear-gradient(to bottom, rgba(40,28,14,0.6), rgba(20,14,7,0.6))', border: '1px dashed rgba(190,140,55,0.3)' }
                      : {
                          background: 'linear-gradient(to bottom, #fdf6e3, #f0e4c8)',
                          border: `1px solid ${isHeld ? '#f5c542' : 'rgba(190,140,55,0.6)'}`,
                          boxShadow: isHeld
                            ? '0 0 10px rgba(245,197,66,0.7), inset 0 0 0 1px rgba(200,150,60,0.5)'
                            : isWinCard
                              ? '0 0 10px rgba(245,197,66,0.5), inset 0 0 0 1px rgba(200,150,60,0.3)'
                              : 'inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 3px rgba(0,0,0,0.4)',
                        }
                  }
                >
                  {isHeld && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[7px] font-black" style={{ background: 'linear-gradient(to bottom, #f5c542, #c8881e)', color: '#1a1206', ...W }}>HOLD</span>
                  )}
                  {!empty && (
                    <>
                      <span className="absolute top-1 left-1.5 text-xs font-black leading-none" style={{ color: isRed(card.suit) ? '#c0392b' : '#1a1a1a', fontFamily: 'Georgia, serif' }}>{card.rank}</span>
                      <span className="absolute top-1 right-1.5" style={{ color: isRed(card.suit) ? '#c0392b' : '#1a1a1a' }}>
                        <SuitIcon suit={card.suit} className="w-3 h-3" />
                      </span>
                      <span style={{ color: isRed(card.suit) ? '#c0392b' : '#1a1a1a' }}>
                        <SuitIcon suit={card.suit} className="w-7 h-7" />
                      </span>
                      <span className="absolute bottom-1 left-1.5 text-xs font-black leading-none rotate-180" style={{ color: isRed(card.suit) ? '#c0392b' : '#1a1a1a', fontFamily: 'Georgia, serif' }}>{card.rank}</span>
                      <span className="absolute bottom-1 right-1.5 rotate-180" style={{ color: isRed(card.suit) ? '#c0392b' : '#1a1a1a' }}>
                        <SuitIcon suit={card.suit} className="w-3 h-3" />
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </WesternFrame>

        {/* Message */}
        <WesternFrame className="py-2 text-center">
          <span className="text-xs text-amber-200" style={W}>{message}</span>
        </WesternFrame>

        {/* Bet selector (idle/over) */}
        {(phase === 'idle' || phase === 'over') && (
          <WesternFrame className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-amber-200" style={W}>BET AMOUNT</span>
              <span className="text-sm text-amber-300 tabular-nums" style={W}>${bet.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {BETS.map((b, i) => (
                <button
                  key={b}
                  onClick={() => setBetIdx(i)}
                  className="py-2 rounded-md text-xs transition-colors"
                  style={{ ...woodBtn(betIdx === i), ...W }}
                >
                  ${b}
                </button>
              ))}
            </div>
          </WesternFrame>
        )}

        {/* Action button */}
        {phase === 'idle' && (
          <button onClick={deal} disabled={balance < bet} className="w-full py-4 rounded-xl text-base transition-all flex items-center justify-center gap-2 disabled:opacity-40 relative" style={{ background: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/67ff4e03b_generated_image.png') center / cover, linear-gradient(to bottom, #f5c542, #c8881e)", border: '1px solid rgba(245,210,120,0.9)', boxShadow: 'inset 0 1px 0 rgba(255,240,180,0.5), 0 3px 10px rgba(200,136,30,0.45)', color: '#2a1a06', ...W }}>
            <DollarSign className="w-5 h-5 relative" /> <span className="relative" style={{ color: '#f5c542', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>DEAL · ${bet.toFixed(2)}</span>
          </button>
        )}
        {phase === 'dealt' && (
          <button onClick={draw} className="w-full py-4 rounded-xl text-base transition-all flex items-center justify-center gap-2 relative" style={{ background: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/67ff4e03b_generated_image.png') center / cover, linear-gradient(to bottom, #f5c542, #c8881e)", border: '1px solid rgba(245,210,120,0.9)', boxShadow: 'inset 0 1px 0 rgba(255,240,180,0.5), 0 3px 10px rgba(200,136,30,0.45)', color: '#2a1a06', ...W }}>
            <span className="relative" style={{ color: '#f5c542', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>DRAW CARDS</span>
          </button>
        )}
        {phase === 'over' && (
          <button onClick={newGame} className="w-full py-4 rounded-xl text-base transition-all flex items-center justify-center gap-2" style={{ ...woodBtn(true), ...W }}>
            <RotateCcw className="w-5 h-5" /> NEW HAND
          </button>
        )}

        {/* Payout table */}
        <WesternFrame className="p-3">
          <p className="text-[10px] tracking-widest text-amber-300/70 text-center mb-2" style={W}>PAYOUT TABLE · {bet.toFixed(2)} BET</p>
          <div className="grid grid-cols-3 gap-1.5">
            {PAYOUTS.map((p) => (
              <div
                key={p.name}
                className="rounded-md py-1.5 px-1 text-center"
                style={{
                  border: `1px solid ${result && result.name === p.name ? '#f5c542' : 'rgba(190,140,55,0.4)'}`,
                  background: result && result.name === p.name ? 'rgba(245,197,66,0.18)' : 'rgba(20,13,6,0.6)',
                  boxShadow: result && result.name === p.name ? '0 0 8px rgba(245,197,66,0.5)' : 'none',
                }}
              >
                <p className="text-[8px] text-amber-200/80 leading-tight" style={W}>{p.name}</p>
                <p className="text-xs text-amber-300 tabular-nums" style={W}>{p.mult}x</p>
                <p className="text-[8px] text-amber-100/50 tabular-nums">${(bet * p.mult).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </WesternFrame>

        {/* Share */}
        <button onClick={share} className="w-full py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 mb-6" style={{ ...woodBtn(false), ...W }}>
          {copied ? <Check className="w-4 h-4" style={{ color: '#f5c542' }} /> : <Share2 className="w-4 h-4" />}
          <span>{copied ? 'Link Copied!' : 'Share Game'}</span>
        </button>
      </main>
    </div>
  );
}