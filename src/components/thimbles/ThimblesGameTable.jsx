import React from 'react';

const BARREL_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/35b2a44e4_file_00000000149481fa80aa6a96e6a047f9.png';
const BALL_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/8a7398106_file_00000000fdcc81fa9090dcaff6ecfea6.png';
const WOOD_TABLE = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/63f730da2_file_00000000a08482079b6365566218e339.png';

function GoldenBall({ size = 28 }) {
  return (
    <img
      src={BALL_IMG}
      alt="gold ball"
      draggable={false}
      className="select-none"
      style={{ width: size, height: 'auto', mixBlendMode: 'screen', filter: 'drop-shadow(0 0 8px rgba(255,210,120,0.85))' }}
    />
  );
}

function Barrel({ lifted, hasBall, reveal, won }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-end">
      <div
        className="absolute left-1/2 -translate-x-1/2 transition-all duration-300"
        style={{ bottom: lifted && reveal && hasBall ? '40px' : '4px', opacity: lifted && reveal && hasBall ? 1 : 0, zIndex: 1 }}
      >
        <GoldenBall size={28} />
      </div>
      <img
        src={BARREL_IMG}
        alt="barrel"
        draggable={false}
        className="relative transition-transform duration-300 select-none"
        style={{
          width: '120px',
          height: 'auto',
          transform: lifted ? 'translateY(-52px)' : 'translateY(0)',
          zIndex: 2,
          mixBlendMode: 'screen',
          filter: won ? 'drop-shadow(0 0 10px rgba(255,210,100,0.7)) brightness(1.1)' : 'drop-shadow(0 3px 5px rgba(0,0,0,0.6))',
        }}
      />
    </div>
  );
}

export default function ThimblesGameTable({ phase, positions, ballCups, picked, won, message, pick, slotLeft, SHUFFLE_MS }) {
  const cupsLifted = phase === 'peek';
  const pickedLifted = phase === 'over';

  return (
    <div
      className="relative overflow-hidden flex-1 flex flex-col justify-center"
      style={{
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        backgroundImage: `url('${WOOD_TABLE}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderTop: '2px solid rgba(180,140,80,0.4)',
        borderBottom: '2px solid rgba(180,140,80,0.4)',
        boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.5)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 60%, rgba(0,0,0,0.15), rgba(0,0,0,0.35))' }} />

      {/* Ornate golden frame */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          border: '4px solid transparent',
          borderImage: 'linear-gradient(135deg, #c89020 0%, #ffe890 25%, #b88010 50%, #ffe890 75%, #c89020 100%) 1',
          boxShadow: 'inset 0 0 0 2px rgba(60,40,10,0.7), inset 0 0 0 6px rgba(255,225,140,0.18), inset 0 0 18px rgba(0,0,0,0.55), 0 0 14px rgba(200,150,60,0.35)',
        }}
      />
      <div className="absolute inset-1 pointer-events-none" style={{ border: '1px solid rgba(255,225,140,0.45)', boxShadow: 'inset 0 0 0 3px rgba(40,28,8,0.5)' }} />
      {[
        { top: 0, left: 0, borderTop: '4px solid #ffe890', borderLeft: '4px solid #ffe890' },
        { top: 0, right: 0, borderTop: '4px solid #ffe890', borderRight: '4px solid #ffe890' },
        { bottom: 0, left: 0, borderBottom: '4px solid #ffe890', borderLeft: '4px solid #ffe890' },
        { bottom: 0, right: 0, borderBottom: '4px solid #ffe890', borderRight: '4px solid #ffe890' },
      ].map((c, i) => (
        <div key={i} className="absolute w-7 h-7 pointer-events-none" style={{ ...c, filter: 'drop-shadow(0 0 4px rgba(255,210,100,0.7))' }} />
      ))}

      {/* Message banner */}
      <div className="absolute top-3 left-0 right-0 flex justify-center z-20">
        <div
          className="px-4 py-1.5 rounded-full text-sm font-bold"
          style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(180,140,80,0.4)', color: won ? '#ffe066' : '#e0d8c0' }}
        >
          {message}
        </div>
      </div>

      {/* Three barrels */}
      <div className="relative w-full max-w-[380px] mx-auto px-4" style={{ height: '240px' }}>
        <div className="absolute bottom-2 left-4 right-4 h-[3px] rounded-full" style={{ background: 'linear-gradient(to right, transparent, rgba(180,140,80,0.4), transparent)' }} />
        {[0, 1, 2].map((cupIdx) => {
          const slot = positions[cupIdx];
          const isPicked = picked === cupIdx;
          const hasBall = ballCups.has(cupIdx);
          const lifted = cupsLifted || (pickedLifted && isPicked);
          return (
            <button
              key={cupIdx}
              onClick={() => pick(cupIdx)}
              disabled={phase !== 'picking'}
              className="absolute bottom-2 transition-all"
              style={{
                left: slotLeft(slot),
                width: '30%',
                height: '100%',
                transitionDuration: phase === 'shuffling' ? `${SHUFFLE_MS}ms` : '350ms',
                transitionTimingFunction: 'ease-in-out',
              }}
            >
              <Barrel lifted={lifted} hasBall={hasBall} reveal={lifted} won={won && isPicked} />
            </button>
          );
        })}
      </div>
    </div>
  );
}