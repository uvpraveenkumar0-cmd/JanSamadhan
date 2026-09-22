import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, CheckCircle2, Building2, Users, BarChart2,
  Settings, LogOut, ChevronLeft, ChevronRight, Bell, Search,
  Layers, FlaskConical, Handshake, DollarSign, Map, ClipboardList,
  BookOpen, Microscope, Cpu, Trophy, Home, Target, Briefcase,
  AlertCircle, MessageSquare, Award, FileSearch
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';
import type { UserRole } from '../../types';

import { ShieldAlert, ShieldCheck } from 'lucide-react';

// ─── Nav Items per role ────────────────────────────────────────────────────────

const govNav = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/government/dashboard' },
  { label: 'Problem Queue', icon: <CheckCircle2 size={18} />, href: '/government/verification' },
  { label: 'AI Matching', icon: <Cpu size={18} />, href: '/government/matching' },
  { label: 'Institutions', icon: <Building2 size={18} />, href: '/government/institutions' },
  { label: 'Industry Partners', icon: <Handshake size={18} />, href: '/government/industry' },
  { label: 'District Map', icon: <Map size={18} />, href: '/government/districts' },
  { label: 'Analytics', icon: <BarChart2 size={18} />, href: '/government/analytics' },
  { label: 'Audit Logs', icon: <ClipboardList size={18} />, href: '/government/audit' },
  { label: 'Reports', icon: <FileSearch size={18} />, href: '/government/reports' },
  { label: 'Settings', icon: <Settings size={18} />, href: '/government/settings' },
];

const univNav = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/university/dashboard' },
  { label: 'Problem Marketplace', icon: <Layers size={18} />, href: '/university/marketplace' },
  { label: 'Teams', icon: <Users size={18} />, href: '/university/teams' },
  { label: 'Faculty', icon: <BookOpen size={18} />, href: '/university/faculty' },
  { label: 'Projects', icon: <Briefcase size={18} />, href: '/university/projects' },
  { label: 'Industry Collab', icon: <Handshake size={18} />, href: '/university/industry' },
  { label: 'Analytics', icon: <BarChart2 size={18} />, href: '/university/analytics' },
];

const indNav = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/industry/dashboard' },
  { label: 'Discover Projects', icon: <Search size={18} />, href: '/industry/discover' },
  { label: 'Collaboration Requests', icon: <Handshake size={18} />, href: '/industry/requests' },
  { label: 'Workspace', icon: <Layers size={18} />, href: '/industry/workspace' },
  { label: 'Funding', icon: <DollarSign size={18} />, href: '/industry/funding' },
  { label: 'Pilot Deployment', icon: <Trophy size={18} />, href: '/industry/pilots' },
  { label: 'Analytics', icon: <BarChart2 size={18} />, href: '/industry/analytics' },
];

