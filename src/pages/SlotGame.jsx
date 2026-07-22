import React, { useState } from "react";
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
          icon={<img src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e0ebe2f88_InShot_20260722_150739877.jpg" alt="Wild Bounty" className="w-8 h-8 rounded-lg object-cover shrink-0" style={{ border: '1px solid rgba(214,178,98,0.6)' }} />}
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