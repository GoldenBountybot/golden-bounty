import React, { useState } from 'react';
import GameAssetLoader from '@/components/GameAssetLoader';
import { GATES_ASSETS, GAME_BG } from '@/lib/gameAssets';
import GameHeader from '@/components/GameHeader';
import GatesMachine from '@/components/gates/GatesMachine';
import GameDesktopPanel from '@/components/GameDesktopPanel';
import { useCasinoBalance } from '@/lib/useCasinoBalance';

export default function GatesOfOlympus() {
  const [ready, setReady] = useState(false);
  const { balance } = useCasinoBalance();

  if (!ready) {
    return (
      <GameAssetLoader
        title="Gates of Olympus"
        assets={GATES_ASSETS}
        onDone={() => setReady(true)}
        bgImage="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/1f0dcd8e1_file_00000000534882308373132046ad84c6.png"
      />
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/1f0dcd8e1_file_00000000534882308373132046ad84c6.png'), linear-gradient(to bottom, #3a1060, #1a0530)",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Faded background overlay — keeps the Olympus scene faint so symbols pop */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(10,4,28,0.12), rgba(10,4,28,0.38))' }} />
      <div className="relative lg:max-w-[520px] lg:mx-auto">
        <GameHeader title="Gates of Olympus" balance={Number(balance || 0)} />
        <GatesMachine />
      </div>
      <GameDesktopPanel gameId="gates-of-olympus" title="Gates Rounds" />
    </div>
  );
}