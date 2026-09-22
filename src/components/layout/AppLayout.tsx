import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { ToastManager } from '../ui/Toast';
import { cn } from '../../lib/utils';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 64 : 240;

  return (
    <div className="app-shell min-h-screen bg-surface-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <TopNav sidebarWidth={sidebarWidth} />

      {/* Main Content */}
      <main
        className="min-h-screen transition-[padding] duration-200"
        style={{ paddingLeft: sidebarWidth, paddingTop: 56 }}
      >
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>

      <ToastManager />
    </div>
  );
}
