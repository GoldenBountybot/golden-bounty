import React, { useState } from 'react';
import GameLoadingScreen from '@/components/GameLoadingScreen';
import SuperAceMachine from '@/components/superace/SuperAceMachine';

// "Full House Poker" page now hosts the SuperAce-style cascading card slot.
export default function FullHouse() {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <GameLoadingScreen title="JILI Super Ace" emoji="🃏" onDone={() => setLoaded(true)} />}
      <SuperAceMachine />
    </>
  );
}