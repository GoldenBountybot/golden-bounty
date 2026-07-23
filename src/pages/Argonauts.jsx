import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ArgonautsMachine from '@/components/argonauts/ArgonautsMachine';
import BackButton from '@/components/BackButton';
import GameLoadingScreen from '@/components/GameLoadingScreen';
import { useCasinoBalance } from '@/lib/useCasinoBalance';

export default function Argonauts() {
  const [loading, setLoading] = useState(true);
  const { balance } = useCasinoBalance();

  useEffect(() => {
    base44.auth.me().catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <GameLoadingScreen />;

  return (
    <div className="min-h-screen bg-[#070d14] text-amber-50">
      {/* Sticky title bar */}
      <header
        className="sticky top-0 z-20 backdrop-blur-xl"
        style={{ background: 'rgba(7,13,20,0.82)', borderBottom: '1px solid rgba(214,178,98,0.25)' }}
      >
        <div className="max-w-5xl mx-auto px-3 py-2 flex items-center justify-between">
          <BackButton to="/" label="Lobby" />
          <div className="text-center">
            <h1
              className="text-lg sm:text-xl font-black tracking-wide"
              style={{ fontFamily: 'Georgia, serif', color: '#f5d77a', textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}
            >
              ARGONAUTS
            </h1>
            <p className="text-[10px] text-amber-200/60 tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>
              QUEST FOR THE GOLDEN FLEECE
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px]"
            style={{ border: '1px solid rgba(214,178,98,0.5)', background: 'rgba(20,17,13,0.6)' }}
          >
            <span className="text-[10px] text-amber-300/70" style={{ fontFamily: 'Georgia, serif' }}>BAL</span>
            <span className="text-sm font-black tabular-nums text-yellow-100" style={{ fontFamily: 'Georgia, serif' }}>
              ${balance.toFixed(2)}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-2 sm:px-4 py-3">
        <ArgonautsMachine />
      </main>
    </div>
  );
}