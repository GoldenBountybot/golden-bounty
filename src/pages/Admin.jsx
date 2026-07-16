import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Users, Receipt, SlidersHorizontal, Gift } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import AdminPlayers from '@/components/admin/AdminPlayers';
import AdminTransactions from '@/components/admin/AdminTransactions';
import AdminGameSettings from '@/components/admin/AdminGameSettings';
import AdminBonuses from '@/components/admin/AdminBonuses';

const TABS = [
  { id: 'players', label: 'Players', icon: Users, comp: AdminPlayers },
  { id: 'transactions', label: 'Transactions', icon: Receipt, comp: AdminTransactions },
  { id: 'games', label: 'Game RTP', icon: SlidersHorizontal, comp: AdminGameSettings },
  { id: 'bonuses', label: 'Bonuses', icon: Gift, comp: AdminBonuses },
];

export default function Admin() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [tab, setTab] = useState('players');

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <div className="w-8 h-8 border-4 border-amber-300/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-stone-950 text-center px-4">
        <Shield className="w-10 h-10 text-amber-400" />
        <p className="text-amber-100" style={{ fontFamily: 'Georgia, serif' }}>Admin access requires sign in.</p>
        <Link to="/login" className="px-5 py-2 rounded-lg bg-amber-400 text-stone-900 font-bold italic" style={{ fontFamily: 'Georgia, serif' }}>Sign In</Link>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-stone-950 text-center px-4">
        <Shield className="w-10 h-10 text-rose-400" />
        <p className="text-amber-100" style={{ fontFamily: 'Georgia, serif' }}>Admins only. Your account does not have admin access.</p>
        <button onClick={() => { window.location.href = '/'; }} className="text-amber-300 italic">← Back to lobby</button>
      </div>
    );
  }

  const Active = TABS.find(t => t.id === tab).comp;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-amber-950/40 to-stone-950 pb-10">
      <header className="sticky top-0 z-20 bg-stone-950/90 backdrop-blur-xl border-b border-amber-700/30">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => { window.location.href = '/'; }} title="Back" className="flex items-center justify-center w-9 h-9 rounded-lg text-stone-300 hover:text-amber-200 hover:bg-black/40 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-amber-300" />
            <h1 className="text-base font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Admin Panel</h1>
          </div>
        </div>
      </header>
      <main className="max-w-md mx-auto px-4 py-5 flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-2">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-colors ${active ? 'bg-amber-400 text-stone-900 border-amber-300' : 'bg-black/30 text-amber-100/80 border-amber-700/40 hover:bg-black/50'}`} style={{ fontFamily: 'Georgia, serif' }}>
                <Icon className="w-5 h-5" /><span className="text-[11px] font-bold italic">{t.label}</span>
              </button>
            );
          })}
        </div>
        <Active />
      </main>
    </div>
  );
}