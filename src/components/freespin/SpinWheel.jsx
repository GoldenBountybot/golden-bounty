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

// Golden fleur-de-lis shield pointer — true transparent PNG (alpha), so it
// renders crisp over both the gold frame and the wheel with no backdrop.
const POINTER_IMG =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/fe697a757_generated_image.png';

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

  // Pointer — the user's golden fleur-de-lis shield pointer (transparent bg),
  // seated so its tip kisses the wheel's top rim. Width scaled to the board so
  // the topper crowns the frame and the shield sits over the gold rim.
  const POINTER_W = boardPx * 0.34;
  const pointerLeft = leftPx;
  const pointerBottom = topPx + boardPx * 0.06; // tip dips onto the wheel face

  return (
    <div className="relative select-none mx-auto" style={{ width: size }}>
      {/* Ornate Western frame + stand (preserves its natural aspect ratio) */}
      <img
        src={FRAME_IMG}
        alt="Ornate Western wheel frame"
        draggable={false}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />

      {/* Golden pointer tip — a simple downward cone marking the winning segment */}
      <div
        style={{
          position: 'absolute',
          left: leftPx,
          top: pointerBottom,
          width: 0,
          height: 0,
          borderLeft: `${boardPx * 0.06}px solid transparent`,
          borderRight: `${boardPx * 0.06}px solid transparent`,
          borderTop: `${boardPx * 0.16}px solid #f5c542`,
          transform: 'translateX(-50%)',
          zIndex: 20,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))',
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
          zIndex: 1,
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