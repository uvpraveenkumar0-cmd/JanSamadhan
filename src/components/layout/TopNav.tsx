import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Search, ChevronDown, X, CheckCheck, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { formatRelativeTime } from '../../lib/utils';

// ─── Notification Dropdown ────────────────────────────────────────────────────

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const { notifications, unreadCount, markNotificationRead, markAllRead } = useApp();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-surface-200 shadow-card-lg z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between p-3 border-b border-surface-100">
        <h3 className="text-sm font-semibold text-surface-900">Notifications {unreadCount > 0 && <span className="text-primary-600">({unreadCount})</span>}</h3>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
            <CheckCheck size={12} /> Mark all read
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-surface-50">
        {notifications.length === 0 && (
          <p className="text-sm text-surface-500 text-center py-8">No notifications</p>
        )}
        {notifications.slice(0, 8).map(n => (
          <div
            key={n.id}
            onClick={() => { markNotificationRead(n.id); if (n.link) { navigate(n.link); onClose(); } }}
            className={cn(
              'flex gap-3 p-3 cursor-pointer hover:bg-surface-50 transition-colors',
              !n.read && 'bg-primary-50/40',
            )}
          >
            <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', n.read ? 'bg-transparent' : 'bg-primary-500')} />
            <div className="flex-1 min-w-0">
              <p className={cn('text-xs font-medium text-surface-900 truncate', !n.read && 'font-semibold')}>{n.title}</p>
              <p className="text-xs text-surface-500 mt-0.5 truncate-2">{n.message}</p>
              <p className="text-2xs text-surface-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

import { VerificationBadge } from '../auth/VerificationBadge';

// ─── Top Navigation ───────────────────────────────────────────────────────────

interface TopNavProps {
  sidebarWidth: number;
}

const ROLE_LABELS: Record<string, string> = {
  citizen:            'Citizen',
  government:         'Govt. Officer',
  government_admin:   'Govt. Admin',
  government_officer: 'Govt. Officer',
  university:         'University Admin',
  university_admin:   'University Admin',
  faculty:            'Faculty Mentor',
  student:            'Student',
  industry:           'Industry Partner',
  industry_admin:     'Industry Admin',
  industry_mentor:    'Industry Mentor',
  super_admin:        'Super Admin',
};

const ROLE_COLORS: Record<string, string> = {
  citizen:            'bg-success-100 text-success-700',
  government:         'bg-primary-100 text-primary-700',
  government_admin:   'bg-blue-100 text-blue-800',
  government_officer: 'bg-primary-100 text-primary-700',
  university:         'bg-civic-100 text-civic-700',
  university_admin:   'bg-sky-100 text-sky-800',
  faculty:            'bg-ai-100 text-ai-700',
  student:            'bg-warning-100 text-warning-700',
  industry:           'bg-surface-100 text-surface-700',
  industry_admin:     'bg-amber-100 text-amber-800',
  industry_mentor:    'bg-amber-100 text-amber-800',
  super_admin:        'bg-purple-100 text-purple-800',
};

export function TopNav({ sidebarWidth }: TopNavProps) {
  const { user, unreadCount } = useApp();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  if (!user) return null;

  // Breadcrumb from path
  const segments = location.pathname.split('/').filter(Boolean);
  const breadcrumb = segments.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' › ');

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between bg-white/90 backdrop-blur-sm border-b border-surface-200 px-4 h-14"
      style={{ left: sidebarWidth }}
    >
      {/* Breadcrumb */}
      <div>
        <p className="text-sm text-surface-500 hidden sm:block">{breadcrumb}</p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(v => !v)}
            className="relative p-2 text-surface-500 hover:text-surface-800 hover:bg-surface-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-2xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {showNotifications && (
              <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
          </AnimatePresence>
          {showNotifications && (
            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
          )}
        </div>

        {/* User pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-surface-200">
          <VerificationBadge status={user.status} isVerified={user.isVerified} size="sm" />
          <div className={cn('px-2 py-0.5 rounded-full text-2xs font-semibold hidden sm:block', ROLE_COLORS[user.role] || 'bg-slate-100 text-slate-700')}>
            {ROLE_LABELS[user.role] || user.role}
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-surface-900 leading-tight">{user.name}</p>
            <p className="text-2xs text-surface-400">{user.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
