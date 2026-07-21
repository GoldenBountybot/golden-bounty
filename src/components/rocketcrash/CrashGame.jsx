import React, { useState } from 'react';
import { useCrashGame } from './useCrashGame';
import CrashGraph from './CrashGraph';
import BetPanel from './BetPanel';
import HistoryBar from './HistoryBar';
import LiveBets from './LiveBets';
import GameHeader from '@/components/GameHeader';
import PlayerHistoryButton from '@/components/PlayerHistoryButton';
import { Coins } from 'lucide-react';

const FLY_MS = 1100;

export default function CrashGame() {
  const g = useCrashGame();
  const [flyouts, setFlyouts] = useState([]);

  const handleCashOut = (i, btn) => {
    const panel = g.bets[i];
    const win = panel ? +(panel.amount * g.multiplier).toFixed(2) : 0;
    g.cashOut(i);
    if (!btn || win <= 0) return;

    const r = btn.getBoundingClientRect();
    const chip = document.getElementById('game-balance-chip');
    const c = chip?.getBoundingClientRect();
    const fx = r.left + r.width / 2;
    const fy = r.top + r.height / 2;
    const tx = c ? c.left + c.width / 2 : fx;
    const ty = c ? c.top + c.height / 2 : fy;

    const id = Date.now() + '-' + i + '-' + Math.random();
    setFlyouts(prev => [...prev, { id, x: fx, y: fy, dx: tx - fx, dy: ty - fy, amount: win }]);

    // pulse the balance chip when the coin lands
    setTimeout(() => {
      if (chip) {
        chip.style.animation = 'none';
        // reflow to restart animation
        void chip.offsetWidth;
        chip.style.animation = 'balancePop 0.5s ease-out';
      }
      setFlyouts(prev => prev.filter(f => f.id !== id));
    }, FLY_MS);
  };

  return (
    <div className="flex flex-col gap-3 max-w-5xl mx-auto">
      <GameHeader title="Aviator" accent="text-indigo-200" border="border-indigo-700/40" balance={g.balance} />

      <div className="flex items-center justify-between gap-2">
        <HistoryBar history={g.history} />
        <PlayerHistoryButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
        <CrashGraph phase={g.phase} multiplier={g.multiplier} countdown={g.countdown} />

        <div className="hidden lg:block min-h-[300px]">
          <LiveBets bets={g.liveBets} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {g.bets.map((panel, i) => (
          <BetPanel
            key={i}
            index={i}
            panel={panel}
            phase={g.phase}
            multiplier={g.multiplier}
            balance={g.balance}
            onPlace={g.placeBet}
            onCancel={g.cancelBet}
            onCashOut={handleCashOut}
            onAmount={g.setAmount}
            onToggleAutoBet={g.toggleAutoBet}
            onToggleAutoCashout={g.toggleAutoCashout}
            onAutoCashout={g.setAutoCashout}
          />
        ))}
      </div>

      <div className="lg:hidden min-h-[260px]">
        <LiveBets bets={g.liveBets} />
      </div>

      {/* Cashout win flyouts — fixed overlay, pointer-events-none */}
      {flyouts.map(f => (
        <div
          key={f.id}
          className="fixed pointer-events-none z-50 flex items-center gap-1 rounded-full px-3 py-1 whitespace-nowrap"
          style={{
            left: f.x,
            top: f.y,
            background: 'linear-gradient(to bottom, #34d399, #059669)',
            border: '1.5px solid #a7f3d0',
            boxShadow: '0 4px 14px rgba(0,0,0,0.5), 0 0 12px rgba(52,211,153,0.6)',
            animation: `crashWinFly ${FLY_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards`,
            '--dx': f.dx + 'px',
            '--dy': f.dy + 'px',
          }}
        >
          <Coins className="w-4 h-4 text-yellow-200" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))' }} />
          <span className="text-base font-black italic text-white tabular-nums" style={{ fontFamily: 'Georgia, serif', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            +${f.amount.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}