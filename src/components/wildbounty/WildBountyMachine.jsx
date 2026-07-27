import React from 'react';
import { useWildBounty } from './useWildBounty';
import { REEL_ROWS, MULTIPLIERS } from './symbols';
import Reel from './Reel';
import ControlPanel from './ControlPanel';
import FreeSpinStart from './FreeSpinStart';
import FlyingMultiplier from './FlyingMultiplier';

// ── Chocolate wood plank texture (dark-brown horizontal planks) ──
const CHOC_WOOD = {
  backgroundColor: '#3D2B1F',
  backgroundImage: [
    'repeating-linear-gradient(180deg, rgba(0,0,0,0.26) 0px, rgba(0,0,0,0.26) 2px, transparent 2px, transparent 44px)',
    'repeating-linear-gradient(90deg, rgba(255,210,150,0.045) 0px, rgba(255,210,150,0.045) 1px, transparent 1px, transparent 8px)',
    'linear-gradient(90deg, rgba(0,0,0,0.4), rgba(0,0,0,0) 14%, rgba(0,0,0,0) 86%, rgba(0,0,0,0.4))',
    'linear-gradient(180deg, #4a3424, #3D2B1F 30%, #34241a 70%, #2a1c12)',
  ].join(', '),
};

// Gold metallic edge (dark → gold → dark layered border)
const GOLD_EDGE = '0 0 0 2px #2a1c12, 0 0 0 4px #C5A059, 0 0 0 5px #2a1c12, 0 6px 18px rgba(0,0,0,0.7)';

const WESTERN = { fontFamily: "'Rye','Smokum',Georgia,serif" };

