import React from 'react';
import { Link } from 'react-router-dom';


// Minimal premium bottom bar — sharp gold top trim, dark glass.
export default function BottomNav() {
  // Image-backed tile: gold medallion graphic (black bg removed via screen blend).
  const ImgTile = ({ to, label, src, onClick }) => (
    <Link
      to={to}
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-0.5 py-1.5 transition-all hover:brightness-125 active:scale-95"
    >
      <img
        src={src}
        alt={label}
        draggable={false}
        className="block w-11 h-11 select-none transition-all group-hover:scale-105"
        style={{ mixBlendMode: 'screen', filter: 'drop-shadow(0 2px 6px rgba(200,136,30,0.4))' }}
      />
    </Link>
  );

  const Tile = ({ to, icon: Icon, label, onClick }) => (
    <Link
      to={to}
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-1 py-1.5 transition-all hover:brightness-125 active:scale-95"
    >
      <Icon className="w-5 h-5 text-amber-300/90 group-hover:text-amber-200 transition-colors" />
      <span className="text-[10px] font-bold italic tracking-wide text-amber-100/85 group-hover:text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>{label}</span>
    </Link>
  );

  return (
    <div className="fixed bottom-0 inset-x-0 z-30">
      <div
        className="mx-auto max-w-md px-3 pt-2 pb-2 rounded-t-[10px]"
        style={{
          borderTop: '1px solid rgba(214,178,98,0.4)',
          background: 'rgba(10,9,8,0.82)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 -6px 22px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,240,200,0.12)',
        }}
      >
        <div className="grid grid-cols-5 gap-1 items-center">
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