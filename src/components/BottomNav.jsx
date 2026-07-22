import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Layers, Play, Crown, UserCircle } from 'lucide-react';

// Minimal premium bottom bar — sharp gold top trim, dark glass.
export default function BottomNav() {
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
          <Tile to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <Tile to="/dashboard?tab=stack" icon={Layers} label="Stack" />

          {/* Center Play button */}
          <button
            onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
            className="group flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
            title="Play Games"
          >
            <span
              className="flex items-center justify-center w-10 h-10 rounded-[8px] transition-all group-hover:scale-105"
              style={{
                border: '1px solid rgba(214,178,98,0.7)',
                background: 'linear-gradient(to bottom, #f5c542, #c8881e)',
                boxShadow: 'inset 0 1px 0 rgba(255,240,200,0.5), 0 4px 12px rgba(200,136,30,0.5)',
              }}
            >
              <Play className="w-5 h-5 text-stone-950" />
            </span>
          </button>

          <Tile to="/dashboard?tab=vip" icon={Crown} label="VIP" />
          <Tile to="/profile" icon={UserCircle} label="Profile" />
        </div>
      </div>
    </div>
  );
}