import React from 'react';
import { useWildBounty } from './useWildBounty';
import { REEL_ROWS } from './symbols';
import Reel from './Reel';
import MultiplierBanner from './MultiplierBanner';
import ControlPanel from './ControlPanel';
import { Boxes, Coins, Trophy } from 'lucide-react';
import FreeSpinStart from './FreeSpinStart';
import FlyingMultiplier from './FlyingMultiplier';
import WesternFrame from './WesternFrame';
import PlaqueBanner from './PlaqueBanner';
import WesternStatBanner from './WesternStatBanner';

export default function WildBountyMachine() {
  const g = useWildBounty();

  return (
    <div
      className="w-full max-w-5xl mx-auto rounded-2xl relative p-[3px]"
      style={{
        background: 'linear-gradient(145deg, #e0b34a, #7a4f17 38%, #c8932e 68%, #5e3d12)',
        boxShadow: '0 0 0 2px #2e1d0a, 0 0 0 4px rgba(200,150,60,0.4), 0 16px 48px rgba(0,0,0,0.75)',
      }}
    >
      {/* corner studs */}
      <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_5px_rgba(255,210,100,0.9)]" />
      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_5px_rgba(255,210,100,0.9)]" />
      <span className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_5px_rgba(255,210,100,0.9)]" />
      <span className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_5px_rgba(255,210,100,0.9)]" />
      <div
        className="flex flex-col gap-2 rounded-[13px] overflow-hidden relative"
        style={{
          backgroundImage: 'linear-gradient(rgba(30,20,12,0.92), rgba(20,14,8,0.95)), url(https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
      {/* Multiplier banner */}
      <div className="pt-0.5 px-2">
        <MultiplierBanner multIndex={g.multIndex} />
      </div>

      {/* Reel board — bronze western frame (web asset) around symbols */}
      <div
        className="relative px-3 py-3 mx-0 my-0 rounded-2xl"
        style={{
          backgroundImage:
            'linear-gradient(rgba(20,14,8,0.3), rgba(20,14,8,0.4)), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/a416f3da8_generated_image.png)',
          backgroundSize: 'cover, cover',
          backgroundPosition: 'center, center',
          backgroundRepeat: 'no-repeat, no-repeat',
          boxShadow: '0 0 0 7px rgba(74,48,18,0.9), 0 0 0 11px rgba(200,150,60,0.6), 0 0 0 14px rgba(46,30,12,0.85), 0 0 0 16px rgba(120,80,30,0.5), 0 18px 52px rgba(0,0,0,0.85)',
        }}
      >
        {/* Copper frame rivets */}
        <span className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_5px_rgba(255,210,120,0.9)] z-20" />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_5px_rgba(255,210,120,0.9)] z-20" />
        <span className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_5px_rgba(255,210,120,0.9)] z-20" />
        <span className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_5px_rgba(255,210,120,0.9)] z-20" />


        {/* Grid — 24 cells (3-4-5-5-4-3), centered diamond */}
        <div className="grid grid-cols-6 gap-0 px-0 items-center mt-0 mb-0">
          {g.grid.map((reel, ri) => (
            <Reel
              key={ri}
              reelIndex={ri}
              rowCount={REEL_ROWS[ri]}
              symbols={reel}
              spinning={!g.stoppedReels.has(ri)}
              speed={g.anticipation && !g.stoppedReels.has(ri) ? (g.turbo ? 1.6 : 2.4) : (g.turbo ? 0.16 : 0.32)}
              anticipationGlow={g.anticipation && !g.stoppedReels.has(ri)}
              winningPositions={g.winningPositions}
              goldFrames={g.goldFrames}
              shatteringPositions={g.shattering}
              cascading={g.cascading}
              cascadePositions={g.cascadePositions}
              scatterGlow={g.scatterGlow}
            />
          ))}
        </div>

        {/* FEATURE BUY — wooden plaque on the right */}
        <button
          className="absolute -right-2 top-1/2 -translate-y-1/2 rounded-md bg-gradient-to-b from-amber-700 to-amber-950 border border-amber-500/50 px-1.5 py-2 text-[8px] font-bold italic text-amber-100 tracking-wider shadow-md writing-mode-vertical"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', fontFamily: 'Rye, Georgia, serif' }}
          title="Feature Buy"
        >
          FEATURE BUY
        </button>

        {/* Win / message banner */}
        <PlaqueBanner glow className="mt-2 mx-1 py-1 text-center">
          <span className="font-black italic text-lg text-yellow-300 drop-shadow-[0_0_6px_rgba(255,200,0,0.7)]" style={{ fontFamily: 'Rye, Georgia, serif' }}>
            {g.message}
          </span>
        </PlaqueBanner>
      </div>

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
          onComplete={g.clearFlyingMult}
        />
      )}
      </div>
    </div>
  );
}