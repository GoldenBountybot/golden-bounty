import React, { useState } from 'react';
import GameLoadingScreen from '@/components/GameLoadingScreen';
import GameHeader from '@/components/GameHeader';
import GatesMachine from '@/components/gates/GatesMachine';
import { useCasinoBalance } from '@/lib/useCasinoBalance';

export default function GatesOfOlympus() {
  const [ready, setReady] = useState(false);
  const { balance } = useCasinoBalance();

  if (!ready) {
    return (
      <GameLoadingScreen
        title="Gates of Olympus"
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
      }}
    >
      {/* Faded background overlay — keeps the Olympus scene faint so symbols pop */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(10,4,28,0.55), rgba(10,4,28,0.78))' }} />
      <div className="relative z-10">
        <GameHeader title="Gates of Olympus" balance={Number(balance || 0)} />
        <GatesMachine />
      </div>
    </div>
  );
}