import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import WildBountyMachine from "@/components/wildbounty/WildBountyMachine";
import WesternFrame from "@/components/wildbounty/WesternFrame";
import ShareButton from "@/components/ShareButton";

export default function SlotGame() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-amber-950/40 to-stone-950">
      <header className="sticky top-0 z-20 bg-stone-950/90 backdrop-blur-xl border-b border-amber-700/30">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-stone-300 hover:text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm italic tracking-wide">Lobby</span>
          </Link>
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

      <main className="max-w-md mx-auto px-3 py-4">
        <div className="text-center mb-3 flex flex-col items-center">
          <WesternFrame glow className="inline-block px-5 py-1.5 mb-1">
            <h2 className="text-xl font-black italic bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent" style={{ fontFamily: 'Georgia, serif' }}>
              Wild Bounty Showdown
            </h2>
          </WesternFrame>
          <p className="text-xs text-amber-400/80 italic tracking-[0.15em] uppercase" style={{ fontFamily: 'Georgia, serif' }}>
            3600 Ways · Multiplier Doubles Every Win
          </p>
        </div>
        <WildBountyMachine />
      </main>
    </div>
  );
}