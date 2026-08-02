import React, { useState } from 'react';
import GameAssetLoader from '@/components/GameAssetLoader';
import { SUPER_ACE_ASSETS } from '@/lib/gameAssets';
import SuperAceMachine from '@/components/superace/SuperAceMachine';

// "Full House Poker" page now hosts the SuperAce-style cascading card slot.
export default function FullHouse() {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <GameAssetLoader title="JILI Super Ace" assets={SUPER_ACE_ASSETS} onDone={() => setLoaded(true)} />}
      <SuperAceMachine />
    </>
  );
}