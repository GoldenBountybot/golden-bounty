import React, { useState } from 'react';
import GameLoadingScreen from '@/components/GameLoadingScreen';
import GameHeader from '@/components/GameHeader';
import BigBrownMachine from '@/components/bigbrown/BigBrownMachine';

export default function BigBrown() {
  const [ready, setReady] = useState(false);

  if (!ready) {
    return <GameLoadingScreen title="Big Brown" onDone={() => setReady(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-amber-950/30 to-stone-950">
      <GameHeader title="Big Brown" backHref="/" />
      <div className="pt-16">
        <BigBrownMachine />
      </div>
    </div>
  );
}