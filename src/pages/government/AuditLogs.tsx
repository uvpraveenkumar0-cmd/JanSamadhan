import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, User, Clock, Cpu, Building2, CheckCircle2 } from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { governmentService } from '../../services/governmentService';
import { formatDateTime } from '../../lib/utils';
import { containerVariants, cardVariants } from '../../config/motion';
import type { AuditEntry } from '../../types';
import { cn } from '../../lib/utils';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'Problem Submitted': <User size={14} className="text-success-600" />,
  'AI Analysis Completed': <Cpu size={14} className="text-ai-600" />,
  'Government Verification': <ShieldCheck size={14} className="text-primary-600" />,
  'AI University Matching': <Cpu size={14} className="text-ai-600" />,
  'University Allocation': <Building2 size={14} className="text-civic-600" />,
  'Faculty Assignment': <User size={14} className="text-faculty-600" />,
  'Team Formation': <User size={14} className="text-warning-600" />,
  'Industry Collaboration Approved': <CheckCircle2 size={14} className="text-success-600" />,
  'Funding Approved': <CheckCircle2 size={14} className="text-success-600" />,
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    governmentService.getAuditLog().then(l => { setLogs(l); setLoading(false); });
  }, []);

  return (
    <PageTransition>
      <SectionHeader
        title="Audit Trail"
        subtitle="Complete audit log for demo problem JH-2026-00125 — Smart Water Quality Monitoring"
      />

      <div className="max-w-3xl">
        <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg text-xs text-primary-700">
          ℹ Every action on the platform is logged with: who performed it, their role, timestamp, AI recommendation (if any), and government decision. This ensures full auditability and accountability.
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-surface-200" />

          <motion.div variants={containerVariants()} initial="initial" animate="animate" className="space-y-4">
            {loading ? (
              <div className="space-y-4">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}</div>
            ) : logs.map((log, i) => (
              <motion.div key={log.id} variants={cardVariants} className="flex gap-4 relative">
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-white border-2 border-surface-200 flex items-center justify-center shrink-0 relative z-10">
                  {ACTION_ICONS[log.action] ?? <Clock size={14} className="text-surface-400" />}
                </div>

                {/* Content */}
                <Card padding="md" className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-surface-900">{log.action}</p>
                      <p className="text-xs text-surface-400">{formatDateTime(log.timestamp)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={log.role === 'citizen' ? 'success' : log.role === 'government' ? 'official' : log.role === 'industry' ? 'gray' : 'primary'} size="sm">
                        {log.role}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mb-2">
                    <User size={12} className="text-surface-400" />
                    <span className="text-xs font-medium text-surface-600">{log.performedBy}</span>
                  </div>

                  <p className="text-xs text-surface-600 mb-2">{log.details}</p>

                  {/* AI Recommendation */}
                  {log.aiRecommendation && (
                    <div className="mt-2 p-2 bg-ai-50 border border-ai-200 border-dashed rounded-lg">
                      <p className="text-2xs text-ai-600 flex items-center gap-1">
                        <Cpu size={10} /> <span className="font-semibold">AI Recommended:</span> {log.aiRecommendation}
                      </p>
                    </div>
                  )}

                  {/* Government Decision */}
                  {log.governmentDecision && (
                    <div className="mt-2 p-2 bg-primary-50 border border-primary-200 rounded-lg">
                      <p className="text-2xs text-primary-700 flex items-center gap-1">
                        <ShieldCheck size={10} /> <span className="font-semibold">Official Decision:</span> {log.governmentDecision}
                      </p>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
