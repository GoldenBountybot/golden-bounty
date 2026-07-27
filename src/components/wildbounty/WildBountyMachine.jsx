import React from 'react';
import { useWildBounty } from './useWildBounty';
import { REEL_ROWS, BETS } from './symbols';
import Reel from './Reel';
import FreeSpinStart from './FreeSpinStart';
import FlyingMultiplier from './FlyingMultiplier';
import { Zap, Minus, Plus, Play, Menu, Wallet, Coins, Trophy } from 'lucide-react';

// AI-generated decorative props (black backgrounds dropped via screen blend)
const SKULL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/9a769e332_generated_image.png';
const COWGIRL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/69c61b7b8_generated_image.png';
const REVOLVER = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/4c11a0007_generated_image.png';
const MONEY = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/9be2d0703_generated_image.png';

const WEST = "'Rye', Georgia, serif";

// Dark walnut wood with horizontal plank grain
const WOOD = (a = '#4a3220', b = '#2e1d10') =>
  `repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 40px),` +
  `repeating-linear-gradient(0deg, rgba(255,220,150,0.04) 0 1px, transparent 1px 7px),` +
  `linear-gradient(to bottom, ${a}, ${b})`;

// Polished antique-gold bevel
const GOLD = 'linear-gradient(to bottom, #ffe9a8 0%, #f4d98a 14%, #d4a84a 42%, #8a6020 68%, #c5963D 100%)';
const GOLD_FRAME = { background: GOLD, padding: 3, borderRadius: 14, boxShadow: '0 3px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.5)' };

// Gold metallic text
function GoldText({ children, size, color = '#f4d03f', stroke = '#5a3a06', rotate, style }) {
  return (
    <span
      style={{
        fontFamily: WEST,
        fontWeight: 400,
        fontSize: size,
        color,
        lineHeight: 1,
        display: 'inline-block',
        textShadow: `0 1px 0 ${stroke}, 0 2px 2px rgba(0,0,0,0.85), 0 -1px 0 rgba(255,255,255,0.25)`,
        WebkitTextStroke: `1px ${stroke}`,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// Multiplier saloon sign
function MultiplierFrame({ mult }) {
  return (
    <div className="relative mx-auto" style={{ width: '94%', ...GOLD_FRAME, borderRadius: '18px 18px 26px 26px' }}>
      {/* hanging chains */}
      <div style={{ position: 'absolute', top: -22, left: '14%', width: 5, height: 24, background: 'repeating-linear-gradient(to bottom,#8a6020 0 5px,#5a3a06 5px 10px)', borderRadius: 3, boxShadow: '1px 0 2px rgba(0,0,0,0.6)' }} />
      <div style={{ position: 'absolute', top: -22, right: '14%', width: 5, height: 24, background: 'repeating-linear-gradient(to bottom,#8a6020 0 5px,#5a3a06 5px 10px)', borderRadius: 3, boxShadow: '1px 0 2px rgba(0,0,0,0.6)' }} />
      <div style={{ background: WOOD('#5a3a20', '#2a180c'), borderRadius: '15px 15px 23px 23px', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.7)' }}>
        {/* left angled high multipliers */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'rotate(-9deg)', gap: 2 }}>
          <GoldText size="13px">X512</GoldText>
          <GoldText size="15px" color="#e0444a">X1024</GoldText>
        </div>
        {/* center current */}
        <GoldText size="34px">X{mult}</GoldText>
        {/* right low multipliers */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'rotate(9deg)', gap: 2 }}>
          <GoldText size="15px">X2</GoldText>
          <GoldText size="15px">X4</GoldText>
        </div>
      </div>
    </div>
  );
}

// 3600 WAYS curved arch badge
function WaysArch({ side }) {
  return (
    <div style={{
      position: 'absolute', top: -10, [side]: 8, zIndex: 5,
      background: WOOD('#5a3a20', '#2a180c'),
      border: `2px solid transparent`,
      borderRadius: '14px 14px 10px 10px',
      padding: '3px 9px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,220,150,0.18)',
    }}>
      <span style={{ fontFamily: WEST, fontSize: 10, color: '#1c0f06', WebkitTextStroke: '0.5px #c5963D', letterSpacing: 0.5 }}>3600 WAYS</span>
    </div>
  );
}

// Circular control button
function CtrlBtn({ children, onClick, active, disabled, size = 46, label, labelColor = '#f4d03f' }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 2 }}>
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          width: size, height: size, borderRadius: '50%',
          background: active ? GOLD : WOOD('#3a2616', '#1c110a'),
          border: '2px solid #8a6020',
          boxShadow: active
            ? '0 0 10px rgba(244,208,63,0.7), inset 0 1px 0 rgba(255,255,255,0.5)'
            : 'inset 0 2px 5px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(196,150,61,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: active ? '#3a2400' : labelColor,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {children}
      </button>
      {label && <span style={{ fontFamily: WEST, fontSize: 9, color: labelColor, letterSpacing: 0.5 }}>{label}</span>}
    </div>
  );
}

