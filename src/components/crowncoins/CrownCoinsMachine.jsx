import React, { useState, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useGameSettings } from '@/lib/useGameSettings';
import { useLogActivity } from '@/lib/useLogActivity';
import { useToast } from '@/components/ui/use-toast';
import { SYMBOLS, PAYLINES, spinGrid, evaluateGrid, runBonus, symbolByKey } from '@/lib/crownCoinsEngine';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import { Coins, RotateCcw, Zap, X, Crown } from 'lucide-react';

const REEL_MS = 520;

function SymbolCell({ symKey, dim, win, spinning }) {
  const s = symbolByKey(symKey) || SYMBOLS[0];
  return (
    <div
      className="relative flex items-center justify-center rounded-md overflow-hidden"
      style={{
        border: `1px solid ${win ? '#ffd24a' : 'rgba(190,140,55,0.45)'}`,
        background: s.bg,
        boxShadow: win
          ? '0 0 14px rgba(255,210,80,0.85), inset 0 0 0 2px rgba(255,235,150,0.9)'
          : 'inset 0 1px 0 rgba(255,210,120,0.18), 0 1px 3px rgba(0,0,0,0.5)',
        transition: 'box-shadow .2s',
        opacity: dim ? 0.45 : 1,
      }}
    >
      <span
        className="select-none"
        style={{
          fontSize: '1.7rem',
          lineHeight: 1,
          filter: spinning ? 'blur(2px)' : 'none',
          color: s.text,
          fontFamily: s.key === 'bar' ? 'Rye, Georgia, serif' : 'inherit',
          fontWeight: s.key === 'bar' ? 800 : 400,
          textShadow: '0 1px 2px rgba(0,0,0,0.6)',
        }}
      >
        {s.emoji}
      </span>
      {win && (
        <span
          className="absolute inset-0 rounded-md pointer-events-none"
          style={{ boxShadow: 'inset 0 0 10px rgba(255,220,120,0.7)' }}
        />
      )}
    </div>
  );
}

