import React, { useState } from 'react';
import GameLoadingScreen from '@/components/GameLoadingScreen';
import GameHeader from '@/components/GameHeader';
import CrownCoinsMachine from '@/components/crowncoins/CrownCoinsMachine';
import { useCasinoBalance } from '@/lib/useCasinoBalance';

export default function CrownCoins() {
  const { balance } = useCasinoBalance();
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="min-h-screen">
      {!loaded && <GameLoadingScreen title="Crown Coins" emoji="👑" onDone={() => setLoaded(true)} />}
      <GameHeader title="Crown Coins" balance={Number(balance || 0)} />
      <CrownCoinsMachine />
    </div>
  );
}