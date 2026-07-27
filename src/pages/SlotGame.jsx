import React, { useState } from "react";
import WildBountyMachine from "@/components/wildbounty/WildBountyMachine";
import GameLoadingScreen from "@/components/wildbounty/GameLoadingScreen";

export default function SlotGame() {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-full overflow-hidden" style={{ height: "100dvh", background: "#160d07" }}>
      {!loaded && <GameLoadingScreen onDone={() => setLoaded(true)} />}
      <WildBountyMachine />
    </div>
  );
}