export default function CrownCoinsMachine() {
  const { balance, setBalance } = useCasinoBalance();
  const { rtp, loading: sLoading, minBet, maxBet } = useGameSettings('crown-coins');
  const logActivity = useLogActivity();
  const { toast } = useToast();

  const [grid, setGrid] = useState(() => ['lemon', 'cherry', 'orange', 'bell', 'bar', 'plum', 'wild', 'coin', 'cherry']);
  const [spinning, setSpinning] = useState(false);
  const [winLines, setWinLines] = useState([]); // indices of cells on winning lines
  const [lastWin, setLastWin] = useState(0);
  const [bet, setBet] = useState(1);
  const [bonus, setBonus] = useState(null); // { cells, total, royal }
  const [revealStep, setRevealStep] = useState(0);
  const scrambleRef = useRef(null);

  const winSet = new Set(winLines);

  const doSpin = useCallback(async () => {
    if (spinning) return;
    if (bet <= 0) { toast({ title: 'Set a bet amount' }); return; }
    if (balance < bet) { toast({ title: 'Insufficient balance' }); return; }
    setSpinning(true);
    setWinLines([]);
    setLastWin(0);
    // deduct bet
    setBalance(b => Math.max(0, b - bet));

    // scramble animation
    let ticks = 0;
    clearInterval(scrambleRef.current);
    scrambleRef.current = setInterval(() => {
      setGrid(() => Array.from({ length: 9 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].key));
      ticks++;
    }, 70);

    setTimeout(async () => {
      clearInterval(scrambleRef.current);
      const result = spinGrid(rtp);
      setGrid(result);

      const { lines, totalMul, coins } = evaluateGrid(result);
      let win = totalMul * (bet / 5);

      // highlight winning cells
      const cells = [];
      lines.forEach(l => l.idxs.forEach(i => cells.push(i)));
      setWinLines(cells);

      // bonus trigger
      let bonusResult = null;
      if (coins >= 3) {
        bonusResult = runBonus(bet, rtp);
        win += bonusResult.total * bet;
      }

      if (win > 0) setBalance(b => b + win);
      setLastWin(win);
      setSpinning(false);
      if (bonusResult) {
        setBonus(bonusResult);
        setRevealStep(0);
      }
      logActivity('crown-coins', bet, win, win > 0 ? 'win' : 'loss');
      // analytics best-effort
      try { base44.analytics.track({ eventName: 'crown_coins_spin', properties: { bet, win: Math.round(win * 100) / 100, coins } }); } catch {}
    }, REEL_MS);
  }, [spinning, bet, balance, rtp, setBalance, logActivity, toast]);

  const closeBonus = () => { setBonus(null); setRevealStep(0); };

  const revealAll = () => setRevealStep(9);

  const decBet = () => setBet(b => Math.max(minBet || 1, +(b - 1).toFixed(2)));
  const incBet = () => setBet(b => Math.min(maxBet || 500, +(b + 1).toFixed(2)));

  return (
    <div className="flex flex-col items-center gap-3 px-2 pb-4">
      {/* Balance + last win banner */}
      <WesternFrame variant="glass" className="w-full max-w-md p-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-amber-200/70 italic" style={{ fontFamily: 'Georgia, serif' }}>Balance</span>
          <span className="text-lg font-black italic text-yellow-100 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${balance.toFixed(2)}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-amber-200/70 italic" style={{ fontFamily: 'Georgia, serif' }}>Last Win</span>
          <span className={`text-lg font-black italic tabular-nums ${lastWin > 0 ? 'text-emerald-300' : 'text-amber-100/50'}`} style={{ fontFamily: 'Georgia, serif' }}>+${lastWin.toFixed(2)}</span>
        </div>
      </WesternFrame>

      {/* Reel grid */}
      <WesternFrame glow className="w-full max-w-md p-3">
        <div className="grid grid-cols-3 gap-1.5">
          {grid.map((key, i) => (
            <SymbolCell key={i} symKey={key} spinning={spinning} win={winSet.has(i)} dim={winSet.size > 0 && !winSet.has(i)} />
          ))}
        </div>
        <p className="mt-2 text-center text-[10px] text-amber-200/60 italic" style={{ fontFamily: 'Georgia, serif' }}>
          3×3 · 5 Paylines · Wild 👑 substitutes · 3+ 🪙 triggers Royal Treasury
        </p>
      </WesternFrame>

      {/* Controls */}
      <WesternFrame variant="glass" className="w-full max-w-md p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={decBet} disabled={spinning} className="w-8 h-8 rounded-md bg-black/40 border border-amber-700/50 text-amber-100 text-lg font-black disabled:opacity-40">−</button>
          <div className="flex flex-col items-center min-w-[64px]">
            <span className="text-[9px] text-amber-200/70 italic" style={{ fontFamily: 'Georgia, serif' }}>BET</span>
            <span className="text-base font-black italic text-yellow-100 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${bet.toFixed(2)}</span>
          </div>
          <button onClick={incBet} disabled={spinning} className="w-8 h-8 rounded-md bg-black/40 border border-amber-700/50 text-amber-100 text-lg font-black disabled:opacity-40">+</button>
        </div>

        <button
          onClick={doSpin}
          disabled={spinning || sLoading}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-stone-950 font-black italic text-lg disabled:opacity-50"
          style={{ fontFamily: 'Georgia, serif', background: 'linear-gradient(to bottom,#f5d590,#e8a93a)', boxShadow: '0 2px 8px rgba(255,200,80,0.5)' }}
        >
          {spinning ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
          {spinning ? 'Spinning' : 'SPIN'}
        </button>
      </WesternFrame>

      {/* Paytable */}
      <WesternFrame variant="glass" className="w-full max-w-md p-3">
        <p className="text-[11px] font-black italic text-amber-200 mb-1.5" style={{ fontFamily: 'Georgia, serif' }}>Paytable (× bet/line)</p>
        <div className="grid grid-cols-4 gap-1.5">
          {SYMBOLS.map(s => (
            <div key={s.key} className="flex flex-col items-center gap-0.5 rounded-md px-1 py-1.5" style={{ background: s.bg, border: `1px solid ${s.ring}55` }}>
              <span className="text-xl" style={{ color: s.text, fontFamily: s.key === 'bar' ? 'Rye, Georgia, serif' : 'inherit', fontWeight: s.key === 'bar' ? 800 : 400 }}>{s.emoji}</span>
              <span className="text-[9px] font-bold italic text-amber-100/80" style={{ fontFamily: 'Georgia, serif' }}>
                {s.bonus ? 'BONUS' : `${s.pay}×`}
              </span>
            </div>
          ))}
        </div>
      </WesternFrame>

      {/* Bonus modal */}
      {bonus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <WesternFrame glow className="w-full max-w-md p-4 relative">
            <button onClick={closeBonus} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 border border-amber-700/50 flex items-center justify-center text-amber-100">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-amber-300" />
              <h3 className="text-lg font-black italic text-amber-200" style={{ fontFamily: 'Rye, Georgia, serif' }}>Royal Treasury</h3>
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <p className="text-center text-[10px] text-amber-200/70 italic mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              {bonus.royal ? 'Royal Coin ×1.5 boost active!' : 'Collect coins to claim the treasury'}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {bonus.cells.map((v, i) => {
                const revealed = revealStep > i;
                const isReel2 = i >= 6;
                return (
                  <div
                    key={i}
                    onClick={() => setRevealStep(s => Math.max(s, i + 1))}
                    className="aspect-square flex items-center justify-center rounded-md cursor-pointer"
                    style={{
                      border: `1px solid ${revealed && v ? (isReel2 ? '#ffd24a' : '#e8c873') : 'rgba(190,140,55,0.35)'}`,
                      background: revealed && v ? (isReel2 ? 'linear-gradient(135deg,#7a5210,#2a1a06)' : 'linear-gradient(135deg,#4a3416,#211608)') : 'rgba(0,0,0,0.4)',
                      boxShadow: revealed && v ? '0 0 10px rgba(255,210,80,0.6)' : 'none',
                    }}
                  >
                    {revealed && v ? (
                      <div className="flex flex-col items-center">
                        <span className="text-2xl">🪙</span>
                        <span className="text-[11px] font-black italic text-yellow-100" style={{ fontFamily: 'Georgia, serif' }}>{v}×</span>
                      </div>
                    ) : (
                      <Coins className="w-5 h-5 text-amber-700/50" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <button onClick={revealAll} className="px-3 py-1.5 rounded-md bg-black/40 border border-amber-700/50 text-amber-100 text-xs font-bold italic" style={{ fontFamily: 'Georgia, serif' }}>Reveal All</button>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-200/70 italic" style={{ fontFamily: 'Georgia, serif' }}>Total</span>
                <span className="text-xl font-black italic text-emerald-300 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>
                  ${(bonus.total * bet).toFixed(2)}
                </span>
              </div>
            </div>
            <button onClick={closeBonus} className="mt-3 w-full py-2 rounded-lg text-stone-950 font-black italic" style={{ fontFamily: 'Georgia, serif', background: 'linear-gradient(to bottom,#f5d590,#e8a93a)' }}>
              Collect
            </button>
          </WesternFrame>
        </div>
      )}
    </div>
  );
}