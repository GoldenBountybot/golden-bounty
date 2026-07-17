import React from 'react';
import CrashGame from '@/components/rocketcrash/CrashGame';

export default function RocketCrash() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-950">
      <main className="max-w-5xl mx-auto px-3 sm:px-4 pt-0 pb-4">
        <CrashGame />
      </main>
    </div>
  );
}