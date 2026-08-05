import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Users, Receipt, SlidersHorizontal, Gift, Wallet } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import BackButton from '@/components/BackButton';
import WesternTitleBadge from '@/components/WesternTitleBadge';
import AdminPlayers from '@/components/admin/AdminPlayers';
import AdminTransactions from '@/components/admin/AdminTransactions';
import AdminGameSettings from '@/components/admin/AdminGameSettings';
import AdminBonuses from '@/components/admin/AdminBonuses';
import AdminBanners from '@/components/admin/AdminBanners';
import AdminPaymentAddresses from '@/components/admin/AdminPaymentAddresses';
import AdminStackBanner from '@/components/admin/AdminStackBanner';
import AdminNotices from '@/components/admin/AdminNotices';
import AdminTasks from '@/components/admin/AdminTasks';
import { Image, Layers, Megaphone, CheckCircle } from 'lucide-react';

const TABS = [
  { id: 'players', label: 'Players', icon: Users, comp: AdminPlayers },
  { id: 'transactions', label: 'Transactions', icon: Receipt, comp: AdminTransactions },
  { id: 'games', label: 'Game RTP', icon: SlidersHorizontal, comp: AdminGameSettings },
  { id: 'bonuses', label: 'Bonuses', icon: Gift, comp: AdminBonuses },
  { id: 'banners', label: 'Banners', icon: Image, comp: AdminBanners },
  { id: 'pay', label: 'Pay Addr', icon: Wallet, comp: AdminPaymentAddresses },
  { id: 'stack', label: 'Stack', icon: Layers, comp: AdminStackBanner },
  { id: 'notices', label: 'Notices', icon: Megaphone, comp: AdminNotices },
  { id: 'tasks', label: 'Tasks', icon: CheckCircle, comp: AdminTasks },
];

export default function Admin() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('players');

  // Redirect non-admins away from the admin page entirely.
  useEffect(() => {
    if (!isLoadingAuth && (!isAuthenticated || user?.role !== 'admin')) {
      navigate('/', { replace: true });
    }
  }, [isLoadingAuth, isAuthenticated, user, navigate]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <div className="w-8 h-8 border-4 border-amber-300/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const Active = TABS.find(t => t.id === tab).comp;

  return (
    <div className="min-h-screen bg-[#0b0b0d] pb-10">
      <header className="sticky top-0 z-20 backdrop-blur-xl" style={{ background: 'rgba(10,9,8,0.78)', borderBottom: '1px solid rgba(214,178,98,0.22)' }}>
        <div className="max-w-md lg:max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <BackButton />
          <div className="flex-1 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-amber-300" />
            <WesternTitleBadge size="lg">Admin Panel</WesternTitleBadge>
          </div>
        </div>
      </header>
      <main className="max-w-md lg:max-w-6xl mx-auto px-4 py-5 flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-2">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="flex flex-col items-center gap-1 py-2.5 rounded-[8px] transition-colors" style={{ fontFamily: 'Georgia, serif', border: active ? '1px solid rgba(214,178,98,0.85)' : '1px solid rgba(214,178,98,0.3)', background: active ? 'linear-gradient(to bottom,#f5c542,#c8881e)' : 'rgba(20,17,13,0.6)', color: active ? '#2a1a06' : '#e8c878' }}>
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