import React, { useState } from 'react';
import GameAssetLoader from '@/components/GameAssetLoader';
import { CROWN_COINS_ASSETS, GAME_BG } from '@/lib/gameAssets';
import GameHeader from '@/components/GameHeader';
import CrownCoinsMachine from '@/components/crowncoins/CrownCoinsMachine';
import { useCasinoBalance } from '@/lib/useCasinoBalance';

export default function CrownCoins() {
  const { balance } = useCasinoBalance();
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="min-h-screen">
      {!loaded && <GameAssetLoader title="Crown Coins" assets={CROWN_COINS_ASSETS} bgImage={GAME_BG.crownCoins} onDone={() => setLoaded(true)} />}
      <GameHeader title="Crown Coins" balance={Number(balance || 0)} />
      <CrownCoinsMachine />
    </div>
  );
}