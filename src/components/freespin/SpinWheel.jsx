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

  // Pointer — a beautiful ornate Western gold finial image (transparent PNG),
  // point-down, seated on the wheel's top edge.
  const POINTER_IMG =
    'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e612e41a3_generated_image.png';
  const pointerW = boardPx * 0.46;
  const pointerLeft = leftPx;
  const pointerTop = topPx - pointerW * 0.92; // tip dips onto the wheel rim

  return (
    <div className="relative select-none mx-auto" style={{ width: size }}>
      {/* Ornate Western frame + stand (preserves its natural aspect ratio) */}
      <img
        src={FRAME_IMG}
        alt="Ornate Western wheel frame"
        draggable={false}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />

      {/* Western gold pointer — fixed at the top, points down into the wheel */}
      <img
        src={POINTER_IMG}
        alt="Western gold pointer"
        draggable={false}
        style={{
          position: 'absolute',
          left: pointerLeft,
          top: pointerTop,
          width: pointerW,
          height: 'auto',
          transform: 'translateX(-50%)',
          zIndex: 5,
          filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.55))',
          pointerEvents: 'none',
        }}
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