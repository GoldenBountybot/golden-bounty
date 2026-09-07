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
import AdminBonusCampaigns from '@/components/admin/AdminBonusCampaigns';
import AdminUserBonuses from '@/components/admin/AdminUserBonuses';
import AdminBanners from '@/components/admin/AdminBanners';
import AdminPaymentAddresses from '@/components/admin/AdminPaymentAddresses';
import AdminStackBanner from '@/components/admin/AdminStackBanner';
import AdminNotices from '@/components/admin/AdminNotices';
import AdminTasks from '@/components/admin/AdminTasks';
import AdminXPosts from '@/components/admin/AdminXPosts';
import AdminSupport from '@/components/admin/AdminSupport';
import AdminGameStats from '@/components/admin/AdminGameStats';
import AdminPgCurrency from '@/components/admin/AdminPgCurrency';
import AdminAgents from '@/components/admin/AdminAgents';
import AdminFinance from '@/components/admin/AdminFinance';
import AdminProviderReport from '@/components/admin/AdminProviderReport';
import AdminShell from '@/components/admin/AdminShell';
import AdminTabsNav from '@/components/admin/AdminTabsNav';
import { Image, Layers, Megaphone, CheckCircle, MessageCircle, BarChart3, FileSpreadsheet, LineChart, Handshake, Target } from 'lucide-react';

const TABS = [
  { id: 'players', label: 'Players', icon: Users, comp: AdminPlayers, group: 'Operations', desc: 'Manage player accounts, balances and bans' },
  { id: 'agents', label: 'Agents', icon: Shield, comp: AdminAgents, group: 'Operations', desc: 'Agent accounts and transfer limits' },
  { id: 'transactions', label: 'Transactions', icon: Receipt, comp: AdminTransactions, group: 'Operations', desc: 'Approve or reject deposits and withdrawals' },
  { id: 'support', label: 'Support', icon: MessageCircle, comp: AdminSupport, group: 'Operations', desc: 'Live chat with players' },
  { id: 'finance', label: 'Finance', icon: LineChart, comp: AdminFinance, group: 'Reports', desc: 'Monthly deposits, withdrawals and net profit' },
  { id: 'stats', label: 'Game Stats', icon: BarChart3, comp: AdminGameStats, group: 'Reports', desc: 'Bets, wins and house edge per game' },
  { id: 'provider', label: 'Provider Report', icon: Handshake, comp: AdminProviderReport, group: 'Reports', desc: 'Traffic, GGR and retention metrics to send to game providers' },
  { id: 'games', label: 'Game RTP', icon: SlidersHorizontal, comp: AdminGameSettings, group: 'Configuration', desc: 'Winning chance and bet limits per game' },
  { id: 'bonuses', label: 'Bonuses', icon: Gift, comp: AdminBonuses, group: 'Configuration', desc: 'Signup, daily and deposit bonuses' },
  { id: 'depbonus', label: 'Deposit Bonus', icon: Gift, comp: AdminBonusCampaigns, group: 'Configuration', desc: 'Deposit bonus campaigns, wagering multipliers and game contributions' },
  { id: 'userbonus', label: 'Player Bonuses', icon: Target, comp: AdminUserBonuses, group: 'Reports', desc: 'Granted bonuses, deposit source and turnover progress per player' },
  { id: 'pay', label: 'Pay Addr', icon: Wallet, comp: AdminPaymentAddresses, group: 'Configuration', desc: 'Deposit wallet addresses and QR codes' },
  { id: 'tasks', label: 'Tasks', icon: CheckCircle, comp: AdminTasks, group: 'Configuration', desc: 'Social tasks and token rewards' },
  { id: 'pgcurrency', label: 'PG USD', icon: FileSpreadsheet, comp: AdminPgCurrency, group: 'Configuration', desc: 'PG SOFT currency registration forms' },
  { id: 'banners', label: 'Banners', icon: Image, comp: AdminBanners, group: 'Content', desc: 'Home page promotional banners' },
  { id: 'stack', label: 'Stack', icon: Layers, comp: AdminStackBanner, group: 'Content', desc: 'Stack page banner image' },
  { id: 'notices', label: 'Notices', icon: Megaphone, comp: AdminNotices, group: 'Content', desc: 'Broadcast notifications to all users' },
  { id: 'xposts', label: 'X Posts', icon: CheckCircle, comp: AdminXPosts, group: 'Content', desc: 'Review player X post submissions' },
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

  const activeTab = TABS.find(t => t.id === tab);
  const Active = activeTab.comp;

  return (
    <div className="min-h-screen bg-[#0b0b0d] pb-10">
      <header className="sticky top-0 z-20 backdrop-blur-xl" style={{ background: 'rgba(10,9,8,0.78)', borderBottom: '1px solid rgba(214,178,98,0.22)' }}>
        <div className="max-w-none mx-auto px-4 py-3 flex items-center gap-3">
          <BackButton />
          <div className="flex-1 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-amber-300" />
            <WesternTitleBadge size="lg">Admin Panel</WesternTitleBadge>
          </div>
        </div>
      </header>
      <main className="max-w-none mx-auto px-4 py-5 flex flex-col gap-4">
        <AdminTabsNav tabs={TABS} active={tab} onChange={setTab} />
        <AdminShell title={activeTab.label} description={activeTab.desc} icon={activeTab.icon}>
          <Active />
        </AdminShell>
      </main>
    </div>
  );
}