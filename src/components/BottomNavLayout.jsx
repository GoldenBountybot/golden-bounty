import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

// Layout that shows the persistent bottom navigation bar. Used for all
// non-game authenticated pages.
export default function BottomNavLayout() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  );
}