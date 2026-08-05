import React, { useState } from 'react';
import { ArrowUp, ArrowDown, RotateCcw, Minus, Plus, Wallet, CircleDollarSign, Trophy, Volume2, VolumeX } from 'lucide-react';
import BackButton from '@/components/BackButton';
import GameTitleBar from '@/components/GameTitleBar';
import GameAssetLoader from '@/components/GameAssetLoader';
import { HILO_ASSETS, GAME_BG } from '@/lib/gameAssets';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import { incBet, decBet } from '@/lib/betStepper';
import { useMute } from '@/lib/soundMute';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SERIF = "'Cinzel', Georgia, serif";

const GOLD = '#D4A72C';
const GOLD_BRIGHT = '#F6C94A';
const GOLD_HIGHLIGHT = '#FFE08A';
const CREAM = '#FFF1C7';
const CARD_GREEN = '#0B301E';
const DEEP_BLACK = '#050806';
const EMERALD = '#087A43';
const EMERALD_BRIGHT = '#12A85E';

function drawCard() {
  return { rank: Math.floor(Math.random() * 13), suit: Math.floor(Math.random() * 4) };
}

// Bias the next card so the guess is correct with probability ~rtp.
function pickCard(dir, curRank, wantCorrect) {
  const ranks = RANKS.map((_, i) => i);
  let cand;
  if (wantCorrect) {
    cand = dir === 'high' ? ranks.filter(r => r > curRank) : ranks.filter(r => r < curRank);
    if (cand.length === 0) return drawCard();
  } else {
    cand = dir === 'high' ? ranks.filter(r => r < curRank) : ranks.filter(r => r > curRank);
    if (cand.length === 0) cand = [curRank]; // force a tie (push counts as a loss)
  }
  return { rank: cand[Math.floor(Math.random() * cand.length)], suit: Math.floor(Math.random() * 4) };
}

// Premium card back — deep emerald with ornate gold frame + 3D gold star emblem
function CardBack() {
  return (
    <div className="relative w-28 h-40 rounded-xl" style={{
      background: `linear-gradient(135deg, ${CARD_GREEN} 0%, #061a10 100%)`,
      border: `2px solid ${GOLD}`,
      boxShadow: `0 0 0 1px ${DEEP_BLACK}, 0 0 0 3px ${GOLD_BRIGHT}, 0 6px 16px rgba(0,0,0,0.7), 0 0 18px rgba(212,167,44,0.25)`,
    }}>
      {/* inner gold line */}
      <div className="absolute inset-1 rounded-lg" style={{ border: `1px solid rgba(246,201,74,0.5)` }} />
      {/* diamond ornamental pattern */}
      <div className="absolute inset-2 rounded-lg" style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, transparent, transparent 7px, rgba(212,167,44,0.16) 7px, rgba(212,167,44,0.16) 8px),' +
          'repeating-linear-gradient(-45deg, transparent, transparent 7px, rgba(212,167,44,0.16) 7px, rgba(212,167,44,0.16) 8px)',
      }} />
      {/* ornamental corners */}
      {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
        <div key={i} className={`absolute ${pos}`} style={{
          width: 18, height: 18,
          borderTop: pos.includes('top') ? `2px solid ${GOLD_BRIGHT}` : 'none',
          borderBottom: pos.includes('bottom') ? `2px solid ${GOLD_BRIGHT}` : 'none',
          borderLeft: pos.includes('left') ? `2px solid ${GOLD_BRIGHT}` : 'none',
          borderRight: pos.includes('right') ? `2px solid ${GOLD_BRIGHT}` : 'none',
          margin: 5, borderRadius: 4,
        }} />
      ))}
      {/* center 3D gold star emblem */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{
          fontSize: 54,
          color: GOLD_BRIGHT,
          textShadow: `0 0 10px rgba(246,201,74,0.9), 0 0 22px rgba(212,167,44,0.6), 0 2px 4px rgba(0,0,0,0.6)`,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
        }}>★</span>
      </div>
    </div>
  );
}

