import React, { useState } from 'react';
import GameAssetLoader from '@/components/GameAssetLoader';
import { CROWN_COINS_ASSETS, GAME_BG } from '@/lib/gameAssets';
import GameTitleBar from '@/components/GameTitleBar';
import BackButton from '@/components/BackButton';
import CrownCoinsMachine from '@/components/crowncoins/CrownCoinsMachine';
import GameDesktopPanel from '@/components/GameDesktopPanel';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { Wallet, Volume2, VolumeX } from 'lucide-react';
import AnimatedNumber from '@/components/AnimatedNumber';
import { useMute } from '@/lib/soundMute';

export default function CrownCoins() {
  const { balance } = useCasinoBalance();
  const [loaded, setLoaded] = useState(false);
  const [muted, toggleMute] = useMute();
  return (
    <div
      className="h-screen overflow-hidden flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${GAME_BG.crownCoins})` }}
    >
      {!loaded && <GameAssetLoader title="Crown Coins" assets={CROWN_COINS_ASSETS} bgImage={GAME_BG.crownCoins} onDone={() => setLoaded(true)} />}
      <header className="shrink-0 z-20 backdrop-blur-xl">
        <GameTitleBar
          title="Crown Coins"
          left={<BackButton />}
          right={
            <>
              <span
                id="game-balance-chip"
                className="flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[11px] font-bold tabular-nums text-yellow-100"
                style={{ border: '1px solid rgba(214,178,98,0.45)', background: 'rgba(20,17,13,0.6)' }}
              >
                <Wallet className="w-3.5 h-3.5 text-yellow-300" />
                <AnimatedNumber value={Number(balance || 0)} prefix="$" />
              </span>
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
          maxWidth="max-w-none"
        />
      </header>
      <div className="flex-1 min-h-0 overflow-hidden w-full lg:max-w-[560px] xl:max-w-[620px] lg:mx-auto">
        <CrownCoinsMachine />
      </div>
      <GameDesktopPanel gameId="crown-coins" title="Crown Coins Rounds" />
    </div>
  );
}