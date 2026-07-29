import React from 'react';
import { Link } from 'react-router-dom';

// Featured "777" play button — uses the uploaded wooden medallion asset at the
// same size as the in-game spin button, with no container background.
const IMG =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/a37f15d57_file_00000000710c8207a086cbd3402c46e3.png';

export default function PlayButton777({ to = '/games/gates-of-olympus', size = '5.5rem' }) {
  return (
    <div className="flex justify-center pt-4">
      <Link to={to} className="relative inline-flex items-center justify-center active:scale-95 transition-transform">
        <img
          src={IMG}
          alt="Play 777"
          draggable={false}
          className="block rounded-full select-none"
          style={{
            width: size,
            height: size,
            boxShadow: '0 4px 14px rgba(0,0,0,0.7), 0 0 18px rgba(255,200,90,0.35)',
          }}
        />
      </Link>
    </div>
  );
}