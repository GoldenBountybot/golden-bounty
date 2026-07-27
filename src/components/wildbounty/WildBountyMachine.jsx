import React from 'react';
import { useWildBounty } from './useWildBounty';
import { REEL_ROWS, BETS } from './symbols';
import Reel from './Reel';
import FreeSpinStart from './FreeSpinStart';
import FlyingMultiplier from './FlyingMultiplier';
import { Zap, Minus, Plus, Play, Menu, Book, Coins, Trophy } from 'lucide-react';

// Generated Western props (transparent PNGs)
const SKULL =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/58f3dd4fe_generated_image.png';
const COWGIRL =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/2326ab8af_generated_image.png';
const REVOLVER =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/6aa224eb7_generated_image.png';
const MONEY =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/58272353f_generated_image.png';

const GOLD = '#e7b94e';
const goldText = {
  fontFamily: "'Rye', Georgia, serif",
  color: GOLD,
  textShadow: '0 1px 0 #fff6d8, 0 -1px 1px #5a3a06, 0 2px 2px rgba(0,0,0,0.8)',
};
const redText = {
  fontFamily: "'Rye', Georgia, serif",
  color: '#c72e2e',
  textShadow: '0 1px 0 #ffb3a6, 0 -1px 1px #4a0c04, 0 2px 2px rgba(0,0,0,0.8)',
};
const silverText = {
  fontFamily: "'Rye', Georgia, serif",
  color: '#eceef2',
  textShadow: '0 1px 0 #fff, 0 -1px 1px #3a3a44, 0 2px 2px rgba(0,0,0,0.85)',
  letterSpacing: 1,
};

// Dark walnut horizontal planks with grain + scratches
const WOOD_PLANK =
  'repeating-linear-gradient(180deg, rgba(0,0,0,0.5) 0, rgba(0,0,0,0.5) 2px, transparent 2px, transparent 34px), repeating-linear-gradient(90deg, rgba(255,220,160,0.06) 0, rgba(255,220,160,0.06) 1px, transparent 1px, transparent 6px), linear-gradient(180deg,#4a321e,#2d1a0d)';
const WOOD_FLAT =
  'repeating-linear-gradient(90deg, rgba(0,0,0,0.32) 0, rgba(0,0,0,0.32) 1px, transparent 1px, transparent 7px), linear-gradient(180deg,#3a2616,#1c1008)';
const FELT =
  'radial-gradient(ellipse at 50% 0%, #2f6b3f 0%, #1a5e3c 50%, #103a24 100%), repeating-linear-gradient(45deg, rgba(0,0,0,0.09) 0 2px, transparent 2px 4px)';

const FRAME = {
  border: '3px solid #8a5a12',
  borderRadius: 10,
  boxShadow:
    'inset 0 0 0 2px #d4af37, inset 0 0 0 4px #6b4a08, inset 0 2px 5px rgba(255,240,200,0.25), 0 6px 14px rgba(0,0,0,0.65)',
  background: 'linear-gradient(180deg,#3a2616,#1c1008)',
};

function Chain({ left }) {
  return (
    <div className="absolute top-0 flex flex-col items-center" style={{ left, height: '100%', zIndex: 5 }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 8,
            height: 5,
            borderRadius: 3,
            marginTop: 1,
            background: 'linear-gradient(180deg,#9a7a3a,#4a3218)',
            boxShadow: '0 1px 1px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,230,160,0.4)',
          }}
        />
      ))}
    </div>
  );
}

function CircleBtn({ size = 38, active, onClick, disabled, children, tone = 'gold' }) {
  const ring = '#d4af37';
  const inner =
    tone === 'felt'
      ? 'radial-gradient(circle at 40% 35%, #244a2f, #102818)'
      : 'radial-gradient(circle at 40% 30%, #4a321e, #1c1008)';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative rounded-full flex items-center justify-center disabled:opacity-50"
      style={{
        width: size,
        height: size,
        background: inner,
        border: `2px solid ${ring}`,
        boxShadow: `inset 0 0 0 2px rgba(0,0,0,0.5), 0 0 0 2px #6b4a08, 0 3px 7px rgba(0,0,0,0.7)${
          active ? ', 0 0 14px rgba(255,210,90,0.95)' : ''
        }`,
      }}
    >
      {children}
    </button>
  );
}

