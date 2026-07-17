import React from 'react';
import { useCrashGame } from './useCrashGame';
import CrashGraph from './CrashGraph';
import BetPanel from './BetPanel';
import HistoryBar from './HistoryBar';
import LiveBets from './LiveBets';
import { Wallet } from 'lucide-react';

export default function CrashGame() {
  const g = useCrashGame();

  return (
    <div className="flex flex-col gap-3 max-w-5xl mx-auto">
      <div className="flex items-center justify-between rounded-xl bg-black/50 border border-indigo-900/40 px-4 py-2.5">
        <span className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-indigo-200/70 uppercase">
          <Wallet className="w-4 h-4 text-indigo-300" /> Your Balance
        </span>
        <span className="text-xl font-black italic tabular-nums text-yellow-100" style={{ fontFamily: 'Georgia, serif' }}>
          ${g.balance.toFixed(2)}
        </span>
      </div>

      <HistoryBar history={g.history} />

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
            onCashOut={g.cashOut}
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
    </div>
  );
}