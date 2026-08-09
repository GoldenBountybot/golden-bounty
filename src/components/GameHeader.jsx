import React from 'react';
import BackButton from '@/components/BackButton';
import GameTitleBar from '@/components/GameTitleBar';
import { Wallet, Volume2, VolumeX } from 'lucide-react';
import AnimatedNumber from '@/components/AnimatedNumber';
import { useMute } from '@/lib/soundMute';

// Shared header for casino game pages: a full-width western plaque with the
// game title centered, back button on the left, share on the right. Optional
// `balance` renders a wallet chip next to the share button. A sound toggle
// mutes/unmutes every game's audio with a single tap.
export default function GameHeader({ title, balance }) {
  const hasBalance = typeof balance === 'number';
  const [muted, toggleMute] = useMute();
  return (
    <header
      className="sticky top-0 z-20 backdrop-blur-xl"
      style={{ background: 'rgba(10,9,8,0.78)', borderBottom: '1px solid rgba(214,178,98,0.22)' }}
    >
      <GameTitleBar
        title={title}
        maxWidth="max-w-7xl"
        left={<BackButton />}
        right={
          <>
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
               className="inline-flex items-center justify-center w-9 h-9 rounded-md active:scale-90 transition-transform"
               style={{ border: '1px solid rgba(214,178,98,0.6)', background: 'rgba(20,17,13,0.7)' }}
               aria-label={muted ? 'Unmute' : 'Mute'}
             >
               {muted
                 ? <VolumeX className="w-5 h-5 text-amber-300" />
                 : <Volume2 className="w-5 h-5 text-amber-300" />}
             </button>
            </>
            }
            padLeft={hasBalance ? 'pl-44' : 'pl-32'}
            padRight={hasBalance ? 'pr-44' : 'pr-32'}
      />
    </header>
  );
}