import React from 'react';
import GameHeader from '@/components/GameHeader';
import CrashGame from '@/components/rocketcrash/CrashGame';

export default function RocketCrash() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-950">
      <GameHeader title="Rocket Crash" accent="text-indigo-200" border="border-indigo-700/40" />
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4">
        <CrashGame />
      </main>
    </div>
  );
}