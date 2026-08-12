import React from 'react';
import BackButton from '@/components/BackButton';
import { Wallet, Volume2, VolumeX } from 'lucide-react';
import AnimatedNumber from '@/components/AnimatedNumber';
import { useMute } from '@/lib/soundMute';

// Compact single-row header for Big Brown: back button, inline title,
// balance chip and sound toggle all on one line.
export default function BigBrownHeader({ balance }) {
  const hasBalance = typeof balance === 'number';
  const [muted, toggleMute] = useMute();

  return (
    <header
      className="sticky top-0 z-20 backdrop-blur-xl"
      style={{ background: 'rgba(10,9,8,0.78)', borderBottom: '1px solid rgba(214,178,98,0.22)' }}
    >
      <div className="flex items-center gap-2 px-2 py-1">
        <BackButton />
        <span
          className="text-[13px] font-black italic whitespace-nowrap"
          style={{
            fontFamily: 'Rye, Georgia, serif',
            background: 'linear-gradient(to bottom,#f5c542,#8b5a2b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Big Brown
        </span>
        <div className="flex-1" />
        {hasBalance && (
          <span
            id="game-balance-chip"
            className="flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[11px] font-bold tabular-nums text-yellow-100"
            style={{ border: '1px solid rgba(214,178,98,0.45)', background: 'rgba(20,17,13,0.6)' }}
          >
            <Wallet className="w-3.5 h-3.5 text-yellow-300" />
            <AnimatedNumber value={balance} prefix="$" />
          </span>
        )}
        <button
          type="button"
          onClick={toggleMute}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md active:scale-90 transition-transform"
          style={{ border: '1px solid rgba(214,178,98,0.6)', background: 'rgba(20,17,13,0.7)' }}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX className="w-4 h-4 text-amber-300" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
        </button>
      </div>
    </header>
  );
}