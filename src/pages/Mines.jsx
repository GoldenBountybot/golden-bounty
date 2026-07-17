import React, { useState } from 'react';
import { Bomb, Gem, Pickaxe, DollarSign, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import GameHeader from '@/components/GameHeader';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';

const TOTAL = 25;
const COLS = 5;
const BETS = [10, 25, 50, 100, 250, 500];
const MINE_PRESETS = [1, 3, 5, 10, 24];

// House-edge-adjusted Spribe-style multiplier for k revealed safe tiles
// given m mines among N total. Factor (1 - edge) applied each step.
const EDGE = 0.03;
function multiplierFor(k, m) {
  const safe = TOTAL - m;
  if (k <= 0) return 1;
  let r = 1;
  for (let i = 0; i < k; i++) {
    r *= (TOTAL - i) / (safe - i);
  }
  return r * (1 - EDGE);
}

export default function Mines() {
  const { balance, setBalance } = useCasinoBalance();
  const { rtp } = useGameSettings('mines');
  const [betIdx, setBetIdx] = useState(1);
  const [customBet, setCustomBet] = useState('');
  const bet = customBet ? Math.max(1, Number(customBet)) : BETS[betIdx];
  const [mines, setMines] = useState(3);
  const safe = TOTAL - mines;

  const [phase, setPhase] = useState('idle'); // idle | playing | over
  const [mineSet, setMineSet] = useState(new Set());
  const [revealed, setRevealed] = useState(new Set());
  const [revealedOrder, setRevealedOrder] = useState([]); // for animation sequence
  const [pot, setPot] = useState(1);
  const [lastWin, setLastWin] = useState(0);
  const [message, setMessage] = useState('Place your bet and pick the number of mines');
  const [forceFirstMine, setForceFirstMine] = useState(false);
  const logActivity = useLogActivity();

  const currentMult = pot;
  const nextMult = multiplierFor(revealedOrder.length + 1, mines);

  const start = () => {
    if (phase === 'playing') return;
    if (!bet || bet <= 0) { setMessage('Enter a valid bet'); return; }
    if (balance < bet) { setMessage('Insufficient balance'); return; }
    setBalance((b) => b - bet);
    const positions = Array.from({ length: TOTAL }, (_, i) => i);
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    setMineSet(new Set(positions.slice(0, mines)));
    setRevealed(new Set());
    setRevealedOrder([]);
    setPot(1);
    setLastWin(0);
    setForceFirstMine(Math.random() >= (rtp / 100));
    setPhase('playing');
    setMessage(`Find ${safe} gems · avoid ${mines} mines`);
  };

  const reveal = (idx) => {
    if (phase !== 'playing' || revealed.has(idx)) return;
    const effective = new Set(mineSet);
    if (revealed.size === 0) {
      if (forceFirstMine) {
        if (!effective.has(idx)) {
          effective.add(idx);
          const others = [...effective].filter((x) => x !== idx);
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
    const newRev = new Set(revealed);
    newRev.add(idx);
    const newOrder = [...revealedOrder, idx];
    setRevealed(newRev);
    setRevealedOrder(newOrder);

    if (effective.has(idx)) {
      setPhase('over');
      setPot(0);
      setMessage('BOOM — you hit a mine');
      logActivity('mines', bet, 0, 'loss');
      return;
    }
    const k = newRev.size;
    const newPot = multiplierFor(k, mines);
    setPot(newPot);
    if (k === safe) {
      const win = bet * newPot;
      setBalance((b) => b + win);
      setLastWin(win);
      setMessage(`Cleared! +$${win.toFixed(2)} (${newPot.toFixed(2)}x)`);
      logActivity('mines', bet, win, 'win');
      setPhase('over');
    } else {
      setMessage(`Safe! Pot $${(bet * newPot).toFixed(2)}`);
    }
  };

  const cashout = () => {
    if (phase !== 'playing' || revealed.size === 0) return;
    const win = bet * pot;
    setBalance((b) => b + win);
    setLastWin(win);
    setMessage(`Cashed out $${win.toFixed(2)} (${pot.toFixed(2)}x)`);
    logActivity('mines', bet, win, 'win');
    setPhase('over');
  };

  const newGame = () => {
    setPhase('idle');
    setRevealed(new Set());
    setRevealedOrder([]);
    setMineSet(new Set());
    setPot(1);
    setMessage('Place your bet and pick the number of mines');
  };

  const isOver = phase === 'over';

  return (
    <div className="min-h-screen bg-[#0b0e1a] text-slate-100 flex flex-col">
      <GameHeader title="Mines" accent="text-slate-100" border="border-slate-700/40" />

      <main className="max-w-md w-full mx-auto px-4 py-5 flex flex-col gap-4 flex-1">
        {/* Balance + bet bar */}
        <div className="rounded-xl bg-[#151929] border border-slate-700/50 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#f7931e]/15 border border-[#f7931e]/40">
              <DollarSign className="w-5 h-5 text-[#f7931e]" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Balance</p>
              <p className="text-lg font-bold tabular-nums text-slate-100">${balance.toFixed(2)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Profit</p>
            <p className={`text-sm font-bold tabular-nums ${lastWin > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {lastWin > 0 ? `+$${lastWin.toFixed(2)}` : '$0.00'}
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="rounded-xl bg-[#151929] border border-slate-700/50 p-3">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: TOTAL }).map((_, i) => {
              const isRev = revealed.has(i);
              const isMine = mineSet.has(i);
              const showMine = isRev && isMine;
              const showSafe = isRev && !isMine;
              const revealLost = isOver && isMine && !isRev;
              return (
                <button
                  key={i}
                  onClick={() => reveal(i)}
                  disabled={phase !== 'playing' || isRev}
                  className={`aspect-square rounded-lg flex items-center justify-center border transition-all duration-150 ${
                    showMine ? 'bg-rose-600/90 border-rose-400 scale-105'
                    : showSafe ? 'bg-[#1f2436] border-emerald-400/60 scale-105'
                    : revealLost ? 'bg-rose-900/40 border-rose-600/40'
                    : phase === 'playing' ? 'bg-[#1f2436] border-slate-600/50 hover:bg-[#262c42] hover:border-[#f7931e]/50 cursor-pointer'
                    : 'bg-[#1f2436] border-slate-600/50'
                  }`}
                >
                  {showMine ? <Bomb className="w-6 h-6 text-white" />
                    : showSafe ? <Gem className="w-6 h-6 text-emerald-400" />
                    : revealLost ? <Bomb className="w-5 h-5 text-rose-400/70" />
                    : <span className="text-slate-600 text-lg font-bold">·</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls panel */}
        {phase === 'idle' && (
          <div className="rounded-xl bg-[#151929] border border-slate-700/50 p-4 flex flex-col gap-4">
            {/* Bet */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Bet Amount</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCustomBet(String(Math.max(1, Math.floor(bet / 2))))} className="w-7 h-7 rounded-md bg-[#1f2436] border border-slate-600/50 flex items-center justify-center hover:bg-[#262c42]"><ChevronDown className="w-4 h-4 text-slate-300" /></button>
                  <input
                    value={customBet || bet}
                    onChange={(e) => setCustomBet(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="w-24 text-center bg-[#1f2436] border border-slate-600/50 rounded-md py-1 text-sm font-bold text-slate-100 outline-none focus:border-[#f7931e]"
                  />
                  <button onClick={() => setCustomBet(String(Math.floor(bet * 2)))} className="w-7 h-7 rounded-md bg-[#1f2436] border border-slate-600/50 flex items-center justify-center hover:bg-[#262c42]"><ChevronUp className="w-4 h-4 text-slate-300" /></button>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {BETS.map((b, i) => (
                  <button
                    key={b}
                    onClick={() => { setBetIdx(i); setCustomBet(''); }}
                    className={`py-1.5 rounded-md text-xs font-bold border transition-colors ${(!customBet && betIdx === i) ? 'bg-[#f7931e] text-[#0b0e1a] border-[#f7931e]' : 'bg-[#1f2436] text-slate-300 border-slate-600/50 hover:bg-[#262c42]'}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Mines */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Mines</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setMines((m) => Math.max(1, m - 1))} className="w-7 h-7 rounded-md bg-[#1f2436] border border-slate-600/50 flex items-center justify-center hover:bg-[#262c42]"><ChevronDown className="w-4 h-4 text-slate-300" /></button>
                  <input
                    value={mines}
                    onChange={(e) => { const n = Math.min(24, Math.max(1, parseInt(e.target.value.replace(/\D/g, '')) || 1)); setMines(n); }}
                    className="w-12 text-center bg-[#1f2436] border border-slate-600/50 rounded-md py-1 text-sm font-bold text-slate-100 outline-none focus:border-[#f7931e]"
                  />
                  <button onClick={() => setMines((m) => Math.min(24, m + 1))} className="w-7 h-7 rounded-md bg-[#1f2436] border border-slate-600/50 flex items-center justify-center hover:bg-[#262c42]"><ChevronUp className="w-4 h-4 text-slate-300" /></button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {MINE_PRESETS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMines(m)}
                    className={`py-1.5 rounded-md text-xs font-bold border transition-colors ${mines === m ? 'bg-rose-600 text-white border-rose-500' : 'bg-[#1f2436] text-slate-300 border-slate-600/50 hover:bg-[#262c42]'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Stat: potential */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-[#1f2436] border border-slate-600/40 py-2">
                <p className="text-[9px] uppercase tracking-widest text-slate-400">Gems</p>
                <p className="text-sm font-bold tabular-nums text-emerald-400">{safe}</p>
              </div>
              <div className="rounded-lg bg-[#1f2436] border border-slate-600/40 py-2">
                <p className="text-[9px] uppercase tracking-widest text-slate-400">Max Win</p>
                <p className="text-sm font-bold tabular-nums text-[#f7931e]">{multiplierFor(safe, mines).toFixed(2)}x</p>
              </div>
              <div className="rounded-lg bg-[#1f2436] border border-slate-600/40 py-2">
                <p className="text-[9px] uppercase tracking-widest text-slate-400">Payout</p>
                <p className="text-sm font-bold tabular-nums text-slate-100">${(bet * multiplierFor(safe, mines)).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Status / multiplier ticker */}
        {phase === 'playing' && (
          <div className="rounded-xl bg-[#151929] border border-slate-700/50 p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Current</p>
              <p className="text-xl font-black tabular-nums text-emerald-400">{currentMult.toFixed(2)}x</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Win</p>
              <p className="text-base font-bold tabular-nums text-slate-100">${(bet * pot).toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Next</p>
              <p className="text-base font-bold tabular-nums text-[#f7931e]">{nextMult.toFixed(2)}x</p>
            </div>
          </div>
        )}

        {/* Message */}
        <div className="rounded-lg bg-[#151929] border border-slate-700/50 py-2 text-center">
          <span className="text-xs font-semibold text-slate-300">{message}</span>
        </div>

        {/* Action buttons */}
        {phase === 'idle' && (
          <button
            onClick={start}
            disabled={balance < bet}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#f7931e] to-[#ff6a00] text-[#0b0e1a] text-base font-black shadow-lg shadow-[#f7931e]/20 hover:brightness-110 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            <Pickaxe className="w-5 h-5" /> BET ${bet.toFixed(2)} · {mines} MINES
          </button>
        )}

        {phase === 'playing' && (
          <button
            onClick={cashout}
            disabled={revealed.size === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-base font-black shadow-lg hover:brightness-110 disabled:opacity-40 transition-all"
          >
            CASH OUT ${(bet * pot).toFixed(2)}
          </button>
        )}

        {isOver && (
          <button
            onClick={newGame}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#f7931e] to-[#ff6a00] text-[#0b0e1a] text-base font-black shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" /> NEW GAME
          </button>
        )}
      </main>
    </div>
  );
}