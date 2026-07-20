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
      className="group flex flex-col items-center justify-center gap-1 py-2 transition-all hover:brightness-125 hover:-translate-y-0.5 active:scale-95"
    >
      <Icon className="w-6 h-6 text-amber-300 transition-colors group-hover:text-amber-200" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.8))' }} />
      <span className="text-[10px] font-bold italic tracking-wide text-amber-100/90 group-hover:text-amber-200" style={{ fontFamily: 'Rye, Georgia, serif' }}>{label}</span>
    </Link>
  );

  return (
    <div className="fixed bottom-0 inset-x-0 z-30">
      <div className="max-w-6xl mx-auto px-3 py-2.5 grid grid-cols-5 gap-2 items-center">
        <Tile to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <Tile to="/dashboard?tab=stack" icon={Layers} label="Stack" />

        {/* Center sheriff-badge Play button */}
        <button
          onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
          className="group flex flex-col items-center justify-center gap-1 py-1 active:scale-95 transition-transform"
          title="Play Games"
        >
          <Play className="w-7 h-7 text-amber-300 transition-all group-hover:scale-105 group-hover:rotate-6 group-hover:text-amber-200" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.8))' }} />
          <span className="text-[10px] font-black italic tracking-wide text-amber-200" style={{ fontFamily: 'Rye, Georgia, serif' }}>Play</span>
        </button>

        <Tile to="/dashboard?tab=vip" icon={Crown} label="VIP" />
        <Tile to="/profile" icon={UserCircle} label="Profile" />
      </div>
    </div>
  );
}