const navConfig: Record<UserRole, { label: string; icon: React.ReactNode; href: string }[]> = {
  citizen: [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/citizen/dashboard' },
    { label: 'My Problems', icon: <FileText size={18} />, href: '/citizen/problems' },
    { label: 'Submit Problem', icon: <Target size={18} />, href: '/citizen/problems/new' },
    { label: 'Track Status', icon: <CheckCircle2 size={18} />, href: '/citizen/track' },
    { label: 'Notifications', icon: <Bell size={18} />, href: '/citizen/notifications' },
    { label: 'Profile', icon: <Users size={18} />, href: '/citizen/profile' },
  ],
  government: govNav,
  government_officer: govNav,
  government_admin: govNav,
  super_admin: govNav,
  university: univNav,
  university_admin: univNav,
  faculty: [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/faculty/dashboard' },
    { label: 'My Projects', icon: <Briefcase size={18} />, href: '/faculty/projects' },
    { label: 'Students', icon: <Users size={18} />, href: '/faculty/students' },
    { label: 'Research', icon: <Microscope size={18} />, href: '/faculty/research' },
    { label: 'Prototypes', icon: <FlaskConical size={18} />, href: '/faculty/prototypes' },
    { label: 'Industry Collab', icon: <Handshake size={18} />, href: '/faculty/industry' },
    { label: 'Analytics', icon: <BarChart2 size={18} />, href: '/faculty/analytics' },
  ],
  faculty_member: [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/faculty/dashboard' },
    { label: 'My Projects', icon: <Briefcase size={18} />, href: '/faculty/projects' },
    { label: 'Students', icon: <Users size={18} />, href: '/faculty/students' },
    { label: 'Research', icon: <Microscope size={18} />, href: '/faculty/research' },
    { label: 'Prototypes', icon: <FlaskConical size={18} />, href: '/faculty/prototypes' },
    { label: 'Industry Collab', icon: <Handshake size={18} />, href: '/faculty/industry' },
    { label: 'Analytics', icon: <BarChart2 size={18} />, href: '/faculty/analytics' },
  ],
  student: [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/student/dashboard' },
    { label: 'My Team', icon: <Users size={18} />, href: '/student/team' },
    { label: 'Tasks', icon: <CheckCircle2 size={18} />, href: '/student/tasks' },
    { label: 'Field Research', icon: <Microscope size={18} />, href: '/student/research' },
    { label: 'Prototype', icon: <FlaskConical size={18} />, href: '/student/prototype' },
    { label: 'Industry Requests', icon: <Handshake size={18} />, href: '/student/industry' },
    { label: 'Feedback', icon: <MessageSquare size={18} />, href: '/student/feedback' },
    { label: 'Notifications', icon: <Bell size={18} />, href: '/student/notifications' },
  ],
  industry: indNav,
  industry_partner: indNav,
  industry_admin: indNav,
  industry_mentor: indNav,
};

const roleTitles: Record<UserRole, string> = {
  citizen: 'Citizen Portal',
  government: 'Government Portal',
  government_officer: 'Govt. Officer Portal',
  government_admin: 'Govt. Admin Portal',
  super_admin: 'State Command Center',
  university: 'University Portal',
  university_admin: 'University Admin Portal',
  faculty: 'Faculty Portal',
  faculty_member: 'Faculty Member Portal',
  student: 'Student Portal',
  industry: 'Industry Portal',
  industry_partner: 'Industry Partner Portal',
  industry_admin: 'Industry Admin Portal',
  industry_mentor: 'Industry Mentor Portal',
};

const roleColors: Record<UserRole, string> = {
  citizen: 'bg-success-600',
  government: 'bg-primary-700',
  government_officer: 'bg-primary-700',
  government_admin: 'bg-blue-800',
  super_admin: 'bg-purple-800',
  university: 'bg-civic-600',
  university_admin: 'bg-sky-800',
  faculty: 'bg-ai-600',
  faculty_member: 'bg-ai-600',
  student: 'bg-warning-600',
  industry: 'bg-surface-700',
  industry_partner: 'bg-surface-700',
  industry_admin: 'bg-amber-700',
  industry_mentor: 'bg-amber-700',
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  if (!user) return null;

  const items = navConfig[user.role];
  const title = roleTitles[user.role];
  const roleColor = roleColors[user.role];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-white border-r border-surface-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className={cn('flex items-center gap-2.5 px-3 py-4 border-b border-surface-100 shrink-0', collapsed && 'justify-center')}>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0', roleColor)}>
          JS
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <p className="text-xs font-bold text-surface-900 whitespace-nowrap leading-tight">JanSamadhan</p>
              <p className="text-2xs text-surface-500 whitespace-nowrap">{title}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {items.map(item => (
          <NavLink
            key={item.href}
            to={item.href}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
              collapsed && 'justify-center px-2',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900',
            )}
          >
            <span className="shrink-0">{item.icon}</span>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-surface-100 p-2 space-y-0.5 shrink-0">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium',
            'text-surface-500 hover:bg-danger-50 hover:text-danger-600 transition-colors duration-150',
            collapsed && 'justify-center',
          )}
        >
          <LogOut size={18} className="shrink-0" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute right-0 top-16 translate-x-1/2 w-5 h-5 bg-white border border-surface-200 rounded-full flex items-center justify-center shadow-sm text-surface-400 hover:text-surface-600 transition-colors z-10"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
