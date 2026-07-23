import React from 'react';

// Greek meander (key) decorative band rendered as a repeating inline SVG pattern.
export default function Meander({ className = '', color = '#e8c878', height = 14 }) {
  const id = `meander-${color.replace('#', '')}-${height}`;
  const tile = 28;
  return (
    <svg
      className={className}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      <defs>
        <pattern id={id} width={tile} height={height} patternUnits="userSpaceOnUse" patternTransform="translate(0,0)">
          <path
            d={`M2 2 V${height - 2} H8 V6 H14 V${height - 2} H20 V2 H${tile - 2} V${height / 2} H${tile - 6} V2`}
            fill="none"
            stroke={color}
            strokeWidth="1.4"
            strokeLinejoin="miter"
          />
        </pattern>
      </defs>
      <rect width="100%" height={height} fill={`url(#${id})`} />
    </svg>
  );
}