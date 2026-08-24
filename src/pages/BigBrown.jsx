import React, { useState, useEffect } from 'react';
import GameAssetLoader from '@/components/GameAssetLoader';
import { BIG_BROWN_ASSETS, GAME_BG } from '@/lib/gameAssets';
import GameHeader from '@/components/GameHeader';
import BigBrownMachine from '@/components/bigbrown/BigBrownMachine';
import GameDesktopPanel from '@/components/GameDesktopPanel';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { startBgMusic, stopBgMusic } from '@/lib/bigBrownBackgroundMusic';

export default function BigBrown() {
  const [ready, setReady] = useState(false);
  const { balance } = useCasinoBalance();

  useEffect(() => {
    startBgMusic();
    return () => stopBgMusic();
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/9a6ce937b_generated_image.png'), linear-gradient(to bottom, #00122e, #02091a)",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {!ready && (
        <GameAssetLoader
          title="Big Brown"
          assets={BIG_BROWN_ASSETS}
          onDone={() => setReady(true)}
          bgImage={GAME_BG.bigBrown}
        />
      )}
      <div className="lg:max-w-[620px] xl:max-w-[700px] lg:mx-auto">
        <GameHeader title="Big Brown" balance={Number(balance || 0)} />
        <BigBrownMachine />
      </div>
      <GameDesktopPanel gameId="big-brown" title="Big Brown Rounds" />
    </div>
  );
}