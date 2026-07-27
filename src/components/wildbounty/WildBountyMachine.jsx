import React from 'react';
import { useWildBounty } from './useWildBounty';
import { REEL_ROWS } from './symbols';
import Reel from './Reel';

import ControlPanel from './ControlPanel';
import { Boxes, Coins, Trophy } from 'lucide-react';
import FreeSpinStart from './FreeSpinStart';
import FlyingMultiplier from './FlyingMultiplier';
import WesternFrame from './WesternFrame';
import PlaqueBanner from './PlaqueBanner';
import WesternStatBanner from './WesternStatBanner';
import BoardTopBanner from './BoardTopBanner';

export default function WildBountyMachine() {
  const g = useWildBounty();

  return (
    <div
      className="w-full mx-auto relative"
    >
      <div
        className="flex flex-col gap-2 overflow-hidden relative"
        style={{
          backgroundImage: 'url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/25cab1181_file_00000000b50c8230a0ebee9ef44b2ebe.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
{/* Decorative steer-skull banner on top of the board (black bg keyed out) */}
<div className="flex justify-center mx-1 -mb-28 relative z-20">
  <BoardTopBanner />
</div>

{/* Reel board — bronze western frame (web asset) around symbols */}
      <div
        className="relative mx-0 my-0"
        style={{
          paddingTop: '7%',
          paddingBottom: '13%',
          paddingLeft: '0%',
          paddingRight: '0%',
        }}
      >


        {/* Grid — 24 cells (3-4-5-5-4-3), centered diamond */}
        <div className="grid grid-cols-6 gap-0 px-0 items-center mt-0 mb-0">
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

      {/* Win / message banner */}
      <PlaqueBanner glow className="-mt-24 mx-1 py-1 text-center relative z-30">
        <span className="font-black italic text-lg text-yellow-300 drop-shadow-[0_0_6px_rgba(255,200,0,0.7)]" style={{ fontFamily: 'Rye, Georgia, serif' }}>
          {g.message}
        </span>
      </PlaqueBanner>

      {/* Free spins badge */}
      {g.freeSpins > 0 && (
        <WesternFrame glow className="flex items-center justify-center gap-1.5 py-1 mx-2">
          <span className="text-xs font-bold italic text-amber-200 tracking-[0.15em]" style={{ fontFamily: 'Rye, Georgia, serif' }}>
            ★ FREE SPINS: {g.freeSpins} ★
          </span>
        </WesternFrame>
      )}

      {/* Stats bar */}
      <div className="flex gap-2 px-2">
        <WesternStatBanner icon={Boxes} label="BALANCE" value={`$${g.balance.toFixed(2)}`} />
        <WesternStatBanner icon={Coins} label="BET" value={`$${g.bet.toFixed(2)}`} />
        <WesternStatBanner icon={Trophy} label="WIN" value={`$${g.lastWin.toFixed(2)}`} />
      </div>

      {/* Controls */}
      <ControlPanel
        betIndex={g.betIndex}
        setBetIndex={g.setBetIndex}
        spinning={g.spinning}
        spin={g.spin}
        turbo={g.turbo}
        setTurbo={g.setTurbo}
        autoSpin={g.autoSpin}
        setAutoSpin={g.setAutoSpin}
      />

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
    </div>
  );
}