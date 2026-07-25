import React from 'react';

// The ornate Western-Baroque frame/stand image uploaded by the user. The
// rotating prize-wheel board sits inside its central black circle.
//
// The board is positioned in px derived from the `size` prop so the layout is
// independent of the frame image's aspect ratio. The two constants below place
// the board inside the central circle; nudge them if the frame image differs.

const FRAME_IMG =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/744c8ab1e_file_00000000708c81fba48880746f3e3b65.png';

const WHEEL_IMG =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/580f5a5e8_file_00000000f1f081fb9825395d20f29cb7.png';

// Board placement within the frame, measured from the uploaded frame image
// (1024×1024). The central matte-black circle's center is at (50.5%, 39.5%)
// and its diameter is ~45.6% of the frame width (covers the full matte disk
// up to the inner gold rim, so no black ring shows around the wheel).
const BOARD_DIAM_FRAC = 0.456;   // board diameter = matte disk diameter
const CENTER_X_FRAC = 0.505;     // matte circle center X
const CENTER_Y_FRAC = 0.395;     // matte circle center Y

export default function SpinWheel({ rotation, onRest, size = 340 }) {
  const boardPx = size * BOARD_DIAM_FRAC;
  const leftPx = size * CENTER_X_FRAC;
  const topPx = size * (CENTER_Y_FRAC - BOARD_DIAM_FRAC / 2);

  return (
    <div className="relative select-none mx-auto" style={{ width: size }}>
      {/* Ornate Western frame + stand (preserves its natural aspect ratio) */}
      <img
        src={FRAME_IMG}
        alt="Ornate Western wheel frame"
        draggable={false}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />

      {/* Rotating board — centered horizontally, seated in the frame's black circle */}
      <div
        style={{
          position: 'absolute',
          left: leftPx,
          top: topPx,
          width: boardPx,
          height: boardPx,
          transform: `translateX(-50%) rotate(${rotation}deg)`,
          transition: 'transform 10s cubic-bezier(0.16,0.92,0.02,1)',
          willChange: 'transform',
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.6)',
          zIndex: 2,
        }}
        onTransitionEnd={(e) => {
          if (e.propertyName === 'transform' && onRest) onRest();
        }}
      >
        <img
          src={WHEEL_IMG}
          alt="Daily free spin wheel"
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'cover',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Pointer cone — fixed at the top-center of the board, pointing down into the wheel */}
      <div
        style={{
          position: 'absolute',
          left: leftPx,
          top: topPx,
          width: 0,
          height: 0,
          borderLeft: `${size * 0.035}px solid transparent`,
          borderRight: `${size * 0.035}px solid transparent`,
          borderTop: `${size * 0.07}px solid #f5c542`,
          transform: 'translateX(-50%)',
          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.7))',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}