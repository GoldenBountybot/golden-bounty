import React, { useState } from 'react';
import { ArrowUp, ArrowDown, RotateCcw, Minus, Plus, ArrowLeft, Volume2, Wallet, Coins, Trophy } from 'lucide-react';
import GameLoadingScreen from '@/components/GameLoadingScreen';
import LuxuryCard from '@/components/hilo/LuxuryCard';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import { incBet, decBet } from '@/lib/betStepper';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const LUX = "'Cinzel', 'Georgia', serif";
const LUX_BODY = "'Cormorant Garamond', 'Georgia', serif";

const GOLD = '#D4A72C';
const GOLD_BRIGHT = '#F6C94A';
const GOLD_HI = '#FFE08A';
const CREAM = '#FFF1C7';

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

// Reusable gold bevel border for panels
const goldPanel = {
  background: 'linear-gradient(160deg, #071D14 0%, #050806 100%)',
  boxShadow: `0 0 0 1px #1a0f08, 0 0 0 2px ${GOLD}, 0 0 0 3px #3a2a10, 0 0 0 4px ${GOLD_BRIGHT}, 0 10px 26px rgba(0,0,0,0.6), 0 0 22px rgba(246,201,74,0.12)`,
};

function GoldCorner({ pos }) {
  return (
    <span
      className="absolute pointer-events-none"
      style={{
        ...pos,
        width: 16,
        height: 16,
        transform: `rotate(${pos.rot || 0}deg)`,
        borderTop: `1.5px solid ${GOLD_BRIGHT}`,
        borderLeft: `1.5px solid ${GOLD_BRIGHT}`,
        boxShadow: '0 0 5px rgba(246,201,74,0.7)',
      }}
    />
  );
}

