import React from 'react';
import { useWildBounty } from './useWildBounty';
import { REEL_ROWS } from './symbols';
import Reel from './Reel';

import ControlPanel from './ControlPanel';
import FreeSpinStart from './FreeSpinStart';
import FeatureBuyConfirm from './FeatureBuyConfirm';
import WesternFrame from './WesternFrame';
import PlaqueBanner from './PlaqueBanner';
import InfoBar from './InfoBar';
import BoardTopBanner from './BoardTopBanner';
import FlyingMultiplier from './FlyingMultiplier';
import CountUp from './CountUp';

export default function WildBountyMachine() {
  const g = useWildBounty();
  // The centre multiplier lights up while symbols are matching (and stays lit
  // showing the achieved tier until the next spin resets the round).
  const lit = g.winningPositions.size > 0 || g.cascading || g.shattering.size > 0 || g.lastWin > 0;

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
<div className="flex justify-center mx-1 -mt-20 -mb-2 relative z-20 scale-110">
  <BoardTopBanner multIndex={g.multIndex} lit={lit} />
</div>

{/* Reel board — bronze western frame (web asset) around symbols */}
      <div
        className="relative mx-0 my-0 -mt-24"
        style={{
          backgroundImage: 'url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c1acaec26_file_000000001de88211868a1e08115c5695.png)',
          backgroundSize: '108% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
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

        {/* FEATURE BUY banner — click to buy 10 free spins */}
        <button
          type="button"
          onClick={g.buyFeature}
          disabled={g.spinning || g.showFreeSpinStart || g.showFeatureBuyConfirm}
          className="absolute z-40 select-none active:scale-95 transition-transform disabled:opacity-70"
          style={{
            right: '-15px',
            bottom: '11%',
            width: '27%',
            maxWidth: '205px',
            minWidth: '106px',
            height: 'auto',
            padding: 0,
            background: 'transparent',
            border: 'none',
            cursor: (g.spinning || g.showFreeSpinStart) ? 'not-allowed' : 'pointer',
          }}
        >
          <img
            src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/a422458cf_file_000000001fe0823080289c04ab45bfdf.png"
            alt="Feature Buy"
            className="block w-full h-auto"
            draggable={false}
          />
        </button>

      </div>

      {/* Win / message banner — shows a counting-up win amount while a round
          is paying, otherwise the status message */}
      <PlaqueBanner glow className="-mt-28 mx-auto py-1 text-center relative z-30 w-[94%]">
        <span
          className="wb-deep-gold text-lg sm:text-xl italic leading-none tracking-wide block w-full"
          style={{ fontFamily: 'Rye, Georgia, serif' }}
        >
          {g.lastWin > 0 ? <>WIN <CountUp value={g.lastWin} /></> : g.message}
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
      <div className="-mt-20 pb-8">
        <InfoBar balance={g.balance} bet={g.bet} win={g.lastWin} />

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
      </div>

      {g.showFreeSpinStart && !g.spinning && (
        <FreeSpinStart count={g.freeSpins} onStart={g.startFreeSpins} />
      )}

      {g.showFeatureBuyConfirm && (
        <FeatureBuyConfirm
          cost={g.featureCost}
          onStart={g.confirmFeatureBuy}
          onCancel={g.cancelFeatureBuy}
        />
      )}

      </div>

      {/* Flying multiplier — overlays the whole machine so it can fly from the
          top banner all the way down into the win banner, then the win amount
          counts up in the banner */}
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