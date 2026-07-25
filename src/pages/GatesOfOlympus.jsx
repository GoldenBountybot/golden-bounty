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
        bgImage="https://images.unsplash.com/photo-1618005182384-a3710d5b9a35?auto=format&fit=crop&w=1200&q=70"
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#3a1060' }}>
      <GameHeader title="Gates of Olympus" balance={Number(balance || 0)} />
      <GatesMachine />
    </div>
  );
}