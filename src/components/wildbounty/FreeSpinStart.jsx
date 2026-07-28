import React from 'react';

// Free-Spins start banner — the full artwork (sunset street, logo, big "10",
// FREE SPINS, X8 description, START) is baked into a single image, so we show
// that image and lay transparent click targets over the baked START button:
//   1. a transparent START button (clicking it starts the free spins)
//   2. a hidden button directly beneath it (also starts the free spins)
// The Feature Buy flow keeps its own separate banner — this is only for the
// scatter-awarded free-spins start (always 10 spins, matching the baked "10").
const BANNER =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c59383f07_file_00000000f68481fab97bfcf72831e629.png';

export default function FreeSpinStart({ count, onStart }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90">
      <div className="relative">
        <img
          src={BANNER}
          alt="Free Spins"
          draggable={false}
          className="block max-h-[100vh] max-w-[100vw] w-auto h-auto object-contain select-none"
        />

        {/* START — transparent click target over the baked START button */}
        <button
          onClick={onStart}
          aria-label="START"
          className="absolute cursor-pointer transition-transform active:scale-95"
          style={{
            left: '20%',
            right: '20%',
            bottom: '3%',
            height: '15%',
            background: 'transparent',
            border: 'none',
            padding: 0,
          }}
        />

        {/* Hidden button directly beneath START — invisible, also starts
            the free spins (enlarged tap area / secret trigger). */}
        <button
          onClick={onStart}
          aria-label="start free spins"
          tabIndex={-1}
          className="absolute cursor-pointer"
          style={{
            left: '20%',
            right: '20%',
            bottom: '0%',
            height: '3.5%',
            background: 'transparent',
            border: 'none',
            padding: 0,
            opacity: 0,
          }}
        />
      </div>
    </div>
  );
}