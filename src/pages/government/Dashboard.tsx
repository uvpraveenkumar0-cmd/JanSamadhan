import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, CheckCircle2, Clock, TrendingUp, AlertTriangle, Building2, Handshake, BarChart2, ArrowRight } from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, StatCard, SkeletonCard, SectionHeader } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { ProgressBar, AnimatedCounter } from '../../components/ui/Progress';
import { containerVariants, cardVariants, MOTION } from '../../config/motion';
import { problemService } from '../../services/problemService';
import { governmentService } from '../../services/governmentService';
import { formatDate, STATUS_LABELS, DOMAIN_LABELS } from '../../lib/utils';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';
import type { Problem } from '../../types';

export default function GovernmentDashboard() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedTraceProblemId, setSelectedTraceProblemId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      problemService.getAll(),
      governmentService.getAnalyticsByDomain(),
    ]).then(([probs, analytics]) => {
      setProblems(probs);
      setAnalytics(analytics);
      setLoading(false);
    });
  }, []);

  const queue = problems.filter(p => {
    const vs = (p.verification_status || '').toLowerCase();
    const s = (p.status || '').toLowerCase();
    return vs === 'pending' || ['submitted', 'ai_analysis', 'government_review'].includes(s);
  });

  const readyForMatching = problems.filter(p => {
    const vs = p.verification_status === 'Verified';
    const isNotAllocated = p.allocation_status === 'Not Allocated' || !p.assigned_university;
    return vs && isNotAllocated;
  });

  const kpis = [
    { label: 'Total Submissions',  value: problems.length,                               icon: <FileText size={18} />,      color: 'blue'   as const },
    { label: 'Pending Review',     value: queue.length,                                  icon: <Clock size={18} />,         color: 'yellow' as const },
    { label: 'Ready for Matching', value: readyForMatching.length,                        icon: <Building2 size={18} />,     color: 'purple' as const },
    { label: 'Verified / Active',  value: problems.filter(p => p.verification_status === 'Verified').length, icon: <CheckCircle2 size={18} />, color: 'green' as const },
  ];

  return (
    <PageTransition>
      <SectionHeader
        title="Command Centre"
        subtitle="Jharkhand Innovation Hub — Government Dashboard"
      />

      {/* KPI Cards */}
      <motion.div variants={containerVariants(MOTION.stagger.sm)} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <motion.div key={i} variants={cardVariants}>
            {loading ? <SkeletonCard lines={1} /> : <StatCard {...kpi} />}
          </motion.div>
        ))}
      </motion.div>

      {/* Alert Banner: Pending Verification */}
      {queue.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mb-4 p-4 bg-warning-50 border border-warning-200 rounded-xl flex items-center gap-3"
        >
          <AlertTriangle size={18} className="text-warning-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-surface-900">{queue.length} problems awaiting verification</p>
            <p className="text-xs text-surface-500">Citizen submissions requiring on-ground administrative review</p>
          </div>
          <Link to="/government/verification">
            <button className="btn-primary btn-sm">Review Queue</button>
          </Link>
        </motion.div>
      )}

      {/* Alert Banner: Ready for AI Matching */}
      {readyForMatching.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-3"
        >
          <Building2 size={18} className="text-purple-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-purple-900">{readyForMatching.length} verified problems ready for AI Matching</p>
            <p className="text-xs text-purple-600">Eligible for academic capability ranking and official allocation</p>
          </div>
          <Link to="/government/matching">
            <button className="btn-primary btn-sm bg-purple-600 hover:bg-purple-700">Start AI Matching</button>
          </Link>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Queue Preview */}
        <Card padding="none">
          <div className="flex items-center justify-between p-4 border-b border-surface-100">
            <h3 className="text-sm font-semibold text-surface-900">Verification Queue</h3>
            <Link to="/government/verification" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i=><SkeletonCard key={i} lines={1}/>)}</div>
          ) : (
            <motion.div variants={containerVariants()} initial="initial" animate="animate">
              {queue.slice(0, 4).map(p => (
                <motion.div key={p.id} variants={cardVariants}>
                  <div className="flex items-center gap-3 p-4 border-b border-surface-50 last:border-0 hover:bg-surface-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">{p.title}</p>
                      <p className="text-xs text-surface-400 mt-0.5">
                        <button
                          onClick={() => setSelectedTraceProblemId(p.id)}
                          className="font-mono font-bold text-primary-600 hover:underline"
                          title="Inspect Ecosystem Trace"
                        >
                          {p.id}
                        </button>{' '}
                        · {p.district} · {formatDate(p.submittedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={p.status} label={STATUS_LABELS[p.status] ?? p.status} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </Card>

        {/* Domain Breakdown */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">Problems by Domain</h3>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i=><div key={i} className="skeleton h-8 rounded"/>)}</div>
          ) : (
            <div className="space-y-3">
              {(analytics ?? []).slice(0, 6).map((d: any) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-xs text-surface-600 w-24 shrink-0">{d.name}</span>
                  <div className="flex-1">
                    <ProgressBar value={d.value} max={250} size="sm" color="primary" />
                  </div>
                  <span className="text-xs font-semibold text-surface-700 w-8 text-right">{d.value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {[
          { label: 'AI Matching',     icon: <Building2 size={20} className="text-ai-600" />,      href: '/government/matching',    bg: 'bg-ai-50' },
          { label: 'District Map',    icon: <BarChart2 size={20} className="text-civic-600" />,    href: '/government/districts',   bg: 'bg-civic-50' },
          { label: 'Analytics',       icon: <TrendingUp size={20} className="text-success-600" />, href: '/government/analytics',   bg: 'bg-success-50' },
          { label: 'Audit Logs',      icon: <CheckCircle2 size={20} className="text-primary-600"/>,href: '/government/audit',       bg: 'bg-primary-50' },
        ].map(l => (
          <Link key={l.href} to={l.href}>
            <Card padding="sm" hover className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${l.bg}`}>{l.icon}</div>
              <span className="text-sm font-medium text-surface-700">{l.label}</span>
            </Card>
          </Link>
        ))}
      </div>

      {/* Lifecycle Trace Modal */}
      <ProblemEcosystemModal
        problemId={selectedTraceProblemId}
        isOpen={!!selectedTraceProblemId}
        onClose={() => setSelectedTraceProblemId(null)}
      />
    </PageTransition>
  );
}
