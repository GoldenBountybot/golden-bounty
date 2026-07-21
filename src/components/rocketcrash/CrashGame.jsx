import React from 'react';
import { useCrashGame } from './useCrashGame';
import CrashGraph from './CrashGraph';
import BetPanel from './BetPanel';
import HistoryBar from './HistoryBar';
import LiveBets from './LiveBets';
import GameHeader from '@/components/GameHeader';
import PlayerHistoryButton from '@/components/PlayerHistoryButton';

export default function CrashGame() {
  const g = useCrashGame();

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