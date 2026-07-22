import React from 'react';
import BackButton from '@/components/BackButton';
import ShareButton from '@/components/ShareButton';
import GameTitleBar from '@/components/GameTitleBar';
import { Wallet } from 'lucide-react';
import AnimatedNumber from '@/components/AnimatedNumber';

// Shared header for casino game pages: a full-width western plaque with the
// game title centered, back button on the left, share on the right. Optional
// `balance` renders a wallet chip next to the share button.
export default function GameHeader({ title, balance }) {
  const hasBalance = typeof balance === 'number';
  return (
    <header
      className="sticky top-0 z-20 backdrop-blur-xl"
      style={{ background: 'rgba(10,9,8,0.78)', borderBottom: '1px solid rgba(214,178,98,0.22)' }}
    >
      <GameTitleBar
        title={title}
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
            <ShareButton />
          </>
        }
        padLeft={hasBalance ? 'pl-28' : 'pl-24'}
        padRight={hasBalance ? 'pr-28' : 'pr-24'}
      />
    </header>
  );
}