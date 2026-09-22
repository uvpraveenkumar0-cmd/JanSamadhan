import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole, Notification } from '../types';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';

// ─── Toast ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AppContextValue {
  user: User | null;
  login: (role: UserRole) => void;
  setUser: (user: User | null) => void;
  refreshUser: () => void;
  logout: () => void;
  notifications: Notification[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  // Demo scenario state
  demoState: DemoState;
  advanceDemoState: (step: DemoStep) => void;
}

export type DemoStep =
  | 'submitted'
  | 'ai_analyzed'
  | 'gov_verified'
  | 'university_matched'
  | 'university_allocated'
  | 'university_accepted'
  | 'faculty_assigned'
  | 'team_formed'
  | 'research_done'
  | 'prototype_ready'
  | 'industry_collaborated'
  | 'funding_approved'
  | 'testing_done'
  | 'pilot_deployed'
  | 'gov_validated'
  | 'deployed';

interface DemoState {
  currentStep: DemoStep;
  completedSteps: DemoStep[];
}

const DEMO_STATE_KEY = 'jansamadhan_demo_state';

function getInitialDemoState(): DemoState {
  try {
    const raw = localStorage.getItem(DEMO_STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { currentStep: 'submitted', completedSteps: [] };
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [demoState, setDemoState] = useState<DemoState>(getInitialDemoState);

  // Load notifications when user changes
  useEffect(() => {
    if (!user) return;
    notificationService.getForUser(user.id).then(setNotifications);
  }, [user]);

  const login = useCallback((role: UserRole) => {
    const u = authService.login(role);
    setUser(u);
  }, []);

  const refreshUser = useCallback(() => {
    const u = authService.getCurrentUser();
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setNotifications([]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    notificationService.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    if (!user) return;
    notificationService.markAllRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [user]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}`;
    const duration = toast.duration ?? 4000;
    setToasts(prev => [...prev, { ...toast, id, duration }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration + 500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const advanceDemoState = useCallback((step: DemoStep) => {
    setDemoState(prev => {
      const next: DemoState = {
        currentStep: step,
        completedSteps: Array.from(new Set([...prev.completedSteps, step])),
      };
      localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{
      user, login, setUser, refreshUser, logout,
      notifications, unreadCount, markNotificationRead, markAllRead,
      toasts, addToast, removeToast,
      demoState, advanceDemoState,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
