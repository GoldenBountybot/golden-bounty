import React, { useState } from "react";
import WildBountyMachine from "@/components/wildbounty/WildBountyMachine";
import GameLoadingScreen from "@/components/wildbounty/GameLoadingScreen";
import BackButton from "@/components/BackButton";
import { useCasinoBalance } from "@/lib/useCasinoBalance";
import { Wallet } from "lucide-react";

// The real Wild Bounty Showdown design image — used as the full-screen
// background so the chrome (multiplier ribbon, 3600 WAYS, FEATURE BUY, WILD
// horseshoe ribbon) looks exactly like the original. Only the functional
// reels and controls are overlaid on top.
const BG_URL =
  "https://media.base44.com/images/public/6a5698edffaa42a5b6637776/44a9620cb_file_00000000d61882118b320ab415d2553b.png";

export default function SlotGame() {
  const [loaded, setLoaded] = useState(false);
  const { balance } = useCasinoBalance();

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#3D2B1F",
      }}
    >
      {!loaded && <GameLoadingScreen onDone={() => setLoaded(true)} />}

      {/* Floating back + balance — kept minimal so the image fills the screen */}
      <div className="absolute top-2 left-2 z-30">
        <BackButton />
      </div>
      <div
        className="absolute top-2.5 right-2 z-30 inline-flex items-center gap-1 px-2 py-1 rounded-md"
        style={{ border: "1px solid rgba(214,178,98,0.6)", background: "rgba(20,17,13,0.65)" }}
      >
        <Wallet className="w-3.5 h-3.5 text-amber-300" />
        <span className="text-[11px] font-black tabular-nums text-amber-100" style={{ fontFamily: "Georgia, serif" }}>
          ${balance.toFixed(2)}
        </span>
      </div>

      <WildBountyMachine />
    </div>
  );
}