function TopHeader() {
  return (
    <div className="relative w-full" style={{ height: '5%', background: WOOD_FLAT, borderBottom: '2px solid #000' }}>
      <Chain left="20%" />
      <Chain left="80%" />
      <img
        src={SKULL}
        alt=""
        draggable={false}
        className="absolute left-1/2 -translate-x-1/2 z-20 object-contain"
        style={{ top: '4%', height: '170%' }}
      />
    </div>
  );
}

function MultiplierSign({ mult }) {
  return (
    <div className="relative w-full flex items-center justify-center" style={{ height: '19%' }}>
      <div
        className="relative flex items-center justify-between px-3"
        style={{
          width: '94%',
          height: '80%',
          borderRadius: '50% 50% 14px 14px / 70% 70% 14px 14px',
          background: WOOD_PLANK,
          border: '3px solid #8a5a12',
          boxShadow:
            'inset 0 0 0 2px #d4af37, inset 0 0 0 4px #6b4a08, inset 0 2px 6px rgba(255,240,200,0.22), 0 6px 14px rgba(0,0,0,0.65)',
        }}
      >
        <div className="flex flex-col items-center leading-none" style={{ transform: 'rotate(-7deg)' }}>
          <span style={{ ...goldText, fontSize: 13 }}>X512</span>
          <span style={{ ...redText, fontSize: 15 }}>X1024</span>
        </div>
        <span style={{ ...goldText, fontSize: 'clamp(38px,11vh,68px)' }}>X{mult}</span>
        <span style={{ ...goldText, fontSize: 20 }}>X2</span>
        <span style={{ ...goldText, fontSize: 20 }}>X4</span>
      </div>
    </div>
  );
}

function WaysArch({ side }) {
  const isLeft = side === 'left';
  return (
    <div
      className="absolute top-0 z-20 flex items-center justify-center"
      style={{
        [isLeft ? 'left' : 'right']: '3%',
        top: '-3%',
        width: '30%',
        height: '15%',
        transform: isLeft ? 'rotate(-10deg)' : 'rotate(10deg)',
        borderRadius: '45% 45% 10px 10px / 65% 65% 10px 10px',
        background: WOOD_FLAT,
        border: '2px solid #8a5a12',
        boxShadow: 'inset 0 0 0 2px #d4af37, 0 3px 8px rgba(0,0,0,0.6)',
      }}
    >
      <span style={{ ...goldText, fontSize: 12, letterSpacing: 1 }}>3600 WAYS</span>
    </div>
  );
}

