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

// Golden fleur-de-lis shield pointer — the user's original asset on a pure
// black background. We render it with mix-blend-mode: screen so the black
// background drops out completely (black → transparent) and the gold pointer
// shows through with no rectangular backdrop.
const POINTER_IMG =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/664f53d7d_file_00000000bc488207a04754014a812972.png';

// Board placement within the frame, measured from the uploaded stand image
// (1024×1024). The central circular opening's center is at (50.5%, 42.4%)
// and its diameter is ~54.7% of the frame width (fills the gold frame opening
// up to the inner rim, so no black ring shows around the wheel).
const BOARD_DIAM_FRAC = 0.547;   // board diameter = opening diameter
const CENTER_X_FRAC = 0.5;     // opening center X
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
      {/* SVG filter: converts the pointer image's luminance to alpha so the
          pure-black background becomes fully transparent while the gold
          pointer stays fully opaque — lets it float on top of the frame. */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="dropBlackBg" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0.2126 0.7152 0.0722 0 0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="1.5" intercept="-0.12" />
          </feComponentTransfer>
        </filter>
      </svg>

      {/* Ornate Western frame + stand — black center dropped so the casino
          background shows through the frame opening behind the wheel. */}
      <img
        src={FRAME_IMG}
        alt="Ornate Western wheel frame"
        draggable={false}
        style={{ width: '100%', height: 'auto', display: 'block', filter: 'url(#dropBlackBg)' }}
      />

      {/* Golden fleur-de-lis shield pointer — tip touches the wheel's top rim */}
      <img
        src={POINTER_IMG}
        alt="Golden wheel pointer"
        draggable={false}
        style={{
          position: 'absolute',
          left: pointerLeft,
          bottom: `calc(100% - ${pointerBottom}px)`,
          width: POINTER_W,
          height: 'auto',
          transform: 'translateX(-50%)',
          zIndex: 20,
          filter: 'url(#dropBlackBg)',
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
          transition: 'transform 18s cubic-bezier(0.16,0.92,0.02,1)',
          willChange: 'transform',
          borderRadius: '50%',
          overflow: 'hidden',
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
            filter: 'url(#dropBlackBg)',
          }}
        />
      </div>
    </div>
  );
}