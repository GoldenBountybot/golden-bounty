import React from 'react';
import { useWildBounty } from './useWildBounty';
import { REEL_ROWS } from './symbols';
import Reel from './Reel';
import ControlPanel from './ControlPanel';
import FreeSpinStart from './FreeSpinStart';
import FlyingMultiplier from './FlyingMultiplier';

// The real Wild Bounty Showdown design is rendered as a full-screen
// background image (see SlotGame.jsx). This component overlays ONLY the
// functional parts: the animated reel grid over the board, and the control
// bar at the bottom. Everything else (multiplier ribbon, 3600 WAYS, FEATURE
// BUY, WILD horseshoe ribbon) comes from the background image.
export default function WildBountyMachine() {
  const g = useWildBounty();

  return (
    <div className="relative min-h-screen w-full">
      {/* Reels — overlaid on the board area of the background image */}
      <div
        className="absolute flex items-center justify-center"
        style={{ top: '13%', left: '13%', right: '13%', bottom: '38%' }}
      >
        <div className="grid grid-cols-6 gap-0.5 items-center w-full">
          {g.grid.map((reel, ri) => (
            <Reel
              key={ri}
              reelIndex={ri}
              rowCount={REEL_ROWS[ri]}
              symbols={reel}
              spinning={!g.stoppedReels.has(ri)}
              speed={g.anticipation && !g.stoppedReels.has(ri) ? (g.turbo ? 1.9 : 2.8) : (g.turbo ? 0.24 : 0.5)}
              anticipationGlow={g.anticipation && !g.stoppedReels.has(ri)}
              winningPositions={g.winningPositions}
              goldFrames={g.goldFrames}
              shatteringPositions={g.shattering}
              cascading={g.cascading}
              cascadePositions={g.cascadePositions}
              scatterGlow={g.scatterGlow}
              bulletHit={g.bulletHit}
              slow={g.cascadeSlow}
            />
          ))}
        </div>
      </div>

      {/* Free-spins badge */}
      {g.freeSpins > 0 && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-md text-[11px] font-black italic tracking-widest text-yellow-300"
          style={{ top: '8%', background: 'rgba(20,14,8,0.7)', border: '1px solid #C5A059', fontFamily: "'Rye',Georgia,serif" }}
        >
          ★ FREE SPINS: {g.freeSpins} ★
        </div>
      )}

      {/* Controls — chocolate dock covers the image's baked control row */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 px-2 pb-2 pt-6"
        style={{ top: '64%', background: 'linear-gradient(to bottom, rgba(42,28,18,0) 0%, rgba(42,28,18,0.85) 22%, #2a1c12 45%)' }}
      >
        <ControlPanel
          balance={g.balance}
          bet={g.bet}
          win={g.lastWin}
          betIndex={g.betIndex}
          setBetIndex={g.setBetIndex}
          spinning={g.spinning}
          spin={g.spin}
          turbo={g.turbo}
          setTurbo={g.setTurbo}
          autoSpin={g.autoSpin}
          setAutoSpin={g.setAutoSpin}
        />
      </div>

      {g.showFreeSpinStart && !g.spinning && (
        <FreeSpinStart count={g.freeSpins} onStart={g.startFreeSpins} />
      )}

      {g.flyingMult && (
        <FlyingMultiplier
          key={g.flyingMult.key}
          value={g.flyingMult.value}
          slow={g.flyingMult.slow}
          onComplete={g.clearFlyingMult}
        />
      )}
    </div>
  );
}