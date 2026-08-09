import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import DesktopSidebar from './DesktopSidebar';

// Layout that shows navigation. On desktop (lg+) a fixed left sidebar is
// rendered and the content gets left padding to clear it. On mobile the
// persistent bottom navigation bar is shown instead.
export default function BottomNavLayout() {
  return (
    <>
      <DesktopSidebar />
      <div className="lg:pl-20">
        <Outlet />
      </div>
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </>
  );
}