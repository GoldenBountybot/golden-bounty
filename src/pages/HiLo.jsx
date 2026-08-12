import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, RotateCcw, Minus, Plus, Wallet, CircleDollarSign, Trophy, Volume2, VolumeX } from 'lucide-react';
import BackButton from '@/components/BackButton';
import GameTitleBar from '@/components/GameTitleBar';
import GameAssetLoader from '@/components/GameAssetLoader';
import { HILO_ASSETS, GAME_BG } from '@/lib/gameAssets';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { incBet, decBet } from '@/lib/betStepper';
import { useMute } from '@/lib/soundMute';
import { playDeal, playWin, playLoss, playCollect, startBackgroundMusic, stopBackgroundMusic } from '@/lib/hiloSound';
import PlayerHistoryButton from '@/components/PlayerHistoryButton';

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
// Distance-weighted selection: ranks closer to the current card are more
// likely, so the outcome feels like a real deck and is harder to predict.
// When the biased pool is empty (extreme card), force a tie instead of a
// random draw so no direction is exploitable.
function pickCard(dir, curRank, wantCorrect) {
  const ranks = RANKS.map((_, i) => i);
  let pool;
  if (wantCorrect) {
    pool = dir === 'high' ? ranks.filter(r => r > curRank) : ranks.filter(r => r < curRank);
    if (pool.length === 0) return { rank: curRank, suit: Math.floor(Math.random() * 4) };
  } else {
    pool = dir === 'high' ? ranks.filter(r => r < curRank) : ranks.filter(r => r > curRank);
    if (pool.length === 0) pool = [curRank];
  }
  const weights = pool.map(r => 1 / Math.abs(r - curRank));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  let chosen = pool[0];
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) { chosen = pool[i]; break; }
  }
  return { rank: chosen, suit: Math.floor(Math.random() * 4) };
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

// 3D flip card — shows the back face-up, then flips to reveal the drawn card
// when `card` is set. Used for the "Next" card so the reveal is animated.
function FlipCard({ card }) {
  const flipped = !!card;
  return (
    <div style={{ width: 112, height: 160, perspective: 1000 }}>
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.7s ease-in-out',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
          <CardBack />
        </div>
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          {card ? <CardFace card={card} /> : <CardBack />}
        </div>
      </div>
    </div>
  );
}

function CardSlot({ card, label, flip }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] tracking-[0.25em] uppercase font-semibold" style={{ color: GOLD, fontFamily: SERIF }}>{label}</span>
      {flip ? <FlipCard card={card} /> : (card ? <CardFace card={card} /> : <CardBack />)}
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
  const { balance, setBalance, beginRound, settleBet } = useCasinoBalance();
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
  const serverWinRef = useRef(0);
  const serverRoundPromiseRef = useRef(null); // pending beginRound promise — awaited lazily on first guess/collect

  // Start the ambient casino lounge loop on the first user gesture (browsers
  // block AudioContext until a user interacts), then keep it playing. Stop
  // on unmount.
  useEffect(() => {
    let started = false;
    const begin = () => {
      if (started) return;
      started = true;
      startBackgroundMusic();
      window.removeEventListener('pointerdown', begin);
      window.removeEventListener('keydown', begin);
    };
    window.addEventListener('pointerdown', begin);
    window.addEventListener('keydown', begin);
    return () => {
      window.removeEventListener('pointerdown', begin);
      window.removeEventListener('keydown', begin);
      stopBackgroundMusic();
    };
  }, []);

  const deal = () => {
    if (phase === 'guessing') return;
    if (balance < bet) { setMessage('Insufficient balance! Reset below.'); return; }
    // Kick off the server round in the background — beginRound deducts the
    // bet instantly for immediate visual feedback. The promise is awaited
    // lazily on the first guess/collect so the server's win cap is known.
    serverRoundPromiseRef.current = beginRound(bet, 'hi-lo', false, 'cap');
    // Immediate UI feedback — card appears instantly, no waiting for server.
    setPot(bet);
    setCurrent(drawCard());
    setRevealed(null);
    setStreak(0);
    setPhase('guessing');
    setMessage('Guess: Higher or Lower?');
    playDeal();
  };

  // Await the pending beginRound promise (if still in flight) and stash the
  // server-decided win cap. Returns true on success, false on failure.
  const ensureServerRound = async () => {
    if (!serverRoundPromiseRef.current) return true;
    const serverRound = await serverRoundPromiseRef.current;
    serverRoundPromiseRef.current = null;
    if (!serverRound || serverRound.failed || serverRound.win_amount == null) {
      setMessage('Round failed — try a different bet amount.');
      setPhase('idle');
      setCurrent(null);
      setRevealed(null);
      setPot(0);
      return false;
    }
    serverWinRef.current = Number(serverRound.win_amount);
    return true;
  };

  const guess = async (dir) => {
    if (phase !== 'guessing') return;
    // Wait for the server round to complete so we know the win cap.
    if (!(await ensureServerRound())) return;
    // Decide correctness PROBABILISTICALLY based on RTP. The win chance per
    // guess is DIRECTLY the RTP fraction (e.g. 50% RTP → 50% win chance per
    // guess), so admin RTP changes are immediately visible in gameplay.
    // The server cap is still enforced as a hard ceiling — if the pot would
    // exceed it, force a loss.
    const rtpVal = Number(rtp || 50);
    const rtpFrac = Math.max(0, Math.min(1, rtpVal / 100));
    const withinCap = serverWinRef.current > 0 && (pot * 2) <= serverWinRef.current;
    const wantCorrect = withinCap && Math.random() < rtpFrac;
    const next = pickCard(dir, current.rank, wantCorrect);
    setRevealed(next);
    const same = next.rank === current.rank;
    const correct = dir === 'high' ? next.rank > current.rank : next.rank < current.rank;
    if (same) {
      setPhase('idle');
      setMessage(`Same rank — push lost! Card was ${RANKS[next.rank]}.`);
      setPot(0);
      settleBet(bet, 0, 'hi-lo');
      playLoss();
    } else if (correct) {
      const newPot = pot * 2;
      setPot(newPot);
      setStreak(s => s + 1);
      setMessage(`Correct! Pot is now $${newPot.toFixed(2)}. Continue or Collect.`);
      playWin();
      setTimeout(() => {
        setCurrent(next);
        setRevealed(null);
      }, 1100);
    } else {
      setPhase('idle');
      setMessage(`Wrong! The card was ${RANKS[next.rank]}. You lost the pot.`);
      setPot(0);
      settleBet(bet, 0, 'hi-lo');
      playLoss();
    }
  };

  const collect = async () => {
    if (phase !== 'guessing' || pot === 0) return;
    // Wait for the server round to complete so we know the win cap.
    if (!(await ensureServerRound())) return;
    const win = Math.min(pot, serverWinRef.current);
    settleBet(bet, win, 'hi-lo');
    setMessage(`Collected $${win.toFixed(2)}!`);
    playCollect();
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
          maxWidth="max-w-none"
        />
      </header>

      <main className="max-w-none mx-auto px-3 py-4 flex flex-col items-center gap-4 relative z-10">
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
            <CardSlot card={current} label="Current" flip />
            <span className="text-2xl" style={{ color: GOLD_BRIGHT, textShadow: '0 0 8px rgba(246,201,74,0.6)' }}>→</span>
            <CardSlot card={revealed} label="Next" flip />
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

        {/* Game history */}
        <PlayerHistoryButton gameId="hi-lo" title="High or Low History" />
      </main>
    </div>
  );
}