import React, { useState } from 'react';
import GameLoadingScreen from '@/components/GameLoadingScreen';
import BackButton from '@/components/BackButton';
import BigBrownMachine from '@/components/bigbrown/BigBrownMachine';

export default function BigBrown() {
  const [ready, setReady] = useState(false);

  if (!ready) {
    return <GameLoadingScreen title="Big Brown" onDone={() => setReady(true)} />;
  }

  return (
    <div className="min-h-screen" style={{ background: '#00122e' }}>
      <div className="absolute top-2 left-2 z-30">
        <BackButton href="/" label="" />
      </div>
      <BigBrownMachine />
    </div>
  );
}