// Revealed card face — keeps the original white card style with gold frame
function CardFace({ card }) {
  const isRed = card && (card.suit === 1 || card.suit === 2);
  return (
    <div className="w-28 h-40 rounded-xl flex flex-col justify-between p-2" style={{
      background: '#fffdf7',
      border: `2px solid ${GOLD}`,
      boxShadow: `0 0 0 1px ${DEEP_BLACK}, 0 0 0 3px ${GOLD_BRIGHT}, 0 6px 16px rgba(0,0,0,0.7), 0 0 18px rgba(212,167,44,0.25)`,
      fontFamily: 'Georgia, serif',
    }}>
      <div className={`text-left leading-none text-2xl font-black ${isRed ? 'text-red-600' : 'text-stone-900'}`}>
        <div>{RANKS[card.rank]}</div>
        <div className="text-xl">{SUITS[card.suit]}</div>
      </div>
      <div className={`text-center text-5xl ${isRed ? 'text-red-600' : 'text-stone-900'}`}>{SUITS[card.suit]}</div>
      <div className={`text-right leading-none text-2xl font-black rotate-180 ${isRed ? 'text-red-600' : 'text-stone-900'}`}>
        <div>{RANKS[card.rank]}</div>
        <div className="text-xl">{SUITS[card.suit]}</div>
      </div>
    </div>
  );
}

function CardSlot({ card, label }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] tracking-[0.25em] uppercase font-semibold" style={{ color: GOLD, fontFamily: SERIF }}>{label}</span>
      {card ? <CardFace card={card} /> : <CardBack />}
    </div>
  );
}

function StatBox({ label, value, icon }) {
  return (
    <div className="flex flex-col items-center py-2.5 px-1 rounded-lg" style={{
      background: `linear-gradient(160deg, #071D14, ${DEEP_BLACK})`,
      border: `1px solid ${GOLD}`,
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6), 0 0 10px rgba(212,167,44,0.15)',
    }}>
      <div className="flex items-center gap-1 mb-0.5" style={{ color: GOLD }}>
        {icon}
        <span className="text-[9px] tracking-[0.2em] uppercase font-semibold" style={{ fontFamily: SERIF }}>{label}</span>
      </div>
      <span className="text-sm font-bold tabular-nums" style={{ color: CREAM, fontFamily: SERIF }}>{value}</span>
    </div>
  );
}

const goldBtn = {
  background: `linear-gradient(to bottom, ${CARD_GREEN}, ${DEEP_BLACK})`,
  border: `1px solid ${GOLD}`,
  color: GOLD_BRIGHT,
  boxShadow: 'inset 0 1px 0 rgba(246,201,74,0.2), 0 2px 6px rgba(0,0,0,0.4)',
};

const dealBtn = {
  background: `linear-gradient(to bottom, ${EMERALD_BRIGHT}, ${EMERALD})`,
  border: `2px solid ${GOLD_BRIGHT}`,
  color: CREAM,
  fontFamily: SERIF,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.3), 0 4px 14px rgba(8,122,67,0.5), 0 0 18px rgba(246,201,74,0.3)',
};

