// Auth service — bridge to persistent real auth backend engine
import type { User, UserRole } from '../types';
import { authBackend } from './authBackend';
import { db, type StoredUser } from './db';

const STORAGE_KEY = 'jansamadhan_auth';

export const authService = {
  getCurrentUser(): (User & { status?: string; statusReason?: string; isVerified?: boolean; organizationName?: string }) | null {
    return authBackend.getCurrentUser();
  },

  login(role: UserRole): User {
    // Synchronous compatibility helper for any legacy callers
    db.initialize();
    const users = db.getUsers();
    const user = users.find((u) => u.role === role && u.status === 'active') || users[0];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  logout(): void {
    authBackend.logout();
  },

  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  },
};

