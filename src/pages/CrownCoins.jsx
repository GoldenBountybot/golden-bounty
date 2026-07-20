import React from 'react';
import GameHeader from '@/components/GameHeader';
import CrownCoinsMachine from '@/components/crowncoins/CrownCoinsMachine';
import { useCasinoBalance } from '@/lib/useCasinoBalance';

export default function CrownCoins() {
  const { balance } = useCasinoBalance();
  return (
    <div className="min-h-screen">
      <GameHeader title="Crown Coins" balance={Number(balance || 0)} />
      <CrownCoinsMachine />
    </div>
  );
}