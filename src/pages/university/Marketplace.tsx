import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle2, X, MessageSquare, Droplets, Leaf, Zap, Heart, Building2, MapPin, Calendar, Check } from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader, SkeletonCard, EmptyState } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { containerVariants, cardVariants } from '../../config/motion';
import { problemService } from '../../services/problemService';
import { universityService } from '../../services/universityService';
import { useApp } from '../../context/AppContext';
import { DOMAIN_LABELS, formatDate } from '../../lib/utils';
import type { Problem } from '../../types';

const DOMAIN_ICONS: Record<string, React.ReactNode> = {
  water: <Droplets size={18} className="text-cyan-600" />,
  agriculture: <Leaf size={18} className="text-emerald-600" />,
  energy: <Zap size={18} className="text-yellow-600" />,
  healthcare: <Heart size={18} className="text-rose-600" />,
};

export default function UniversityMarketplace() {
  const { addToast, user } = useApp();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'assigned_to_me' | 'accepted'>('all');

  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [targetProb, setTargetProb] = useState<Problem | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const currentInstitutionId = user?.institutionId || 'univ1';

  const loadData = async () => {
    setLoading(true);
    try {
      const all = await problemService.getAll();
      setProblems(all);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAccept = async (p: Problem) => {
    setActionLoading(true);
    try {
      await universityService.respondToAllocation(p.id, currentInstitutionId, 'accept');
      addToast({ type: 'success', title: 'Problem Accepted', message: `Accepted problem ${p.id}: "${p.title}"` });
      await loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Action failed', message: err.message || 'Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  const openDecline = (p: Problem) => {
    setTargetProb(p);
    setDeclineReason('');
    setDeclineModalOpen(true);
  };

  const handleConfirmDecline = async () => {
    if (!targetProb) return;
    if (!declineReason.trim()) {
      addToast({ type: 'warning', title: 'Reason required', message: 'Please provide a decline reason.' });
      return;
    }
    setActionLoading(true);
    try {
      await universityService.respondToAllocation(targetProb.id, currentInstitutionId, 'decline', declineReason);
      addToast({ type: 'info', title: 'Problem Declined', message: `Declined assignment for ${targetProb.id}.` });
      setDeclineModalOpen(false);
      setTargetProb(null);
      await loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Action failed', message: err.message || 'Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = problems.filter(p => {
    if (filterTab === 'assigned_to_me') {
      if (p.assigned_university !== currentInstitutionId && p.allocation_status !== 'Allocated') return false;
    } else if (filterTab === 'accepted') {
      if (p.allocation_status !== 'Accepted') return false;
    } else {
      // 'all' shows assigned and verified
      if (p.verification_status !== 'Verified' && p.allocation_status !== 'Allocated' && p.allocation_status !== 'Accepted') {
        return false;
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        p.title.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <PageTransition>
      <SectionHeader title="Problem Marketplace" subtitle="Verified state problems allocated for institutional research" />

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search problems by title, ID, district..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All Open Problems' },
            { id: 'assigned_to_me', label: 'Assigned to My Institution' },
            { id: 'accepted', label: 'Accepted Projects' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                  : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={40} className="text-surface-400" />}
          title="No problems found"
          description="There are currently no problems matching the selected filter."
        />
      ) : (
        <motion.div variants={containerVariants()} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(p => {
            const isAssignedToUs = p.assigned_university === currentInstitutionId || p.allocation_status === 'Allocated';
            const isAccepted = p.allocation_status === 'Accepted';

            return (
              <motion.div key={p.id} variants={cardVariants} whileHover={{ scale: 1.005 }}>
                <Card padding="md" className="h-full flex flex-col justify-between shadow-card-sm">
                  <div>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="p-2 bg-surface-50 rounded-lg shrink-0">
                        {DOMAIN_ICONS[p.domain] ?? <CheckCircle2 size={18} className="text-surface-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-2xs font-bold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200">
                            {p.id}
                          </span>
                          <span className="text-2xs text-surface-400">{formatDate(p.submittedAt)}</span>
                        </div>
                        <h3 className="text-sm font-bold text-surface-900 truncate">{p.title}</h3>
                        <p className="text-xs text-surface-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} /> {p.district}, Jharkhand
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-surface-600 line-clamp-3 mb-3 leading-relaxed">{p.description}</p>

                    <div className="flex gap-2 flex-wrap mb-4">
                      <Badge variant="gray" size="sm">{p.category || DOMAIN_LABELS[p.domain] || p.domain}</Badge>
                      <Badge variant={p.severity === 'critical' ? 'danger' : p.severity === 'high' ? 'warning' : 'gray'} size="sm">
                        {p.severity}
                      </Badge>
                      <span className="text-xs text-surface-400">{p.affectedPopulation?.toLocaleString() || 100} affected</span>
                    </div>
                  </div>

                  <div className="border-t border-surface-100 pt-3">
                    {isAccepted ? (
                      <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg font-bold border border-emerald-200">
                        <span>✓ Accepted by Institution</span>
                        <span className="text-2xs font-normal text-emerald-600">Phase: Research Initiation</span>
                      </div>
                    ) : isAssignedToUs ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          className="flex-1"
                          icon={<Check size={14} />}
                          loading={actionLoading}
                          onClick={() => handleAccept(p)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          icon={<X size={14} />}
                          loading={actionLoading}
                          onClick={() => openDecline(p)}
                        >
                          Decline
                        </Button>
                      </div>
                    ) : (
                      <div className="text-xs text-surface-500 bg-surface-50 p-2 rounded text-center">
                        Verified State Problem · Available for Government Allocation
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Decline Reason Modal */}
      <Modal open={declineModalOpen} onClose={() => setDeclineModalOpen(false)} title="Decline Assignment">
        <div className="p-4 space-y-4">
          <p className="text-xs text-surface-600">
            Please enter the reason for declining problem <strong>{targetProb?.id}</strong>:
          </p>
          <textarea
            className="input w-full text-sm min-h-24"
            placeholder="Reason for declining..."
            value={declineReason}
            onChange={e => setDeclineReason(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeclineModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={actionLoading} onClick={handleConfirmDecline}>
              Confirm Decline
            </Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
