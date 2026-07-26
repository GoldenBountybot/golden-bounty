import React from 'react';

// Ornate gold frame overlaid on the Gates of Olympus reel board.
// Top & bottom decorative bars with a central peaked ornament and corner
// caps (triangular, with an etched line), matching the 6x5 grid proportions.

const GOLD_V = 'linear-gradient(to bottom, #f7e8a0 0%, #d4af37 26%, #a67c00 52%, #d4af37 76%, #f7e8a0 100%)';
const GOLD_H = 'linear-gradient(to right, #a67c00 0%, #d4af37 14%, #f7e8a0 36%, #fff7c8 50%, #f7e8a0 64%, #d4af37 86%, #a67c00 100%)';
const SHADOW = 'drop-shadow(0 1px 1px rgba(0,0,0,0.55))';

function Tri({ up, w, h, style }) {
  return (
    <div style={{
      position: 'absolute', width: w, height: h, background: GOLD_V, filter: SHADOW,
      clipPath: up ? 'polygon(50% 0%, 100% 100%, 0% 100%)' : 'polygon(0% 0%, 100% 0%, 50% 100%)',
      ...style,
    }}>
      <div style={{
        position: 'absolute', left: '50%', top: '20%', bottom: '14%', width: 1.5,
        transform: 'translateX(-50%)', background: 'rgba(106,74,0,0.6)',
      }} />
    </div>
  );
}

function HBar({ style }) {
  return (
    <div style={{
      position: 'absolute', height: 6, borderRadius: 2, background: GOLD_H,
      boxShadow: 'inset 0 1px 0 #fff7c8, inset 0 -1px 0 #6a4a00, 0 1px 2px rgba(0,0,0,0.6)',
      ...style,
    }} />
  );
}

export default function GatesOrnateFrame() {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none" aria-hidden="true">
      {/* Top ornate bar */}
      <div className="absolute left-0 right-0" style={{ top: -5, height: 12 }}>
        <HBar style={{ left: 2, right: 2, top: 3 }} />
        <Tri up w={15} h={12} style={{ left: 0, top: -3 }} />
        <Tri up w={15} h={12} style={{ right: 0, top: -3 }} />
        <Tri up w={28} h={18} style={{ left: '50%', top: -13, transform: 'translateX(-50%)' }} />
      </div>

      {/* Bottom ornate bar */}
      <div className="absolute left-0 right-0" style={{ bottom: -5, height: 12 }}>
        <HBar style={{ left: 2, right: 2, bottom: 3 }} />
        <Tri up={false} w={15} h={12} style={{ left: 0, bottom: -3 }} />
        <Tri up={false} w={15} h={12} style={{ right: 0, bottom: -3 }} />
        <Tri up={false} w={28} h={18} style={{ left: '50%', bottom: -13, transform: 'translateX(-50%)' }} />
      </div>
    </div>
  );
}