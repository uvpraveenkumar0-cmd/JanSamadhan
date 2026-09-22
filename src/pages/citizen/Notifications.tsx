import React from 'react';
import { useApp } from '../../context/AppContext';
import { PageTransition } from '../../components/ui/PageTransition';
import { SectionHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatRelativeTime } from '../../lib/utils';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { motion } from 'framer-motion';
import { containerVariants, cardVariants } from '../../config/motion';
import { cn } from '../../lib/utils';

const TYPE_COLORS: Record<string, string> = {
  success: 'bg-success-500', info: 'bg-primary-500',
  warning: 'bg-warning-500', error: 'bg-danger-500',
  ai_update: 'bg-ai-500', government_action: 'bg-primary-700',
  collaboration: 'bg-civic-500', funding: 'bg-success-600',
  deployment: 'bg-success-700', assignment: 'bg-primary-600',
  status_change: 'bg-teal-500', alert: 'bg-amber-500',
};

export default function CitizenNotifications() {
  const { notifications, user, markNotificationRead, markAllRead } = useApp();
  const myNotifs = notifications.filter(n => n.userId === user?.id);

  return (
    <PageTransition>
      <SectionHeader
        title="Notifications"
        subtitle={`${myNotifs.filter(n => !n.read).length} unread`}
        action={
          <Button variant="secondary" size="sm" icon={<CheckCheck size={14} />} onClick={markAllRead}>
            Mark all read
          </Button>
        }
      />
      {myNotifs.length === 0 ? (
        <div className="text-center py-20 text-surface-400">
          <Bell size={40} className="mx-auto mb-3 text-surface-300" />
          <p className="text-sm font-medium">No notifications yet</p>
        </div>
      ) : (
        <motion.div variants={containerVariants()} initial="initial" animate="animate" className="space-y-2">
          {myNotifs.map(n => (
            <motion.div key={n.id} variants={cardVariants}
              className={cn('flex items-start gap-3 p-4 rounded-xl border transition-colors', n.read ? 'bg-white border-surface-200' : 'bg-primary-50/40 border-primary-100')}
              onClick={() => markNotificationRead(n.id)}
            >
              <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', n.read ? 'bg-transparent' : (TYPE_COLORS[n.type] ?? 'bg-primary-500'))} />
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm', n.read ? 'font-medium text-surface-700' : 'font-semibold text-surface-900')}>{n.title}</p>
                <p className="text-xs text-surface-500 mt-0.5">{n.message}</p>
                <p className="text-2xs text-surface-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </PageTransition>
  );
}