// Spin medallion with curved reload arrows
function SpinArrows() {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '62%', height: '62%' }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="0.5" stopColor="#d4a84a" />
          <stop offset="1" stopColor="#8a6020" />
        </linearGradient>
      </defs>
      <path d="M50 14 A36 36 0 0 1 86 50" fill="none" stroke="url(#sg)" strokeWidth="7" strokeLinecap="round" />
      <path d="M86 50 l-9 -3 l3 10 z" fill="url(#sg)" />
      <path d="M50 86 A36 36 0 0 1 14 50" fill="none" stroke="url(#sg)" strokeWidth="7" strokeLinecap="round" />
      <path d="M14 50 l9 3 l-3 -10 z" fill="url(#sg)" />
    </svg>
  );
}

export default function WildBountyMachine() {
  const g = useWildBounty();

  const decBet = () => g.setBetIndex(i => Math.max(0, i - 1));
  const incBet = () => g.setBetIndex(i => Math.min(BETS.length - 1, i + 1));

  return (
    <div
      className="relative w-full overflow-hidden flex flex-col select-none"
      style={{ height: '100dvh', background: 'linear-gradient(to bottom, #7AB8E4 0%, #7AB8E4 7%, #C2A26F 22%, #6b4a2a 40%, #2a1c12 100%)' }}
    >
      {/* ===== HEADER (skull + chains) ===== */}
      <div className="relative flex items-center justify-center" style={{ flexBasis: '5%', flexShrink: 0, background: WOOD('#3a2410', '#1c1006'), borderBottom: '2px solid #5a3a06' }}>
        <img src={SKULL} alt="" draggable={false}
          style={{ height: '7dvh', width: 'auto', objectFit: 'contain', mixBlendMode: 'screen', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))', marginTop: '-1dvh' }} />
      </div>

      {/* ===== MULTIPLIER FRAME ===== */}
      <div className="relative flex items-center justify-center" style={{ flexBasis: '16%', flexShrink: 0 }}>
        <MultiplierFrame mult={g.multiplier} />
      </div>

      {/* ===== GAME BOARD ===== */}
      <div className="relative flex items-center justify-center" style={{ flexBasis: '38%', flexShrink: 0, padding: '0 3%' }}>
        <div className="relative w-full h-full" style={{ ...GOLD_FRAME, borderRadius: 12 }}>
          <div className="relative w-full h-full overflow-hidden" style={{ background: WOOD('#3a2410', '#1c1006'), borderRadius: 9, boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)' }}>
            {/* plank seams */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 calc(20% - 1px), rgba(0,0,0,0.5) calc(20% - 1px) 20%)' }} />

            {/* 3600 WAYS arches */}
            <WaysArch side="left" />
            <WaysArch side="right" />

            {/* free-spins badge */}
            {g.freeSpins > 0 && (
              <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', zIndex: 8, background: 'rgba(20,14,8,0.8)', border: '1px solid #C5A059', borderRadius: 6, padding: '1px 8px', fontFamily: WEST, fontSize: 10, color: '#f4d03f' }}>
                ★ FREE SPINS {g.freeSpins} ★
              </div>
            )}

            {/* reels */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ padding: '6% 4% 6% 4%' }}>
              <div style={{ height: '100%', aspectRatio: '6 / 5', maxWidth: '100%' }} className="grid grid-cols-6 gap-0.5 items-center">
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

            {/* FEATURE BUY button overlapping right edge */}
            <button
              style={{
                position: 'absolute', right: -10, top: '52%',
                width: '24%', height: '18%',
                background: WOOD('#3a2410', '#1c1006'),
                border: '2px solid #c8c8d0',
                borderRadius: 8,
                boxShadow: '0 3px 6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 0 0 2px #8a6020',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                zIndex: 6,
              }}
            >
              <GoldText size="13px">FEATURE</GoldText>
              <GoldText size="13px">BUY</GoldText>
            </button>
          </div>
        </div>
      </div>

      {/* ===== INFO BANNER (horseshoe + cowgirl + dynamic text) ===== */}
      <div className="relative flex items-end justify-center" style={{ flexBasis: '9%', flexShrink: 0, padding: '0 4%' }}>
        {/* horseshoe above */}
        <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', zIndex: 3, fontFamily: WEST, fontSize: 16, color: '#d4a84a', textShadow: '0 1px 2px #000' }}>∩</div>
        <div className="w-full" style={{ ...GOLD_FRAME, borderRadius: 10, position: 'relative' }}>
          <div className="flex items-center" style={{ background: WOOD('#3a2410', '#1c1006'), borderRadius: 7, height: '100%', padding: '2px 6px 2px 2px' }}>
            {/* cowgirl emblem */}
            <div style={{ width: '20%', aspectRatio: '1/1', borderRadius: 6, overflow: 'hidden', border: '2px solid #8a6020', flexShrink: 0, boxShadow: 'inset 0 0 6px rgba(0,0,0,0.7)' }}>
              <img src={COWGIRL} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className="flex-1 text-center px-2">
              <GoldText size="13px" color="#e8e8f0">{g.message || 'WITH GOLD FRAMED SYMBOL'}</GoldText>
            </div>
          </div>
        </div>
      </div>

      {/* ===== STATUS PANELS (icons only) ===== */}
      <div className="flex items-center justify-center gap-2" style={{ flexBasis: '6%', flexShrink: 0, padding: '0 4%' }}>
        {[Wallet, Coins, Trophy].map((Icon, i) => (
          <div key={i} className="flex-1 flex items-center justify-center" style={{ height: '70%', borderRadius: 8, background: 'rgba(40,26,14,0.7)', border: '1px solid rgba(196,150,61,0.6)', boxShadow: 'inset 0 1px 0 rgba(255,220,150,0.15)' }}>
            <Icon style={{ width: '54%', height: '54%', color: '#f4d03f' }} />
          </div>
        ))}
      </div>

      {/* ===== FELT CONTROL AREA ===== */}
      <div className="relative flex items-center justify-center" style={{ flexBasis: '26%', flexShrink: 0, background: 'radial-gradient(ellipse at center, #2a6a48 0%, #143824 70%, #0a2415 100%)', borderTop: '3px solid #5a3a06' }}>
        {/* felt texture */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 4px)' }} />
        {/* money props */}
        <img src={MONEY} alt="" draggable={false} style={{ position: 'absolute', left: -10, bottom: -6, width: '34%', mixBlendMode: 'screen', opacity: 0.85, pointerEvents: 'none' }} />
        <img src={MONEY} alt="" draggable={false} style={{ position: 'absolute', right: -8, bottom: -4, width: '26%', mixBlendMode: 'screen', opacity: 0.7, pointerEvents: 'none', transform: 'scaleX(-1)' }} />
        {/* revolver */}
        <img src={REVOLVER} alt="" draggable={false} style={{ position: 'absolute', right: -18, bottom: -16, width: '46%', mixBlendMode: 'screen', pointerEvents: 'none', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.7))' }} />

        {/* control row */}
        <div className="relative w-full flex items-center justify-between" style={{ padding: '0 5%', zIndex: 2 }}>
          {/* left: turbo + minus */}
          <div className="flex items-center" style={{ gap: 10 }}>
            <CtrlBtn onClick={() => g.setTurbo(!g.turbo)} active={g.turbo} label="TURBO" size={42}>
              <Zap style={{ width: 20, height: 20 }} />
            </CtrlBtn>
            <CtrlBtn onClick={decBet} disabled={g.spinning} size={42}>
              <Minus style={{ width: 20, height: 20 }} />
            </CtrlBtn>
          </div>

          {/* center: spin */}
          <button
            onClick={g.spin}
            disabled={g.spinning}
            style={{
              width: 76, height: 76, borderRadius: '50%',
              background: GOLD,
              border: '3px solid #5a3a06',
              boxShadow: '0 4px 10px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,255,255,0.6), inset 0 0 0 3px #8a6020, 0 0 18px rgba(244,208,63,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: g.spinning ? 'not-allowed' : 'pointer',
            }}
          >
            <div style={{ width: '78%', height: '78%', borderRadius: '50%', background: WOOD('#3a2410', '#1c1006'), boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SpinArrows />
            </div>
          </button>

          {/* right: plus + auto + menu */}
          <div className="flex items-center" style={{ gap: 10 }}>
            <CtrlBtn onClick={incBet} disabled={g.spinning} size={42}>
              <Plus style={{ width: 20, height: 20 }} />
            </CtrlBtn>
            <CtrlBtn onClick={() => g.setAutoSpin(!g.autoSpin)} active={g.autoSpin} label="AUTO" size={42}>
              <Play style={{ width: 18, height: 18 }} />
            </CtrlBtn>
            <CtrlBtn size={42}>
              <Menu style={{ width: 20, height: 20 }} />
            </CtrlBtn>
          </div>
        </div>
      </div>

      {/* ===== OVERLAYS ===== */}
      {g.showFreeSpinStart && !g.spinning && (
        <FreeSpinStart count={g.freeSpins} onStart={g.startFreeSpins} />
      )}
      {g.flyingMult && (
        <FlyingMultiplier key={g.flyingMult.key} value={g.flyingMult.value} slow={g.flyingMult.slow} onComplete={g.clearFlyingMult} />
      )}
    </div>
  );
}