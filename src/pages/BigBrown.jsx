import React, { useState } from 'react';
import GameLoadingScreen from '@/components/GameLoadingScreen';
import GameHeader from '@/components/GameHeader';
import BigBrownMachine from '@/components/bigbrown/BigBrownMachine';
import { useCasinoBalance } from '@/lib/useCasinoBalance';

export default function BigBrown() {
  const [ready, setReady] = useState(false);
  const { balance } = useCasinoBalance();

  if (!ready) {
    return <GameLoadingScreen title="Big Brown" onDone={() => setReady(true)} />;
  }

  return (
    <div className="min-h-screen" style={{ background: '#00122e' }}>
      <GameHeader title="Big Brown" balance={Number(balance || 0)} />
      <BigBrownMachine />
    </div>
  );
}