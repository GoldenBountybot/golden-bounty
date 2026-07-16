import React from "react";
import { Gamepad2 } from "lucide-react";
import WildBountyMachine from "@/components/wildbounty/WildBountyMachine";
import BackButton from "@/components/BackButton";
import ShareButton from "@/components/ShareButton";

export default function SlotGame() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-amber-950/40 to-stone-950">
      <header className="sticky top-0 z-20 bg-stone-950/90 backdrop-blur-xl border-b border-amber-700/30">
        <div className="max-w-3xl mx-auto px-3 py-1.5 flex items-center gap-3">
          <BackButton />
          <div className="flex-1 flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-stone-950" />
            </div>
            <h1 className="text-base font-bold text-amber-200 font-serif italic" style={{ fontFamily: 'Georgia, serif' }}>
              Wild Bounty Showdown
            </h1>
          </div>
          <ShareButton />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-1 py-0">
        <WildBountyMachine />
      </main>
    </div>
  );
}