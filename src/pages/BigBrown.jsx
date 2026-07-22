import React, { useState } from 'react';
import GameLoadingScreen from '@/components/GameLoadingScreen';
import GameHeader from '@/components/GameHeader';
import BigBrownMachine from '@/components/bigbrown/BigBrownMachine';
import { useCasinoBalance } from '@/lib/useCasinoBalance';

export default function BigBrown() {
  const [ready, setReady] = useState(false);
  const { balance } = useCasinoBalance();

  if (!ready) {
    return (
      <GameLoadingScreen
        title="Big Brown"
        onDone={() => setReady(true)}
        bgImage="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/9a6ce937b_generated_image.png"
      />
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/9a6ce937b_generated_image.png'), linear-gradient(to bottom, #00122e, #02091a)",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <GameHeader title="Big Brown" balance={Number(balance || 0)} />
      <BigBrownMachine />
    </div>
  );
}