function WaysPlaque({ side }) {
  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 ${side === 'left' ? 'left-1' : 'right-1'} px-1.5 py-2 rounded-md text-center`}
      style={{
        ...CHOC_WOOD,
        boxShadow: '0 0 0 2px #2a1c12, 0 0 0 3px #C5A059, 0 0 0 4px #2a1c12, 0 3px 8px rgba(0,0,0,0.6)',
        writingMode: 'vertical-rl',
        textOrientation: 'mixed',
      }}
    >
      <span className="block text-[8px] font-black italic tracking-wider text-amber-300" style={WESTERN}>
        3600
      </span>
      <span className="block text-[8px] font-black italic tracking-wider text-amber-100" style={WESTERN}>
        WAYS
      </span>
    </div>
  );
}

function MultiplierRibbon({ multIndex }) {
  const start = Math.max(0, multIndex - 2);
  const end = Math.min(MULTIPLIERS.length, start + 5);
  const view = MULTIPLIERS.slice(start, end);
  const active = MULTIPLIERS[multIndex];

  return (
    <div className="relative">
      <div
        className="relative flex items-center justify-center gap-3 sm:gap-5 px-9 py-2 rounded-t-[30px]"
        style={{ ...CHOC_WOOD, borderBottom: '3px solid #1a1109', boxShadow: GOLD_EDGE }}
      >
        {view.map((m, i) => {
          const realIndex = start + i;
          const isActive = realIndex === multIndex;
          const isRed = m >= 512;
          return (
            <span
              key={realIndex}
              className="font-black italic transition-all"
              style={{
                ...WESTERN,
                fontSize: isActive ? '18px' : '13px',
                color: isRed ? '#B33025' : isActive ? '#E6D080' : '#9a7a3a',
                textShadow: isActive
                  ? isRed
                    ? '0 0 10px rgba(179,48,37,0.9), 0 1px 2px rgba(0,0,0,0.8)'
                    : '0 0 10px rgba(230,208,128,0.9), 0 1px 2px rgba(0,0,0,0.8)'
                  : '0 1px 2px rgba(0,0,0,0.7)',
                transform: isActive ? 'scale(1.18)' : 'none',
              }}
            >
              x{m}
            </span>
          );
        })}

        {/* gold studs along the arch */}
        {['left-2', 'right-2'].map((p) => (
          <span key={p} className={`absolute top-1.5 ${p} w-1.5 h-1.5 rounded-full`} style={{ background: 'radial-gradient(circle at 35% 30%, #ffe9a8, #C5A059 60%, #6b4a18)', boxShadow: '0 0 4px rgba(255,210,120,0.9)' }} />
        ))}
      </div>

      <WaysPlaque side="left" />
      <WaysPlaque side="right" />

      {/* big active multiplier floating above when > 1 */}
      {multIndex > 0 && (
        <div className="absolute inset-x-0 -top-7 flex items-center justify-center pointer-events-none">
          <span className="font-black italic text-3xl sm:text-4xl" style={{ ...WESTERN, color: '#E6D080', textShadow: '0 0 14px rgba(230,208,128,0.95), 0 2px 3px rgba(0,0,0,0.85)', animation: 'multBurst 0.5s ease-out' }}>
            x{active}
          </span>
        </div>
      )}
    </div>
  );
}

function FeatureBuyPlaque() {
  return (
    <button
      className="absolute right-1 top-1/2 -translate-y-1/2 z-20 px-1.5 py-2 rounded-md"
      style={{
        ...CHOC_WOOD,
        boxShadow: '0 0 0 2px #A9A9A9, 0 0 0 3px #C5A059, 0 0 0 4px #2a1c12, 0 3px 8px rgba(0,0,0,0.6)',
        writingMode: 'vertical-rl',
        textOrientation: 'mixed',
      }}
      title="Feature Buy"
    >
      <span className="block text-[8px] font-black italic tracking-widest text-yellow-400" style={WESTERN}>
        FEATURE BUY
      </span>
    </button>
  );
}

function WildHorseshoeRibbon({ message, lastWin }) {
  return (
    <div
      className="relative flex items-center gap-2 px-3 py-2 rounded-b-[18px]"
      style={{ ...CHOC_WOOD, borderTop: '3px solid #1a1109', boxShadow: GOLD_EDGE }}
    >
      {/* horseshoe at top center */}
      <span
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center"
        style={{ background: 'radial-gradient(circle at 35% 30%, #ffe9a8, #C5A059 55%, #6b4a18)', boxShadow: '0 0 8px rgba(230,208,128,0.8), 0 2px 4px rgba(0,0,0,0.6)' }}
      >
        <span className="text-[11px] font-black text-stone-900" style={WESTERN}>U</span>
      </span>

      {/* WILD portrait — circular frame with cowgirl */}
      <div
        className="relative w-12 h-12 shrink-0 rounded-full overflow-hidden"
        style={{ boxShadow: '0 0 0 2px #2a1c12, 0 0 0 4px #C5A059, 0 0 0 5px #2a1c12, 0 2px 6px rgba(0,0,0,0.6)' }}
      >
        <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, #6b4a2a, #3D2B1F)' }}>
          <span className="text-xl">🤠</span>
        </div>
        <span className="absolute bottom-0 inset-x-0 text-center text-[7px] font-black italic tracking-widest text-amber-300 bg-black/60" style={WESTERN}>
          WILD
        </span>
      </div>

      {/* text + win */}
      <div className="flex-1 min-w-0 flex flex-col leading-tight">
        <span className="text-[9px] font-black italic tracking-wider text-amber-200" style={{ ...WESTERN, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
          WITH GOLD FRAMED SYMBOL
        </span>
        <span className="text-[10px] font-bold italic text-amber-100/80 truncate" style={WESTERN}>
          {lastWin > 0 ? `WIN $${lastWin.toFixed(2)}` : message}
        </span>
      </div>
    </div>
  );
}

export default function WildBountyMachine() {
  const g = useWildBounty();

  return (
    <div className="w-full max-w-md mx-auto relative">
      {/* Top arched multiplier ribbon + 3600 WAYS */}
      <MultiplierRibbon multIndex={g.multIndex} />

      {/* Board body — chocolate wood, symbols in the middle */}
      <div
        className="relative px-2 py-3"
        style={{ ...CHOC_WOOD, boxShadow: '0 0 0 2px #2a1c12, 0 0 0 4px #C5A059, 0 0 0 5px #2a1c12, 0 8px 20px rgba(0,0,0,0.7)' }}
      >
        <FeatureBuyPlaque />

        {/* 6 reels — diamond grid 3-4-5-5-4-3, centered */}
        <div className="grid grid-cols-6 gap-0.5 items-center">
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

        {/* Free spins badge overlay */}
        {g.freeSpins > 0 && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md text-[10px] font-black italic tracking-widest text-yellow-300" style={{ ...CHOC_WOOD, boxShadow: '0 0 0 1px #C5A059', ...WESTERN }}>
            ★ FREE SPINS: {g.freeSpins} ★
          </div>
        )}
      </div>

      {/* Bottom horseshoe + WILD ribbon */}
      <WildHorseshoeRibbon message={g.message} lastWin={g.lastWin} />

      {/* Controls */}
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