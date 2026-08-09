import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';

// Desktop-only left sidebar navigation. Renders a fixed vertical bar on lg+
// screens. On mobile the BottomNav bar is used instead (see BottomNavLayout).
export default function DesktopSidebar() {
  const { t } = useLanguage();
  const { pathname, search } = useLocation();

  const items = [
    { to: '/dashboard', label: t('Dashboard'), src: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/0bf2d07ee_file_000000009cf082119790d647b9b4d6d2.png' },
    { to: '/dashboard?tab=stack', label: t('Stack'), src: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/5ee916b61_file_0000000084f082119192d2d5866b87d5.png' },
    { to: '/', label: t('Play Games'), src: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/a37f15d57_file_00000000710c8207a086cbd3402c46e3.png', center: true },
    { to: '/dashboard?tab=vip', label: t('VIP'), src: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e130df042_file_00000000003c81fab9a795d126ebcf40.png' },
    { to: '/profile', label: t('Profile'), src: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/991ab5d3e_file_00000000a2b081fa9b55e7aca49962fc.png' },
  ];

  const isActive = (item) => {
    const [path, query] = item.to.split('?');
    if (item.center) return pathname === '/';
    if (pathname !== path) return false;
    if (query) return search === '?' + query;
    return !search;
  };

  return (
    <aside
      className="hidden lg:flex fixed left-0 top-0 bottom-0 z-30 w-20 flex-col items-center py-5 gap-3"
      style={{
        borderRight: '1px solid rgba(214,178,98,0.4)',
        background: 'rgba(10,9,8,0.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: '6px 0 22px rgba(0,0,0,0.55), inset -1px 0 0 rgba(255,240,200,0.12)',
      }}
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {item.center && <div className="my-1 h-px w-10 bg-amber-200/20" />}
          <Link
            to={item.to}
            className={`group flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg transition-all hover:bg-amber-200/5 active:scale-95 ${isActive(item) ? 'bg-amber-200/10' : ''}`}
          >
            <img
              src={item.src}
              alt={item.label}
              draggable={false}
              className={`block w-11 h-11 select-none transition-all group-hover:scale-110 ${isActive(item) ? 'scale-105 brightness-125' : ''}`}
              style={{ mixBlendMode: 'screen', filter: 'drop-shadow(0 2px 6px rgba(200,136,30,0.4))' }}
            />
            <span
              className={`text-[10px] font-bold italic tracking-wide text-center leading-tight transition-colors ${isActive(item) ? 'text-amber-200' : 'text-amber-100/85 group-hover:text-amber-200'}`}
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {item.label}
            </span>
          </Link>
        </React.Fragment>
      ))}
    </aside>
  );
}