import React from 'react';
import { Link, useLocation } from 'react-router-dom';


// Minimal premium bottom bar — sharp gold top trim, dark glass.
export default function BottomNav() {
  const { pathname, search } = useLocation();
  const isPath = (to) => {
    const [p, q] = to.split('?');
    if (q) {
      const want = new URLSearchParams(q).get('tab');
      const actual = new URLSearchParams(search).get('tab');
      return pathname === p && want === actual;
    }
    return pathname === to;
  };

  // Image-backed tile: gold medallion graphic (black bg removed via screen blend).
  // Active tile scales up and glows gold.
  const ImgTile = ({ to, label, src, onClick }) => {
    const active = isPath(to);
    return (
      <Link
        to={to}
        onClick={onClick}
        className="group flex flex-col items-center justify-center gap-0.5 py-1.5 transition-all hover:brightness-125 active:scale-95"
      >
        <img
          src={src}
          alt={label}
          draggable={false}
          className="block w-11 h-11 select-none transition-all duration-300 group-hover:scale-105"
          style={{
            mixBlendMode: 'screen',
            transform: active ? 'scale(1.18)' : undefined,
            filter: active
              ? 'drop-shadow(0 0 10px rgba(245,210,120,0.9)) drop-shadow(0 3px 8px rgba(200,136,30,0.55))'
              : 'drop-shadow(0 2px 6px rgba(200,136,30,0.4))',
          }}
        />
      </Link>
    );
  };

  const Tile = ({ to, icon: Icon, label, onClick }) => {
    const active = isPath(to);
    return (
      <Link
        to={to}
        onClick={onClick}
        className="group flex flex-col items-center justify-center gap-1 py-1.5 transition-all hover:brightness-125 active:scale-95"
      >
        <Icon
          className="w-5 h-5 transition-all duration-300 group-hover:scale-110"
          style={{
            color: active ? '#f7e3a8' : 'rgba(252,211,77,0.9)',
            filter: active ? 'drop-shadow(0 0 8px rgba(245,210,120,0.9))' : undefined,
            transform: active ? 'scale(1.15)' : undefined,
          }}
        />
        <span className="text-[10px] font-bold italic tracking-wide transition-colors" style={{ fontFamily: 'Georgia, serif', color: active ? '#f7e3a8' : 'rgba(252,211,77,0.85)' }}>{label}</span>
      </Link>
    );
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-30">
      <div
        className="mx-auto max-w-md px-4 pt-2.5 pb-2.5 rounded-t-[12px]"
        style={{
          borderTop: '1px solid rgba(214,178,98,0.4)',
          background: 'rgba(10,9,8,0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 -6px 22px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,240,200,0.12)',
        }}
      >
        <div className="grid grid-cols-5 gap-2 items-center">
          <ImgTile to="/dashboard" label="Dashboard" src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/0bf2d07ee_file_000000009cf082119790d647b9b4d6d2.png" />
          <ImgTile to="/dashboard?tab=stack" label="Stack" src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/5ee916b61_file_0000000084f082119192d2d5866b87d5.png" />

          {/* Center Play button — 777 medallion, black bg removed via screen blend */}
          <button
            onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
            className="group flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
            title="Play Games"
          >
            <span
              className="flex items-center justify-center w-12 h-12 rounded-[8px] overflow-hidden transition-all group-hover:scale-105"
              style={{
                filter: 'drop-shadow(0 3px 8px rgba(200,136,30,0.55))',
              }}
            >
              <img
                src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/a37f15d57_file_00000000710c8207a086cbd3402c46e3.png"
                alt="777 Play"
                draggable={false}
                className="block w-full h-full object-cover select-none"
                style={{ mixBlendMode: 'screen' }}
              />
            </span>
          </button>

          <ImgTile to="/dashboard?tab=vip" label="VIP" src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e130df042_file_00000000003c81fab9a795d126ebcf40.png" />
          <ImgTile to="/profile" label="Profile" src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/991ab5d3e_file_00000000a2b081fa9b55e7aca49962fc.png" />
        </div>
      </div>
    </div>
  );
}