export default function HiLo() {
  const { balance, setBalance } = useCasinoBalance();
  const [muted, toggleMute] = useMute();
  const [loaded, setLoaded] = useState(false);
  const { rtp } = useGameSettings('hi-lo');
  const [bet, setBet] = useState(0.10);
  const [current, setCurrent] = useState(null);
  const [revealed, setRevealed] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | guessing | result
  const [pot, setPot] = useState(0);
  const [message, setMessage] = useState('Deal a card to start!');
  const [streak, setStreak] = useState(0);
  const logActivity = useLogActivity();

  const deal = () => {
    if (phase === 'guessing') return;
    if (balance < bet) { setMessage('Insufficient balance! Reset below.'); return; }
    setBalance(b => b - bet);
    setPot(bet);
    setCurrent(drawCard());
    setRevealed(null);
    setStreak(0);
    setPhase('guessing');
    setMessage('Guess: Higher or Lower?');
  };

  const guess = (dir) => {
    if (phase !== 'guessing') return;
    const wantCorrect = Math.random() < (rtp / 100) * 0.5;
    const next = pickCard(dir, current.rank, wantCorrect);
    setRevealed(next);
    const same = next.rank === current.rank;
    const correct = dir === 'high' ? next.rank > current.rank : next.rank < current.rank;
    if (same) {
      setPhase('result');
      setMessage(`Same rank — push lost! Card was ${RANKS[next.rank]}.`);
      setPot(0);
      logActivity('hi-lo', bet, 0, 'loss');
    } else if (correct) {
      const newPot = pot * 2;
      setPot(newPot);
      setStreak(s => s + 1);
      setMessage(`Correct! Pot is now $${newPot.toFixed(2)}. Continue or Collect.`);
      setTimeout(() => {
        setCurrent(next);
        setRevealed(null);
      }, 1100);
    } else {
      setPhase('result');
      setMessage(`Wrong! The card was ${RANKS[next.rank]}. You lost the pot.`);
      setPot(0);
      logActivity('hi-lo', bet, 0, 'loss');
    }
  };

  const collect = () => {
    if (phase !== 'guessing' || pot === 0) return;
    setBalance(b => b + pot);
    setMessage(`Collected $${pot.toFixed(2)}!`);
    logActivity('hi-lo', bet, pot, 'win');
    setPot(0);
    setPhase('idle');
    setCurrent(null);
    setRevealed(null);
    setStreak(0);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 0%, #071D14 0%, #03150F 55%, #050806 100%)', fontFamily: SERIF }}>
      {!loaded && <GameAssetLoader title="High or Low" assets={HILO_ASSETS} bgImage={GAME_BG.hiLo} onDone={() => setLoaded(true)} />}

      {/* Ambient casino backdrop — soft golden glow + emerald haze */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 20% 25%, rgba(212,167,44,0.08), transparent 40%), radial-gradient(circle at 80% 70%, rgba(8,122,67,0.12), transparent 45%)',
      }} />
      {/* subtle golden particles / bokeh */}
      <div className="fixed inset-0 pointer-events-none opacity-40" style={{
        backgroundImage: 'radial-gradient(1px 1px at 15% 20%, rgba(246,201,74,0.5), transparent), radial-gradient(1px 1px at 70% 40%, rgba(246,201,74,0.4), transparent), radial-gradient(1.5px 1.5px at 40% 80%, rgba(212,167,44,0.35), transparent), radial-gradient(1px 1px at 85% 15%, rgba(246,201,74,0.3), transparent)',
        backgroundSize: '400px 400px',
      }} />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-stone-950/90 backdrop-blur-xl border-b border-emerald-600/30">
        <GameTitleBar
          title="High or Low"
          left={<BackButton />}
          right={
            <>
              <span
                className="flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[11px] font-bold tabular-nums"
                style={{ border: `1px solid ${GOLD}`, background: DEEP_BLACK, color: GOLD_BRIGHT }}
              >
                <Wallet className="w-3.5 h-3.5" style={{ color: GOLD_BRIGHT }} />
                ${balance.toFixed(2)}
              </span>
              <button
                type="button"
                onClick={toggleMute}
                className="inline-flex items-center justify-center w-9 h-9 rounded-md active:scale-90 transition-transform"
                style={{ border: `1px solid ${GOLD}`, background: DEEP_BLACK }}
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted
                  ? <VolumeX className="w-5 h-5" style={{ color: GOLD_BRIGHT }} />
                  : <Volume2 className="w-5 h-5" style={{ color: GOLD_BRIGHT }} />}
              </button>
            </>
          }
          padLeft="pl-44"
          padRight="pr-44"
        />
      </header>

      <main className="max-w-md mx-auto px-3 py-4 flex flex-col items-center gap-4 relative z-10">
        {/* Main game panel — double gold border + ornate corners */}
        <div className="w-full p-4 rounded-2xl relative" style={{
          background: 'linear-gradient(160deg, #071D14 0%, #050806 100%)',
          border: `2px solid ${GOLD}`,
          boxShadow: `inset 0 0 0 1px ${DEEP_BLACK}, inset 0 0 0 3px rgba(246,201,74,0.4), 0 8px 24px rgba(0,0,0,0.6), 0 0 20px rgba(212,167,44,0.15)`,
        }}>
          {/* ornate corner decorations */}
          {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
            <div key={i} className={`absolute ${pos} pointer-events-none`} style={{
              width: 22, height: 22,
              borderTop: pos.includes('top') ? `2px solid ${GOLD_BRIGHT}` : 'none',
              borderBottom: pos.includes('bottom') ? `2px solid ${GOLD_BRIGHT}` : 'none',
              borderLeft: pos.includes('left') ? `2px solid ${GOLD_BRIGHT}` : 'none',
              borderRight: pos.includes('right') ? `2px solid ${GOLD_BRIGHT}` : 'none',
              margin: 6, borderRadius: 6,
            }} />
          ))}
          {/* Card area */}
          <div className="flex items-center justify-center gap-5 py-2">
            <CardSlot card={current} label="Current" />
            <span className="text-2xl" style={{ color: GOLD_BRIGHT, textShadow: '0 0 8px rgba(246,201,74,0.6)' }}>→</span>
            <CardSlot card={revealed} label="Next" />
          </div>
        </div>

        {/* Message banner — gold pill */}
        <div className="w-full py-3 px-4 rounded-full text-center" style={{
          background: `linear-gradient(to bottom, ${DEEP_BLACK}, #071D14)`,
          border: `2px solid ${GOLD}`,
          boxShadow: 'inset 0 1px 0 rgba(246,201,74,0.25), 0 4px 12px rgba(0,0,0,0.5), 0 0 14px rgba(212,167,44,0.2)',
        }}>
          <span className="text-base font-bold italic" style={{ color: '#FFD86A', fontFamily: SERIF, textShadow: '0 0 8px rgba(255,216,106,0.4)' }}>{message}</span>
        </div>

        {/* Statistics — 3 premium boxes */}
        <div className="grid grid-cols-3 gap-2 w-full">
          <StatBox label="Balance" value={`$${balance.toFixed(2)}`} icon={<Wallet className="w-3 h-3" />} />
          <StatBox label="Pot" value={`$${pot.toFixed(2)}`} icon={<CircleDollarSign className="w-3 h-3" />} />
          <StatBox label="Streak" value={`${streak}x`} icon={<Trophy className="w-3 h-3" />} />
        </div>

        {/* Bet control — minus / amount / plus */}
        {phase === 'idle' && (
          <div className="flex items-center justify-center gap-3 w-full">
            <button onClick={() => setBet(b => decBet(b))} className="w-11 h-11 rounded-full flex items-center justify-center" style={goldBtn}>
              <Minus className="w-5 h-5" />
            </button>
            <div className="px-6 py-2.5 rounded-lg min-w-[120px] text-center" style={{
              background: `linear-gradient(to bottom, ${DEEP_BLACK}, #071D14)`,
              border: `2px solid ${GOLD}`,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6), 0 0 12px rgba(212,167,44,0.2)',
            }}>
              <span className="text-lg font-bold italic tabular-nums" style={{ color: CREAM, fontFamily: SERIF }}>${bet.toFixed(2)}</span>
            </div>
            <button onClick={() => setBet(b => incBet(b))} className="w-11 h-11 rounded-full flex items-center justify-center" style={goldBtn}>
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Deal button — emerald gradient + gold border */}
        {phase === 'idle' && (
          <button onClick={deal} className="w-full py-4 rounded-full" style={dealBtn}>
            <span className="text-lg font-bold italic tracking-wide">DEAL • ${bet.toFixed(2)}</span>
          </button>
        )}

        {/* Guessing actions */}
        {phase === 'guessing' && (
          <div className="grid grid-cols-2 gap-3 w-full">
            <button onClick={() => guess('high')} className="py-4 rounded-xl flex items-center justify-center gap-2" style={dealBtn}>
              <ArrowUp className="w-5 h-5" /> HIGHER
            </button>
            <button onClick={() => guess('low')} className="py-4 rounded-xl flex items-center justify-center gap-2" style={{
              ...goldBtn,
              border: `2px solid ${GOLD_BRIGHT}`,
              color: CREAM,
              fontFamily: SERIF,
              boxShadow: 'inset 0 1px 0 rgba(246,201,74,0.2), 0 4px 12px rgba(0,0,0,0.4), 0 0 14px rgba(246,201,74,0.25)',
            }}>
              <ArrowDown className="w-5 h-5" /> LOWER
            </button>
            <button onClick={collect} className="col-span-2 py-3 rounded-xl flex items-center justify-center gap-2" style={{
              background: `linear-gradient(to bottom, ${GOLD_BRIGHT}, ${GOLD})`,
              border: `2px solid ${GOLD_HIGHLIGHT}`,
              color: DEEP_BLACK,
              fontFamily: SERIF,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 12px rgba(212,167,44,0.4), 0 0 14px rgba(255,216,106,0.3)',
            }}>
              <RotateCcw className="w-4 h-4" /> COLLECT ${pot.toFixed(2)}
            </button>
          </div>
        )}

        {/* Result */}
        {phase === 'result' && (
          <button onClick={() => { setPhase('idle'); setCurrent(null); setRevealed(null); setMessage('Deal a card to start!'); }} className="w-full py-4 rounded-full" style={dealBtn}>
            <span className="text-lg font-bold italic tracking-wide">NEW HAND</span>
          </button>
        )}
      </main>
    </div>
  );
}