import React from 'react';
import { useWildBounty } from './useWildBounty';
import { REEL_ROWS } from './symbols';
import Reel from './Reel';
import MultiplierBanner from './MultiplierBanner';
import ControlPanel from './ControlPanel';
import { Boxes, Coins, Trophy } from 'lucide-react';
import FreeSpinStart from './FreeSpinStart';
import WesternFrame from './WesternFrame';

function StatBox({ icon: Icon, label, value }) {
  return (
    <WesternFrame className="flex-1 flex items-center gap-1.5 px-2 py-1.5">
      <Icon className="w-3.5 h-3.5 text-yellow-400" />
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-[8px] text-amber-300/80 tracking-[0.15em] uppercase">{label}</span>
        <span className="text-xs font-bold italic text-yellow-100 tabular-nums truncate">{value}</span>
      </div>
    </WesternFrame>
  );
}

export default function WildBountyMachine() {
  const g = useWildBounty();

  return (
    <div
      className="w-full max-w-md mx-auto rounded-2xl relative p-[4px]"
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
      <div className="pt-3 px-3">
        <MultiplierBanner multIndex={g.multIndex} />
      </div>

      {/* Decorative copper frame */}
      <div
        className="relative mx-1 my-1 rounded-2xl p-2.5 shadow-2xl shadow-amber-900/50"
        style={{
          backgroundImage: 'url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e59ed50a1_Gemini_Generated_Image_xh3y3nxh3y3nxh3y.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
      {/* Reel board — wooden shield */}
      <div
        className="relative px-3 py-3 rounded-xl border-2 border-amber-800/60 shadow-2xl shadow-amber-900/40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(20,14,8,0.6), rgba(20,14,8,0.68)), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/a27239dfb_InShot_20260715_212512483.jpg)',
          backgroundSize: 'cover, 185%',
          backgroundPosition: 'center, center',
          backgroundRepeat: 'no-repeat, no-repeat',
        }}
      >
        {/* 3600 WAYS side labels */}
        <span className="absolute left-0.5 top-1/2 -translate-y-1/2 -rotate-90 text-[7px] font-bold text-amber-600/60 tracking-[0.2em] whitespace-nowrap">3600 WAYS</span>
        <span className="absolute right-0.5 top-1/2 -translate-y-1/2 rotate-90 text-[7px] font-bold text-amber-600/60 tracking-[0.2em] whitespace-nowrap">3600 WAYS</span>

        {/* Grid — 24 cells (3-4-5-5-4-3), centered diamond */}
        <div className="grid grid-cols-6 gap-1 px-4 items-center">
          {g.grid.map((reel, ri) => (
            <Reel
              key={ri}
              reelIndex={ri}
              rowCount={REEL_ROWS[ri]}
              symbols={reel}
              spinning={!g.stoppedReels.has(ri)}
              speed={g.turbo ? 0.15 : 0.3}
              winningPositions={g.winningPositions}
              goldFrames={g.goldFrames}
              shatteringPositions={g.shattering}
              cascading={g.cascading}
              cascadePositions={g.cascadePositions}
            />
          ))}
        </div>

        {/* FEATURE BUY — wooden plaque on the right */}
        <button
          className="absolute -right-2 top-1/2 -translate-y-1/2 rounded-md bg-gradient-to-b from-amber-700 to-amber-950 border border-amber-500/50 px-1.5 py-2 text-[8px] font-bold text-amber-100 tracking-wider shadow-md writing-mode-vertical"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          title="Feature Buy"
        >
          FEATURE BUY
        </button>

        {/* Win / message banner */}
        <WesternFrame glow className="mt-3 mx-1 py-1.5 text-center">
          <span className="font-black italic text-lg text-yellow-300 drop-shadow-[0_0_6px_rgba(255,200,0,0.7)]" style={{ fontFamily: 'Georgia, serif' }}>
            {g.message}
          </span>
        </WesternFrame>
      </div>
      </div>
      {/* /Decorative copper frame */}

      {/* Free spins badge */}
      {g.freeSpins > 0 && (
        <WesternFrame glow className="flex items-center justify-center gap-1.5 py-1 mx-2">
          <span className="text-xs font-bold italic text-amber-200 tracking-[0.15em]" style={{ fontFamily: 'Georgia, serif' }}>
            ★ FREE SPINS: {g.freeSpins} ★
          </span>
        </WesternFrame>
      )}

      {/* Stats bar */}
      <div className="flex gap-2 px-2">
        <StatBox icon={Boxes} label="BALANCE" value={`$${g.balance.toFixed(2)}`} />
        <StatBox icon={Coins} label="BET" value={`$${g.bet.toFixed(2)}`} />
        <StatBox icon={Trophy} label="WIN" value={`$${g.lastWin.toFixed(2)}`} />
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

      <button
        onClick={g.reset}
        className="text-[10px] italic text-amber-600/80 hover:text-amber-300 tracking-[0.2em] uppercase mx-auto mb-2"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        Reset Balance
      </button>

      {g.showFreeSpinStart && !g.spinning && (
        <FreeSpinStart count={g.freeSpins} onStart={g.startFreeSpins} />
      )}
      </div>
    </div>
  );
}