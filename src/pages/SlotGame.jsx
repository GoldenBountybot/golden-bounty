import React, { useState } from "react";
import { Gamepad2 } from "lucide-react";
import WildBountyMachine from "@/components/wildbounty/WildBountyMachine";
import GameLoadingScreen from "@/components/wildbounty/GameLoadingScreen";
import BackButton from "@/components/BackButton";
import ShareButton from "@/components/ShareButton";
import GameTitleBar from "@/components/GameTitleBar";

export default function SlotGame() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-amber-950/40 to-stone-950">
      {!loaded && <GameLoadingScreen onDone={() => setLoaded(true)} />}
      <header className="sticky top-0 z-20 bg-stone-950/90 backdrop-blur-xl border-b border-amber-700/30">
        <GameTitleBar
          title="Wild Bounty Showdown"
          icon={<div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0"><Gamepad2 className="w-4 h-4 text-stone-950" /></div>}
          left={<BackButton />}
          right={<ShareButton />}
          maxWidth="max-w-4xl"
        />
      </header>

      <main className="max-w-4xl mx-auto px-1 py-0">
        <WildBountyMachine />
      </main>
    </div>
  );
}