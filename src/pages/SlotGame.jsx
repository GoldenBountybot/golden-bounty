import React, { useState } from "react";
import GameLoadingScreen from "@/components/wildbounty/GameLoadingScreen";

// The real Wild Bounty Showdown design image — shown full-screen as-is.
// Game reels and controls will be designed and layered on top later.
const BG_URL =
  "https://media.base44.com/images/public/6a5698edffaa42a5b6637776/44a9620cb_file_00000000d61882118b320ab415d2553b.png";

export default function SlotGame() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="fixed inset-0 w-full h-full overflow-hidden"
      style={{
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#3D2B1F",
      }}
    >
      {!loaded && <GameLoadingScreen onDone={() => setLoaded(true)} />}
    </div>
  );
}