import React from 'react';

// Greek meander (key) decorative band rendered as a repeating inline SVG pattern.
export default function Meander({ className = '', color = '#e8c878', height = 14, metallic = false }) {
  const id = `meander-${metallic ? 'mtl' : color.replace('#', '')}-${height}`;
  const tile = 28;
  return (
    <svg
      className={className}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      style={{ display: 'block', filter: metallic ? 'drop-shadow(0 1px 0 #A63B0A) drop-shadow(0 2px 1px rgba(0,0,0,0.45))' : undefined }}
    >
      <defs>
        {metallic && (
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDFD5D" />
            <stop offset="35%" stopColor="#E1A914" />
            <stop offset="75%" stopColor="#D68A0F" />
            <stop offset="100%" stopColor="#A63B0A" />
          </linearGradient>
        )}
        <pattern id={id} width={tile} height={height} patternUnits="userSpaceOnUse" patternTransform="translate(0,0)">
          <path
            d={`M2 2 V${height - 2} H8 V6 H14 V${height - 2} H20 V2 H${tile - 2} V${height / 2} H${tile - 6} V2`}
            fill="none"
            stroke={metallic ? `url(#${id}-g)` : color}
            strokeWidth="1.7"
            strokeLinejoin="miter"
          />
        </pattern>
      </defs>
      <rect width="100%" height={height} fill={`url(#${id})`} />
    </svg>
  );
}