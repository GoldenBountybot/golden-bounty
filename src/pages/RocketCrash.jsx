import React, { useState } from 'react';
import GameLoadingScreen from '@/components/GameLoadingScreen';
import CrashGame from '@/components/rocketcrash/CrashGame';

export default function RocketCrash() {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-950">
      {!loaded && <GameLoadingScreen title="Aviator" emoji="🚀" onDone={() => setLoaded(true)} />}
      <main className="max-w-5xl mx-auto px-3 sm:px-4 pt-0 pb-4">
        <CrashGame />
      </main>
    </div>
  );
}