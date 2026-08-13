import React, { useState, useEffect } from "react";
import WildBountyMachine from "@/components/wildbounty/WildBountyMachine";
import GameAssetLoader from "@/components/GameAssetLoader";
import { WILD_BOUNTY_ASSETS, GAME_BG } from "@/lib/gameAssets";
import BackButton from "@/components/BackButton";
import GameTitleBar from "@/components/GameTitleBar";
import { useCasinoBalance } from "@/lib/useCasinoBalance";
import { Wallet, Volume2, VolumeX } from "lucide-react";
import { startBackgroundMusic, stopBackgroundMusic } from "@/components/wildbounty/sounds";
import { useMute } from "@/lib/soundMute";

export default function SlotGame() {
  const [loaded, setLoaded] = useState(false);
  const { balance } = useCasinoBalance();
  const [muted, toggleMute] = useMute();

  // Start background music only after the loading screen finishes, and stop
  // it when leaving the game so it doesn't keep playing on other pages.
  useEffect(() => {
    if (loaded) startBackgroundMusic();
    return () => { stopBackgroundMusic(); };
  }, [loaded]);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage:
          'url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/25cab1181_file_00000000b50c8230a0ebee9ef44b2ebe.png)',
        backgroundAttachment: 'fixed',
      }}
    >
      {!loaded && <GameAssetLoader title="Wild Bounty" assets={WILD_BOUNTY_ASSETS} bgImage={GAME_BG.wildBounty} onDone={() => setLoaded(true)} />}
      <header className="sticky top-0 z-20 bg-stone-950/90 backdrop-blur-xl border-b border-amber-700/30">
        <GameTitleBar
          title="Wild Bounty Showdown"
          left={<BackButton />}
          right={
            <>
              <div
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md"
                style={{ border: '1px solid rgba(214,178,98,0.6)', background: 'rgba(20,17,13,0.7)' }}
              >
                <Wallet className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[11px] font-black tabular-nums text-amber-100" style={{ fontFamily: 'Georgia, serif' }}>
                  ${balance.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleMute}
                className="inline-flex items-center justify-center w-9 h-9 rounded-md active:scale-90 transition-transform"
                style={{ border: '1px solid rgba(214,178,98,0.6)', background: 'rgba(20,17,13,0.7)' }}
                aria-label={muted ? "Unmute" : "Mute"}
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

      <main className="w-full max-w-none lg:max-w-[520px] mx-auto px-0 py-0">
        <WildBountyMachine />
      </main>
    </div>
  );
}