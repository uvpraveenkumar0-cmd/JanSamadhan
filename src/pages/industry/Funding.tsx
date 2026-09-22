import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, StatCard, SectionHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar, AnimatedCounter } from '../../components/ui/Progress';
import { containerVariants, cardVariants, MOTION } from '../../config/motion';
import { industryService } from '../../services/industryService';
import { formatCurrency } from '../../lib/utils';
import type { FundingRequest } from '../../types';

export default function IndustryFunding() {
  const [requests, setRequests] = useState<FundingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    industryService.getFundingRequests('i1').then(r => { setRequests(r); setLoading(false); });
  }, []);

  const totalApproved  = requests.reduce((a, r) => a + (r.approvedAmount ?? 0), 0);
  const totalUtilized  = requests.reduce((a, r) => a + (r.utilizedAmount ?? 0), 0);
  const totalRequested = requests.reduce((a, r) => a + r.requestedAmount, 0);

  return (
    <PageTransition>
      <SectionHeader title="Funding Tracker" subtitle="All funding commitments and utilization" />

      <motion.div variants={containerVariants(MOTION.stagger.sm)} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Committed', value: formatCurrency(totalApproved), icon: <DollarSign size={18}/>, color: 'green' as const },
          { label: 'Utilized',        value: formatCurrency(totalUtilized), icon: <TrendingUp size={18}/>, color: 'blue' as const },
          { label: 'Remaining',       value: formatCurrency(totalApproved - totalUtilized), icon: <Clock size={18}/>, color: 'yellow' as const },
          { label: 'Active Projects', value: '1', icon: <CheckCircle2 size={18}/>, color: 'teal' as const },
        ].map((k, i) => (
          <motion.div key={i} variants={cardVariants}><StatCard {...k} /></motion.div>
        ))}
      </motion.div>

      {requests.map(req => (
        <Card key={req.id} padding="md" className="mb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-surface-900">{req.project}</h3>
              <p className="text-xs text-surface-400 mt-0.5">{req.purpose}</p>
            </div>
            <Badge variant={req.status === 'approved' ? 'success' : 'warning'}>{req.status}</Badge>
          </div>

          {/* Funding Progress */}
          <div className="mb-5 space-y-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-surface-600">Total Approved</span>
              <span className="font-bold text-surface-900">{formatCurrency(req.approvedAmount ?? 0)}</span>
            </div>
            <ProgressBar value={((req.utilizedAmount ?? 0) / (req.approvedAmount ?? 1)) * 100} size="lg" color="success" label="Utilized" showLabel />
          </div>

          {/* Milestones */}
          <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">Funding Milestones</h4>
          <div className="space-y-2">
            {req.milestones.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${m.status === 'utilized' ? 'bg-success-100 text-success-600' : m.status === 'released' ? 'bg-primary-100 text-primary-600' : 'bg-surface-200 text-surface-400'}`}>
                  {m.status === 'utilized' ? '✓' : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-surface-800">{m.title}</p>
                  <p className="text-2xs text-surface-400">Due: {new Date(m.dueDate).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-surface-900">{formatCurrency(m.amount)}</p>
                  <Badge variant={m.status === 'utilized' ? 'success' : m.status === 'released' ? 'primary' : 'gray'} size="sm">{m.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </PageTransition>
  );
}
