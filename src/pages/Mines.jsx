import React, { useState } from 'react';
import { Bomb, Gem } from 'lucide-react';
import GameHeader from '@/components/GameHeader';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';

const TOTAL = 25;
const COLS = 5;
const MINE_OPTS = [1, 3, 5];
const BETS = [25, 50, 100, 250, 500];

export default function Mines() {
  const { balance, setBalance, reset } = useCasinoBalance();
  const { rtp } = useGameSettings('mines');
  const [betIdx, setBetIdx] = useState(1);
  const [mineIdx, setMineIdx] = useState(1);
  const mines = MINE_OPTS[mineIdx];
  const safe = TOTAL - mines;
  const [phase, setPhase] = useState('idle'); // idle | playing | over
  const [mineSet, setMineSet] = useState(new Set());
  const [revealed, setRevealed] = useState(new Set());
  const [pot, setPot] = useState(1);
  const [message, setMessage] = useState('Set bet & mines, then start');
  const [lastWin, setLastWin] = useState(0);
  const [forceFirstMine, setForceFirstMine] = useState(false);
  const bet = BETS[betIdx];

  const start = () => {
    if (phase === 'playing') return;
    if (balance < bet) { setMessage('Insufficient balance! Reset below.'); return; }
    setBalance(b => b - bet);
    const positions = Array.from({ length: TOTAL }, (_, i) => i);
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    setMineSet(new Set(positions.slice(0, mines)));
    setRevealed(new Set());
    setPot(1);
    setLastWin(0);
    setForceFirstMine(Math.random() >= (rtp / 100));
    setPhase('playing');
    setMessage(`Reveal ${safe} safe tiles · avoid ${mines} mines`);
  };

  const reveal = (idx) => {
    if (phase !== 'playing' || revealed.has(idx)) return;
    const effective = new Set(mineSet);
    // First-reveal RTP bias: favor a safe first pick or force a mine.
    if (revealed.size === 0) {
      if (forceFirstMine) {
        if (!effective.has(idx)) {
          effective.add(idx);
          const others = [...effective].filter(x => x !== idx);
          if (others.length) effective.delete(others[Math.floor(Math.random() * others.length)]);
        }
      } else if (effective.has(idx)) {
        effective.delete(idx);
        const cands = [];
        for (let i = 0; i < TOTAL; i++) if (i !== idx && !effective.has(i)) cands.push(i);
        if (cands.length) effective.add(cands[Math.floor(Math.random() * cands.length)]);
      }
      setMineSet(effective);
    }
    const newRev = new Set(revealed); newRev.add(idx);
    setRevealed(newRev);
    if (effective.has(idx)) {
      setPhase('over');
      setPot(0);
      setMessage('BOOM! You hit a mine.');
      return;
    }
    const k = newRev.size;
    const before = k - 1;
    const newPot = pot * (TOTAL - before) / (safe - before);
    setPot(newPot);
    if (k === safe) {
      const win = bet * newPot;
      setBalance(b => b + win);
      setLastWin(win);
      setMessage(`Cleared! Won $${win.toFixed(2)} (${newPot.toFixed(2)}x)`);
      setPhase('over');
    } else {
      setMessage(`Safe! Pot $${(bet * newPot).toFixed(2)} · cash out or continue`);
    }
  };

  const cashout = () => {
    if (phase !== 'playing' || revealed.size === 0) return;
    const win = bet * pot;
    setBalance(b => b + win);
    setLastWin(win);
    setMessage(`Cashed out $${win.toFixed(2)} (${pot.toFixed(2)}x)`);
    setPhase('over');
  };

  const newGame = () => {
    setPhase('idle');
    setRevealed(new Set());
    setMineSet(new Set());
    setPot(1);
    setMessage('Set bet & mines, then start');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-950 via-stone-950 to-stone-950">
      <GameHeader title="Mines Gold" accent="text-cyan-200" border="border-cyan-600/30" />

      <main className="max-w-md mx-auto px-4 py-6 flex flex-col items-center gap-5">
        <WesternFrame className="w-full p-4">
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: TOTAL }).map((_, i) => {
              const isRev = revealed.has(i);
              const isMine = mineSet.has(i);
              const showMine = isRev && isMine;
              const showSafe = isRev && !isMine;
              const revealLost = phase === 'over' && isMine && !isRev;
              return (
                <button
                  key={i}
                  onClick={() => reveal(i)}
                  disabled={phase !== 'playing' || isRev}
                  className={`aspect-square rounded-md flex items-center justify-center border transition-colors ${
                    showMine ? 'bg-red-700 border-red-400'
                    : showSafe ? 'bg-emerald-700 border-emerald-400'
                    : revealLost ? 'bg-red-900/60 border-red-600/40'
                    : 'bg-stone-800 border-amber-700/40 hover:bg-stone-700'
                  }`}
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  {showMine ? <Bomb className="w-5 h-5 text-red-100" />
                    : showSafe ? <Gem className="w-5 h-5 text-emerald-200" />
                    : revealLost ? <Bomb className="w-5 h-5 text-red-300/70" />
                    : <span className="text-amber-500/40 text-lg italic">?</span>}
                </button>
              );
            })}
          </div>
        </WesternFrame>

        <WesternFrame glow className="w-full text-center py-2">
          <span className="font-black italic text-sm text-amber-300 px-2" style={{ fontFamily: 'Georgia, serif' }}>{message}</span>
        </WesternFrame>

        <div className="grid grid-cols-3 gap-2 w-full">
          <WesternFrame className="flex flex-col items-center py-2">
            <span className="text-[9px] text-amber-300/70 tracking-widest uppercase">Balance</span>
            <span className="text-sm font-bold italic text-yellow-100 tabular-nums">${balance.toFixed(2)}</span>
          </WesternFrame>
          <WesternFrame className="flex flex-col items-center py-2">
            <span className="text-[9px] text-amber-300/70 tracking-widest uppercase">Multiplier</span>
            <span className="text-sm font-bold italic text-yellow-100 tabular-nums">{pot.toFixed(2)}x</span>
          </WesternFrame>
          <WesternFrame className="flex flex-col items-center py-2">
            <span className="text-[9px] text-amber-300/70 tracking-widest uppercase">Pot</span>
            <span className="text-sm font-bold italic text-yellow-100 tabular-nums">${(bet * pot).toFixed(2)}</span>
          </WesternFrame>
        </div>

        {phase === 'idle' && (
          <>
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
            <div className="flex items-center gap-2 justify-center text-amber-100/80 text-xs italic" style={{ fontFamily: 'Georgia, serif' }}>
              Mines:
              {MINE_OPTS.map((m, i) => (
                <button
                  key={m}
                  onClick={() => setMineIdx(i)}
                  className={`px-3 py-1 rounded-md font-bold border transition-colors ${mineIdx === i ? 'bg-red-600 text-white border-red-400' : 'bg-black/30 border-amber-700/40 hover:bg-black/50'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </>
        )}

        {phase === 'idle' && (
          <button
            onClick={start}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-700 text-white text-lg font-black italic shadow-lg hover:from-cyan-400 hover:to-blue-600 transition-colors"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            START · ${bet} · {mines} mines
          </button>
        )}

        {phase === 'playing' && (
          <button
            onClick={cashout}
            disabled={revealed.size === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-600 text-stone-950 text-lg font-black italic shadow-lg hover:from-yellow-300 hover:to-amber-500 disabled:opacity-50 transition-colors"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            CASH OUT ${(bet * pot).toFixed(2)}
          </button>
        )}

        {phase === 'over' && (
          <button
            onClick={newGame}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-700 text-white text-lg font-black italic shadow-lg hover:from-cyan-400 hover:to-blue-600 transition-colors"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            NEW GAME
          </button>
        )}

        <button onClick={reset} className="text-[10px] italic text-amber-600/80 hover:text-amber-300 tracking-[0.2em] uppercase" style={{ fontFamily: 'Georgia, serif' }}>
          Reset Balance
        </button>
      </main>
    </div>
  );
}