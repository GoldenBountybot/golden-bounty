import React, { useState } from "react";
import WildBountyMachine from "@/components/wildbounty/WildBountyMachine";
import GameLoadingScreen from "@/components/wildbounty/GameLoadingScreen";

// The real Wild Bounty Showdown design image — used as the full-screen
// background so the chrome (multiplier ribbon, 3600 WAYS, FEATURE BUY, WILD
// horseshoe ribbon) looks exactly like the original. Only the functional
// reels and controls are overlaid on top.
const BG_URL =
  "https://media.base44.com/images/public/6a5698edffaa42a5b6637776/b47b352e1_file_00000000fae88211b33082a7d85b10ed.png";

export default function SlotGame() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: "100dvh",
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#1a120b",
      }}
    >
      {!loaded && <GameLoadingScreen onDone={() => setLoaded(true)} />}

      <WildBountyMachine />
    </div>
  );
}