function GameBoard({ g }) {
  return (
    <div className="relative w-full" style={{ height: '100%' }}>
      <WaysArch side="left" />
      <WaysArch side="right" />
      <div className="relative w-full h-full p-[10px]" style={FRAME}>
        <div className="relative w-full h-full overflow-hidden rounded-md" style={{ background: WOOD_PLANK }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-6 gap-1 items-center" style={{ width: '80%' }}>
              {g.grid.map((reel, ri) => (
                <Reel
                  key={ri}
                  reelIndex={ri}
                  rowCount={REEL_ROWS[ri]}
                  symbols={reel}
                  spinning={!g.stoppedReels.has(ri)}
                  speed={
                    g.anticipation && !g.stoppedReels.has(ri) ? (g.turbo ? 1.9 : 2.8) : g.turbo ? 0.24 : 0.5
                  }
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

          {/* FEATURE BUY */}
          <button
            className="absolute flex flex-col items-center justify-center"
            style={{
              right: '-7%',
              bottom: '12%',
              width: '24%',
              height: '24%',
              borderRadius: 8,
              background: WOOD_FLAT,
              border: '3px solid #aeb6bf',
              boxShadow: 'inset 0 0 0 2px #6b4a08, 0 0 0 2px #4a4a52, 0 5px 10px rgba(0,0,0,0.7)',
            }}
          >
            <span style={{ ...goldText, fontSize: 12, lineHeight: 1 }}>FEATURE</span>
            <span style={{ ...goldText, fontSize: 12, lineHeight: 1 }}>BUY</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Horseshoe() {
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-20 flex items-end justify-between"
      style={{ top: '-9px', width: 28, height: 16, padding: '0 3px' }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          style={{
            width: 3,
            height: 9,
            borderRadius: 2,
            background: 'linear-gradient(180deg,#f7d56c,#b8860b)',
            boxShadow: '0 1px 1px rgba(0,0,0,0.5)',
          }}
        />
      ))}
    </div>
  );
}

function InfoBanner() {
  return (
    <div className="relative w-full flex items-center justify-center" style={{ height: '8%' }}>
      <Horseshoe />
      <div className="relative flex items-center" style={{ width: '90%', height: '80%', ...FRAME, padding: '4px 8px' }}>
        {/* cowgirl + WILD */}
        <div className="flex flex-col items-center justify-center" style={{ width: '22%', height: '100%' }}>
          <div
            className="relative overflow-hidden rounded-full"
            style={{
              width: '64%',
              aspectRatio: '1 / 1',
              border: '2px solid #d4af37',
              background: '#241608',
              boxShadow: 'inset 0 0 0 2px #6b4a08',
            }}
          >
            <img src={COWGIRL} alt="" draggable={false} className="w-full h-full object-cover" />
          </div>
          <span style={{ ...goldText, fontSize: 9, marginTop: 1 }}>WILD</span>
        </div>
        {/* text */}
        <div className="flex-1 text-center px-1">
          <span style={{ ...silverText, fontSize: 'clamp(10px,2.3vw,15px)' }}>WITH GOLD FRAMED SYMBOL</span>
        </div>
      </div>
    </div>
  );
}

function StatusRow() {
  const Panel = ({ children }) => (
    <div
      className="flex-1 flex items-center justify-center rounded-lg"
      style={{
        height: 34,
        background: 'rgba(36,22,8,0.8)',
        border: '1px solid #8a5a12',
        boxShadow: 'inset 0 0 0 1px rgba(212,175,55,0.45)',
      }}
    >
      {children}
    </div>
  );
  return (
    <div className="w-full flex items-center justify-between gap-2 px-3" style={{ height: '6%' }}>
      <Panel>
        <Book className="w-4 h-4 text-yellow-400" />
      </Panel>
      <Panel>
        <Coins className="w-4 h-4 text-yellow-400" />
      </Panel>
      <Panel>
        <Trophy className="w-4 h-4 text-yellow-400" />
      </Panel>
    </div>
  );
}

function RotateArrows({ spinning }) {
  return (
    <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" style={{ animation: spinning ? 'saSpinRotate 1.1s linear infinite' : 'none' }}>
      <defs>
        <linearGradient id="gld" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbe9a8" />
          <stop offset="55%" stopColor="#e7b94e" />
          <stop offset="100%" stopColor="#8a5a12" />
        </linearGradient>
      </defs>
      <path d="M50 12 A38 38 0 0 1 88 50 L74 50 L70 40 L66 50 L52 50 A20 20 0 0 0 30 30 L20 22 A38 38 0 0 1 50 12 Z" fill="url(#gld)" stroke="#5a3a06" strokeWidth="1.5" />
      <path d="M50 88 A38 38 0 0 1 12 50 L26 50 L30 60 L34 50 L48 50 A20 20 0 0 0 70 70 L80 78 A38 38 0 0 1 50 88 Z" fill="url(#gld)" stroke="#5a3a06" strokeWidth="1.5" />
    </svg>
  );
}

function ControlArea({ g }) {
  const CtrlLabel = ({ children }) => (
    <span style={{ fontFamily: "'Rye',Georgia,serif", fontSize: 8, color: GOLD, marginTop: 2 }}>{children}</span>
  );
  return (
    <div className="relative w-full overflow-hidden" style={{ height: '20%', background: FELT }}>
      {/* money props */}
      <img src={MONEY} alt="" draggable={false} className="absolute object-contain" style={{ left: '-5%', bottom: '-14%', width: '32%', opacity: 0.95, transform: 'rotate(-12deg)' }} />
      <img src={MONEY} alt="" draggable={false} className="absolute object-contain" style={{ right: '22%', bottom: '-12%', width: '27%', opacity: 0.95, transform: 'rotate(16deg)' }} />
      {/* bullet container bottom-left */}
      <div
        className="absolute"
        style={{
          left: '4%',
          bottom: '4%',
          width: 30,
          height: 40,
          borderRadius: 6,
          background: 'linear-gradient(180deg,#5a4218,#2a1a0e)',
          border: '2px solid #8a5a12',
          boxShadow: 'inset 0 0 0 1px #d4af37, 0 3px 6px rgba(0,0,0,0.6)',
        }}
      />
      {/* revolver bottom-right cropped */}
      <img src={REVOLVER} alt="" draggable={false} className="absolute object-contain" style={{ right: '-7%', bottom: '-20%', width: '40%', transform: 'rotate(8deg)' }} />

      {/* controls */}
      <div className="absolute inset-0 flex items-center justify-between px-2" style={{ paddingBottom: 10 }}>
        {/* left: TURBO + MINUS */}
        <div className="flex items-center gap-1.5">
          <div className="flex flex-col items-center">
            <CircleBtn size={36} active={g.turbo} onClick={() => g.setTurbo(!g.turbo)}>
              <Zap className="w-4 h-4 text-yellow-300" />
            </CircleBtn>
            <CtrlLabel>TURBO</CtrlLabel>
          </div>
          <CircleBtn size={36} tone="felt" disabled={g.spinning} onClick={() => g.setBetIndex(Math.max(0, g.betIndex - 1))}>
            <Minus className="w-5 h-5 text-yellow-300" />
          </CircleBtn>
        </div>

        {/* center SPIN */}
        <button
          onClick={g.spin}
          disabled={g.spinning}
          className="relative rounded-full flex items-center justify-center disabled:opacity-80"
          style={{
            width: '19vw',
            maxWidth: 90,
            height: '19vw',
            maxHeight: 90,
            background: 'radial-gradient(circle at 40% 30%, #4a321e, #1c1008)',
            border: '3px solid #8a5a12',
            boxShadow:
              'inset 0 0 0 4px #d4af37, inset 0 0 0 7px #6b4a08, inset 0 2px 6px rgba(255,240,200,0.3), 0 0 18px rgba(255,210,90,0.5), 0 6px 14px rgba(0,0,0,0.7)',
          }}
        >
          <RotateArrows spinning={g.spinning} />
        </button>

        {/* right: PLUS + AUTO + MENU */}
        <div className="flex items-center gap-1.5">
          <CircleBtn size={36} tone="felt" disabled={g.spinning} onClick={() => g.setBetIndex(Math.min(BETS.length - 1, g.betIndex + 1))}>
            <Plus className="w-5 h-5 text-yellow-300" />
          </CircleBtn>
          <div className="flex flex-col items-center">
            <CircleBtn size={36} active={g.autoSpin} onClick={() => g.setAutoSpin(!g.autoSpin)}>
              <Play className="w-4 h-4 text-yellow-300" />
            </CircleBtn>
            <CtrlLabel>AUTO</CtrlLabel>
          </div>
          <button
            className="rounded-lg flex items-center justify-center"
            style={{ width: 30, height: 30, background: 'rgba(20,14,8,0.6)', border: '1px solid #8a5a12' }}
          >
            <Menu className="w-4 h-4 text-yellow-100" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WildBountyMachine() {
  const g = useWildBounty();
  return (
    <div className="relative mx-auto w-full h-full flex flex-col" style={{ maxWidth: 480 }}>
      <TopHeader />
      <MultiplierSign mult={g.multiplier} />
      <div className="relative w-full" style={{ flex: '1 1 auto' }}>
        <GameBoard g={g} />
      </div>
      <InfoBanner />
      <StatusRow />
      <ControlArea g={g} />

      {g.showFreeSpinStart && !g.spinning && <FreeSpinStart count={g.freeSpins} onStart={g.startFreeSpins} />}
      {g.flyingMult && (
        <FlyingMultiplier key={g.flyingMult.key} value={g.flyingMult.value} slow={g.flyingMult.slow} onComplete={g.clearFlyingMult} />
      )}

      {g.freeSpins > 0 && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-md text-[11px] font-black italic tracking-widest text-yellow-300"
          style={{ top: '26%', background: 'rgba(20,14,8,0.8)', border: '1px solid #C5A059', fontFamily: "'Rye',Georgia,serif" }}
        >
          ★ FREE SPINS: {g.freeSpins} ★
        </div>
      )}
    </div>
  );
}