import React, { useState } from "react";
import WildBountyMachine from "@/components/wildbounty/WildBountyMachine";
import GameLoadingScreen from "@/components/wildbounty/GameLoadingScreen";
import BackButton from "@/components/BackButton";
import ShareButton from "@/components/ShareButton";
import GameTitleBar from "@/components/GameTitleBar";
import { useCasinoBalance } from "@/lib/useCasinoBalance";
import { Wallet } from "lucide-react";

export default function SlotGame() {
  const [loaded, setLoaded] = useState(false);
  const { balance } = useCasinoBalance();

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          'linear-gradient(rgba(15,11,8,0.28), rgba(15,11,8,0.42)), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/25cab1181_file_00000000b50c8230a0ebee9ef44b2ebe.png)',
      }}
    >
      {!loaded && <GameLoadingScreen onDone={() => setLoaded(true)} />}
      <header className="sticky top-0 z-20 bg-stone-950/90 backdrop-blur-xl border-b border-amber-700/30">
        <GameTitleBar
          title="Wild Bounty Showdown"
          icon={<img src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e0ebe2f88_InShot_20260722_150739877.jpg" alt="Wild Bounty" className="w-8 h-8 rounded-lg object-cover shrink-0" style={{ border: '1px solid rgba(214,178,98,0.6)' }} />}
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
              <ShareButton />
            </>
          }
          maxWidth="max-w-4xl"
        />
      </header>

      <main className="w-full px-0 py-0">
        <WildBountyMachine />
      </main>
    </div>
  );
}