import React from 'react';
import GameHeader from '@/components/GameHeader';
import CrownCoinsMachine from '@/components/crowncoins/CrownCoinsMachine';
import { useCasinoBalance } from '@/lib/useCasinoBalance';

export default function CrownCoins() {
  const { balance } = useCasinoBalance();
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-amber-950/40 to-stone-950">
      <GameHeader title="Crown Coins" balance={Number(balance || 0)} />
      <main className="max-w-md mx-auto py-4">
        <CrownCoinsMachine />
      </main>
    </div>
  );
}