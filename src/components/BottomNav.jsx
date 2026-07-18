import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Layers, Play, Crown, UserCircle } from 'lucide-react';

// Premium western bottom navigation: gold-trimmed dark-wood tiles with a
// sheriff-badge style center Play button. Sits in the home lobby footer.
const tileStyle = {
  background: 'linear-gradient(to bottom, rgba(58,40,18,0.95), rgba(26,18,9,0.95))',
  border: '1px solid rgba(190,140,55,0.7)',
  boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.32), inset 0 0 0 1px rgba(46,30,12,0.55), 0 2px 5px rgba(0,0,0,0.6)',
};

export default function BottomNav() {
  const Tile = ({ to, icon: Icon, label, onClick }) => (
    <Link
      to={to}
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all hover:brightness-125 hover:-translate-y-0.5 active:scale-95"
      style={tileStyle}
    >
      <span className="relative flex items-center justify-center w-9 h-9 rounded-full"
        style={{ background: 'radial-gradient(circle at 40% 30%, rgba(255,210,120,0.22), rgba(0,0,0,0.45))', border: '1px solid rgba(190,140,55,0.55)' }}>
        <Icon className="w-[18px] h-[18px] text-amber-300 transition-colors group-hover:text-amber-200" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.8))' }} />
      </span>
      <span className="text-[10px] font-bold italic tracking-wide text-amber-100/90 group-hover:text-amber-200" style={{ fontFamily: 'Rye, Georgia, serif' }}>{label}</span>
    </Link>
  );

  return (
    <div className="fixed bottom-0 inset-x-0 z-30"
      style={{
        background: 'linear-gradient(to bottom, rgba(38,26,12,0.97), rgba(18,12,6,0.98))',
        borderTop: '2px solid rgba(190,140,55,0.8)',
        boxShadow: '0 -6px 18px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,210,120,0.25)',
      }}>
      <div className="max-w-6xl mx-auto px-3 py-2.5 grid grid-cols-5 gap-2 items-center">
        <Tile to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <Tile to="/dashboard?tab=stack" icon={Layers} label="Stack" />

        {/* Center sheriff-badge Play button */}
        <button
          onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
          className="group flex flex-col items-center justify-center gap-1 py-1 active:scale-95 transition-transform"
          title="Play Games"
        >
          <span className="relative flex items-center justify-center w-12 h-12 rounded-full transition-all group-hover:scale-105 group-hover:rotate-6"
            style={{
              background: 'radial-gradient(circle at 38% 28%, #ffe6a3, #f0a93c 45%, #c9781c 75%, #8a4a10 100%)',
              border: '2px solid rgba(255,230,160,0.9)',
              boxShadow: '0 0 14px rgba(255,200,80,0.65), inset 0 2px 4px rgba(255,240,200,0.6), inset 0 -3px 6px rgba(120,60,10,0.7), 0 3px 8px rgba(0,0,0,0.6)',
            }}>
            <span className="absolute inset-1 rounded-full pointer-events-none"
              style={{ border: '1px dashed rgba(120,60,10,0.45)' }} />
            <Play className="w-6 h-6 text-stone-950" style={{ filter: 'drop-shadow(0 1px 1px rgba(255,240,200,0.5))' }} />
          </span>
          <span className="text-[10px] font-black italic tracking-wide text-amber-200" style={{ fontFamily: 'Rye, Georgia, serif' }}>Play</span>
        </button>

        <Tile to="/dashboard?tab=vip" icon={Crown} label="VIP" />
        <Tile to="/profile" icon={UserCircle} label="Profile" />
      </div>
    </div>
  );
}