function StatBox({ label, value, icon: Icon }) {
  return (
    <div
      className="relative rounded-xl flex flex-col items-center justify-center py-2.5 px-1"
      style={{
        background: 'linear-gradient(160deg, #061410 0%, #03090A 100%)',
        boxShadow: `inset 0 1px 4px rgba(0,0,0,0.6), 0 0 0 1px ${GOLD}, 0 0 10px rgba(246,201,74,0.18)`,
      }}
    >
      <div className="flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" style={{ color: GOLD_BRIGHT, filter: 'drop-shadow(0 0 3px rgba(246,201,74,0.6))' }} />}
        <span className="text-[9px] tracking-[0.18em] uppercase" style={{ fontFamily: LUX, color: GOLD, fontWeight: 600 }}>{label}</span>
      </div>
      <span className="text-base font-bold tabular-nums leading-tight mt-0.5" style={{ fontFamily: LUX_BODY, color: CREAM, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

export default function HiLo() {
  const { balance, setBalance } = useCasinoBalance();
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
    const wantCorrect = Math.random() < (rtp / 100);
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

  const dealBtnBase = {
    fontFamily: LUX,
    fontWeight: 800,
    fontStyle: 'italic',
    color: CREAM,
    letterSpacing: '0.06em',
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: 'radial-gradient(circle at 50% 0%, #071D14 0%, #03150F 60%, #020A07 100%)' }}
    >
      {!loaded && <GameLoadingScreen title="High or Low" onDone={() => setLoaded(true)} />}

      {/* ambient golden particles / bokeh */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          opacity: 0.5,
          backgroundImage:
            'radial-gradient(1.5px 1.5px at 18% 22%, rgba(246,201,74,0.7), transparent), radial-gradient(1px 1px at 72% 30%, rgba(255,224,138,0.6), transparent), radial-gradient(1.5px 1.5px at 40% 70%, rgba(246,201,74,0.5), transparent), radial-gradient(1px 1px at 85% 65%, rgba(255,224,138,0.5), transparent), radial-gradient(1px 1px at 12% 80%, rgba(246,201,74,0.5), transparent)',
          backgroundSize: '340px 340px',
        }}
      />
      {/* faint blurred casino table hint */}
      <div
        className="fixed inset-x-0 bottom-0 pointer-events-none"
        style={{ height: '40%', background: 'radial-gradient(ellipse at 50% 100%, rgba(8,122,67,0.18), transparent 70%)' }}
      />
      {/* soft radial golden glow around edges */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 120px rgba(246,201,74,0.08)' }}
      />

      {/* HEADER */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: 'linear-gradient(to bottom, #0a0906 0%, #071D14 100%)',
          borderBottom: `1px solid ${GOLD}`,
          boxShadow: `0 2px 10px rgba(0,0,0,0.5), 0 0 14px rgba(246,201,74,0.12)`,
        }}
      >
        <div className="max-w-md mx-auto px-3 py-2.5 flex items-center justify-between">
          {/* Back */}
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 transition-transform active:scale-95"
            style={{
              background: 'linear-gradient(to bottom, #0a0906, #050806)',
              border: `1px solid ${GOLD}`,
              boxShadow: `inset 0 1px 0 rgba(255,224,138,0.2), 0 0 8px rgba(246,201,74,0.18)`,
            }}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: GOLD_BRIGHT, filter: 'drop-shadow(0 0 3px rgba(246,201,74,0.6))' }} />
            <span className="text-sm font-bold" style={{ fontFamily: LUX, color: GOLD_BRIGHT, letterSpacing: '0.05em' }}>Back</span>
          </button>

          {/* Title in ornate gold frame */}
          <div
            className="relative rounded-lg px-5 py-1.5"
            style={{
              border: `1px solid ${GOLD_BRIGHT}`,
              background: 'linear-gradient(to bottom, rgba(246,201,74,0.08), rgba(0,0,0,0))',
              boxShadow: `0 0 0 1px #3a2a10, 0 0 14px rgba(246,201,74,0.3)`,
            }}
          >
            <GoldCorner pos={{ top: 2, left: 2, rot: 0 }} />
            <GoldCorner pos={{ top: 2, right: 2, rot: 90 }} />
            <GoldCorner pos={{ bottom: 2, left: 2, rot: 270 }} />
            <GoldCorner pos={{ bottom: 2, right: 2, rot: 180 }} />
            <h1
              className="text-xl font-black tracking-[0.12em]"
              style={{ fontFamily: LUX, color: '#F4C95D', textShadow: '0 1px 2px rgba(0,0,0,0.7), 0 0 12px rgba(246,201,74,0.6)' }}
            >
              High or Low
            </h1>
          </div>

          {/* Speaker */}
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={{
              background: 'linear-gradient(to bottom, #0a0906, #050806)',
              border: `1px solid ${GOLD}`,
              boxShadow: `inset 0 1px 0 rgba(255,224,138,0.2), 0 0 8px rgba(246,201,74,0.18)`,
            }}
          >
            <Volume2 className="w-4 h-4" style={{ color: GOLD_BRIGHT, filter: 'drop-shadow(0 0 3px rgba(246,201,74,0.6))' }} />
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-md mx-auto px-4 py-5 flex flex-col items-center gap-4">
        {/* MAIN GAME PANEL */}
        <div
          className="relative w-full rounded-2xl py-7 px-4 flex flex-col items-center"
          style={goldPanel}
        >
          <GoldCorner pos={{ top: 6, left: 6, rot: 0 }} />
          <GoldCorner pos={{ top: 6, right: 6, rot: 90 }} />
          <GoldCorner pos={{ bottom: 6, left: 6, rot: 270 }} />
          <GoldCorner pos={{ bottom: 6, right: 6, rot: 180 }} />
          {/* subtle dark green texture */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ opacity: 0.18, backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(8,122,67,0.4), transparent 60%), radial-gradient(circle at 70% 80%, rgba(8,122,67,0.3), transparent 60%)' }}
          />

          {/* CARD AREA */}
          <div className="relative flex items-center justify-center gap-5">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] tracking-[0.22em] uppercase" style={{ fontFamily: LUX, color: GOLD, fontWeight: 600 }}>Current</span>
              <LuxuryCard card={current} hidden={!current} />
            </div>
            <span
              className="text-3xl"
              style={{ color: GOLD_BRIGHT, filter: 'drop-shadow(0 0 8px rgba(246,201,74,0.7))', fontFamily: LUX, marginTop: 18 }}
            >
              →
            </span>
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] tracking-[0.22em] uppercase" style={{ fontFamily: LUX, color: GOLD, fontWeight: 600 }}>Next</span>
              <LuxuryCard card={revealed} hidden={!revealed} />
            </div>
          </div>
        </div>

        {/* MESSAGE PANEL */}
        <div
          className="relative w-full rounded-xl py-3 px-4 text-center"
          style={{
            background: 'linear-gradient(to bottom, #03090A, #061410)',
            boxShadow: `inset 0 1px 4px rgba(0,0,0,0.6), 0 0 0 1px ${GOLD}, 0 0 0 3px ${GOLD_BRIGHT}, 0 0 0 4px #3a2a10, 0 0 18px rgba(246,201,74,0.2)`,
          }}
        >
          <GoldCorner pos={{ top: 3, left: 3, rot: 0 }} />
          <GoldCorner pos={{ top: 3, right: 3, rot: 90 }} />
          <GoldCorner pos={{ bottom: 3, left: 3, rot: 270 }} />
          <GoldCorner pos={{ bottom: 3, right: 3, rot: 180 }} />
          <span className="text-base italic" style={{ fontFamily: LUX_BODY, color: '#FFD86A', fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.7), 0 0 10px rgba(255,216,106,0.5)' }}>{message}</span>
        </div>

        {/* STATISTICS */}
        <div className="grid grid-cols-3 gap-2.5 w-full">
          <StatBox label="Balance" value={`$${balance.toFixed(2)}`} icon={Wallet} />
          <StatBox label="Pot" value={`$${pot.toFixed(2)}`} icon={Coins} />
          <StatBox label="Streak" value={`${streak}x`} icon={Trophy} />
        </div>

        {/* BET CONTROL (idle only) */}
        {phase === 'idle' && (
          <div className="flex items-center justify-center gap-4 w-full">
            <button
              onClick={() => setBet(b => decBet(b))}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-90"
              style={{
                background: 'linear-gradient(to bottom, #0a0906, #050806)',
                border: `1px solid ${GOLD}`,
                boxShadow: `inset 0 1px 0 rgba(255,224,138,0.2), 0 0 10px rgba(246,201,74,0.2)`,
              }}
            >
              <Minus className="w-5 h-5" style={{ color: GOLD_BRIGHT }} />
            </button>
            <div
              className="rounded-xl px-6 py-2.5 min-w-[120px] text-center"
              style={{
                background: 'linear-gradient(to bottom, #03090A, #061410)',
                border: `1px solid ${GOLD_BRIGHT}`,
                boxShadow: `inset 0 1px 4px rgba(0,0,0,0.6), 0 0 14px rgba(246,201,74,0.25)`,
              }}
            >
              <span className="text-xl font-bold italic tabular-nums" style={{ fontFamily: LUX_BODY, color: CREAM, fontWeight: 700 }}>${bet.toFixed(2)}</span>
            </div>
            <button
              onClick={() => setBet(b => incBet(b))}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-90"
              style={{
                background: 'linear-gradient(to bottom, #0a0906, #050806)',
                border: `1px solid ${GOLD}`,
                boxShadow: `inset 0 1px 0 rgba(255,224,138,0.2), 0 0 10px rgba(246,201,74,0.2)`,
              }}
            >
              <Plus className="w-5 h-5" style={{ color: GOLD_BRIGHT }} />
            </button>
          </div>
        )}

        {/* ACTIONS */}
        {phase === 'idle' && (
          <button
            onClick={deal}
            className="w-full rounded-xl py-4 text-lg transition-transform active:scale-[0.98]"
            style={{
              ...dealBtnBase,
              background: 'linear-gradient(to bottom, #12A85E 0%, #087A43 100%)',
              border: `1.5px solid ${GOLD_BRIGHT}`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 6px rgba(0,0,0,0.3), 0 0 18px rgba(246,201,74,0.4), 0 4px 12px rgba(0,0,0,0.4)`,
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            DEAL • ${bet.toFixed(2)}
          </button>
        )}

        {phase === 'guessing' && (
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={() => guess('high')}
              className="py-4 rounded-xl text-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              style={{
                ...dealBtnBase,
                background: 'linear-gradient(to bottom, #12A85E 0%, #087A43 100%)',
                border: `1.5px solid ${GOLD_BRIGHT}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 0 14px rgba(246,201,74,0.3)`,
                color: CREAM,
              }}
            >
              <ArrowUp className="w-5 h-5" /> HIGHER
            </button>
            <button
              onClick={() => guess('low')}
              className="py-4 rounded-xl text-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              style={{
                ...dealBtnBase,
                background: 'linear-gradient(to bottom, #0a0906 0%, #050806 100%)',
                border: `1.5px solid ${GOLD_BRIGHT}`,
                boxShadow: `inset 0 1px 0 rgba(255,224,138,0.2), 0 0 14px rgba(246,201,74,0.3)`,
                color: GOLD_HI,
              }}
            >
              <ArrowDown className="w-5 h-5" /> LOWER
            </button>
            <button
              onClick={collect}
              className="col-span-2 py-3 rounded-xl text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              style={{
                ...dealBtnBase,
                background: 'linear-gradient(to bottom, #FFE08A 0%, #D4A72C 100%)',
                border: `1.5px solid ${GOLD_HI}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 0 16px rgba(246,201,74,0.5)`,
                color: '#2a1a06',
              }}
            >
              <RotateCcw className="w-4 h-4" /> COLLECT ${pot.toFixed(2)}
            </button>
          </div>
        )}

        {phase === 'result' && (
          <button
            onClick={() => { setPhase('idle'); setCurrent(null); setRevealed(null); setMessage('Deal a card to start!'); }}
            className="w-full rounded-xl py-4 text-lg transition-transform active:scale-[0.98]"
            style={{
              ...dealBtnBase,
              background: 'linear-gradient(to bottom, #12A85E 0%, #087A43 100%)',
              border: `1.5px solid ${GOLD_BRIGHT}`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 0 18px rgba(246,201,74,0.4)`,
              color: CREAM,
            }}
          >
            NEW HAND
          </button>
        )}
      </main>
    </div>
  );
}