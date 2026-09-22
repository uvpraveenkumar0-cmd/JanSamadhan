import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, PlusCircle, Clock, CheckCircle2, ArrowRight, Droplets, Bell } from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, StatCard, SkeletonCard, SectionHeader } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/Progress';
import { containerVariants, cardVariants, MOTION } from '../../config/motion';
import { problemService } from '../../services/problemService';
import { useApp } from '../../context/AppContext';
import { formatDate, STATUS_LABELS } from '../../lib/utils';
import type { Problem } from '../../types';

export default function CitizenDashboard() {
  const { user, notifications } = useApp();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    problemService.getByCitizen(user.profileId).then(p => {
      setProblems(p);
      setLoading(false);
    });
  }, [user]);

  const stats = [
    { label: 'Problems Submitted', value: problems.length, icon: <FileText size={18} />, color: 'blue' as const },
    { label: 'Under Review',       value: problems.filter(p => ['submitted','ai_analysis','government_review'].includes(p.status)).length, icon: <Clock size={18} />, color: 'yellow' as const },
    { label: 'In Progress',        value: problems.filter(p => ['allocated','in_progress','testing','pilot'].includes(p.status)).length, icon: <CheckCircle2 size={18} />, color: 'teal' as const },
    { label: 'Deployed',           value: problems.filter(p => p.status === 'deployed').length, icon: <CheckCircle2 size={18} />, color: 'green' as const },
  ];

  return (
    <PageTransition>
      <SectionHeader
        title={`Welcome, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Track your submitted problems and see their progress"
        action={
          <Link to="/citizen/problems/new">
            <Button variant="primary" icon={<PlusCircle size={16} />}>Submit Problem</Button>
          </Link>
        }
      />

      {/* Stats */}
      <motion.div
        variants={containerVariants(MOTION.stagger.sm)}
        initial="initial" animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {stats.map((s, i) => (
          <motion.div key={i} variants={cardVariants}>
            {loading ? <SkeletonCard lines={1} /> : <StatCard {...s} />}
          </motion.div>
        ))}
      </motion.div>

      {/* Demo Problem Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="mb-6 p-4 bg-gradient-to-r from-civic-50 to-primary-50 border border-civic-200 rounded-xl flex items-start gap-3"
      >
        <Droplets size={20} className="text-civic-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-surface-900">Demo: Smart Water Quality Monitoring</p>
          <p className="text-xs text-surface-500 mt-0.5">
            Problem <strong>JH-2026-00125</strong> — Follow the full demo journey across all roles to see how citizen problems become deployed solutions.
          </p>
        </div>
        <Link to="/citizen/track">
          <Button variant="outline" size="sm" icon={<ArrowRight size={14} />} iconPosition="right">Track</Button>
        </Link>
      </motion.div>

      {/* Recent Problems */}
      <Card padding="none">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-100">
          <h3 className="text-base font-semibold text-surface-900">My Problems</h3>
          <Link to="/citizen/problems" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-4">
            {[1,2,3].map(i => <SkeletonCard key={i} lines={2} />)}
          </div>
        ) : problems.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={32} className="text-surface-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-surface-600 mb-1">No problems submitted yet</p>
            <p className="text-xs text-surface-400 mb-4">Share a challenge your community faces</p>
            <Link to="/citizen/problems/new">
              <Button variant="primary" size="sm">Submit Your First Problem</Button>
            </Link>
          </div>
        ) : (
          <motion.div variants={containerVariants()} initial="initial" animate="animate">
            {problems.slice(0, 5).map(p => (
              <motion.div key={p.id} variants={cardVariants}>
                <Link to="/citizen/track" className="flex items-start gap-4 p-4 sm:p-5 border-b border-surface-50 last:border-0 hover:bg-surface-50/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-surface-900 truncate">{p.title}</p>
                      <StatusBadge status={p.status} label={STATUS_LABELS[p.status] ?? p.status} />
                    </div>
                    <p className="text-xs text-surface-500 mb-2">{p.id} · {p.district} · {formatDate(p.submittedAt)}</p>
                    {p.status === 'in_progress' && (
                      <ProgressBar value={52} size="sm" color="primary" className="max-w-48" />
                    )}
                  </div>
                  <ArrowRight size={16} className="text-surface-400 shrink-0 mt-0.5" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>

      {/* Unread notifications */}
      {notifications.filter(n => !n.read && n.userId === user?.id).length > 0 && (
        <Card className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-primary-600" />
            <h3 className="text-sm font-semibold text-surface-900">Recent Updates</h3>
          </div>
          <div className="space-y-2">
            {notifications.filter(n => !n.read && n.userId === user?.id).slice(0, 3).map(n => (
              <div key={n.id} className="flex items-start gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium text-surface-800">{n.title}</p>
                  <p className="text-surface-500">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageTransition>
  );
}
