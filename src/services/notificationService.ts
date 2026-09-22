// Notification service
import type { Notification, NotificationType } from '../types';
import { SAMPLE_NOTIFICATIONS } from '../data/mockData';

import { db } from './db';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

function getAll(): Notification[] {
  const dbNotifs = db.getNotifications();
  if (dbNotifs.length > 0) return dbNotifs;
  // Seed with sample notifications
  for (const s of SAMPLE_NOTIFICATIONS) {
    db.createNotification(s);
  }
  return db.getNotifications();
}

export const notificationService = {
  async getForUser(userId: string): Promise<Notification[]> {
    await delay(100);
    return getAll().filter(n => n.userId === userId || n.userId === 'all');
  },

  async markRead(id: string): Promise<void> {
    db.markNotificationRead(id);
  },

  async markAllRead(userId: string): Promise<void> {
    db.markAllNotificationsRead(userId);
  },

  async push(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> {
    return db.createNotification(notification);
  },

  getUnreadCount(userId: string): number {
    return getAll().filter(n => n.userId === userId && !n.read).length;
  },
};
