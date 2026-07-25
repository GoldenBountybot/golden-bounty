import React from 'react';

// The ornate Western-Baroque frame/stand image uploaded by the user. The
// rotating prize-wheel board sits inside its central black circle.
//
// The board is positioned in px derived from the `size` prop so the layout is
// independent of the frame image's aspect ratio. The two constants below place
// the board inside the central circle; nudge them if the frame image differs.

const FRAME_IMG =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/6f64aed99_file_00000000c4c881fa936f6d4b80af30a1.png';

const WHEEL_IMG =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/580f5a5e8_file_00000000f1f081fb9825395d20f29cb7.png';

// Board placement within the frame, measured from the uploaded stand image
// (1024×1024). The central circular opening's center is at (50.5%, 42.4%)
// and its diameter is ~54.7% of the frame width (fills the gold frame opening
// up to the inner rim, so no black ring shows around the wheel).
const BOARD_DIAM_FRAC = 0.547;   // board diameter = opening diameter
const CENTER_X_FRAC = 0.505;     // opening center X
const CENTER_Y_FRAC = 0.424;     // opening center Y

export default function SpinWheel({ rotation, onRest, size = 340 }) {
  const boardPx = size * BOARD_DIAM_FRAC;
  const leftPx = size * CENTER_X_FRAC;
  const topPx = size * (CENTER_Y_FRAC - BOARD_DIAM_FRAC / 2);

  // Pointer — an iconic Western sheriff-star badge, point-down, seated on the
  // wheel's top edge. 5-pointed star clip-path with a dark engraved inner star
  // and a rivet, echoing the baroque gold of the stand.
  const starSize = boardPx * 0.26;
  const starLeft = leftPx;
  const starTop = topPx - starSize * 0.86; // bottom point dips onto the wheel rim
  const STAR_CLIP =
    'polygon(50% 100%, 37.95% 66.58%, 2.45% 65.45%, 30.5% 43.67%, 20.61% 9.55%, 50% 29.5%, 79.39% 9.55%, 69.5% 43.67%, 97.55% 65.45%, 62.05% 66.58%)';

  return (
    <div className="relative select-none mx-auto" style={{ width: size }}>
      {/* Ornate Western frame + stand (preserves its natural aspect ratio) */}
      <img
        src={FRAME_IMG}
        alt="Ornate Western wheel frame"
        draggable={false}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />

      {/* Western sheriff-star pointer — fixed at the top, points down into the wheel */}
      <div
        style={{
          position: 'absolute',
          left: starLeft,
          top: starTop,
          width: starSize,
          height: starSize,
          transform: 'translateX(-50%)',
          zIndex: 5,
          filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.6))',
        }}
      >
        {/* Outer gold star */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: STAR_CLIP,
            background:
              'linear-gradient(160deg, #fff2b8 0%, #f5c542 30%, #d4af37 52%, #8b6914 80%, #4a3505 100%)',
            boxShadow: 'inset 0 1px 1px rgba(255,245,200,0.85), inset 0 -3px 5px rgba(0,0,0,0.5)',
          }}
        />
        {/* Engraved inner star — darker, gives the badge depth */}
        <div
          style={{
            position: 'absolute',
            inset: '24%',
            clipPath: STAR_CLIP,
            background: 'linear-gradient(155deg, #c8932e 0%, #a06f1a 45%, #5e3d12 100%)',
            boxShadow: 'inset 0 1px 1px rgba(255,235,150,0.5), inset 0 -2px 3px rgba(0,0,0,0.55)',
          }}
        />
        {/* Central rivet */}
        <div
          style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: starSize * 0.16,
            height: starSize * 0.16,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #fff4d0, #f5c542 45%, #7a4f17 85%)',
            boxShadow: 'inset 0 1px 1px rgba(255,245,200,0.9), 0 0 5px rgba(255,200,80,0.6)',
          }}
        />
      </div>

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
    </div>
  );
}