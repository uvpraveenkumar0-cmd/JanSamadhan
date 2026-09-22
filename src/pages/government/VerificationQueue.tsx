import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Copy,
  ChevronDown,
  AlertTriangle,
  Cpu,
  ArrowUpDown,
  MapPin,
  Users,
  Eye,
  Building2,
  Calendar,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader, SkeletonTable, EmptyState } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Drawer, Modal } from '../../components/ui/Modal';
import { containerVariants, cardVariants } from '../../config/motion';
import { problemService } from '../../services/problemService';
import { useApp } from '../../context/AppContext';
import { formatDate, formatDateTime, STATUS_LABELS, DOMAIN_LABELS } from '../../lib/utils';
import { cn } from '../../lib/utils';
import type { Problem } from '../../types';
import { AIReportCard } from '../../components/ai/AIReportCard';
import { aiReportStorage } from '../../services/aiReportStorage';
import { aiAnalysisService } from '../../services/aiAnalysisService';
import type { AIReport } from '../../types/aiReportTypes';

export default function VerificationQueue() {
  const { addToast, user } = useApp();
  const navigate = useNavigate();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Problem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Sorting
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'priority' | 'verified' | 'ready_matching'>('newest');

  // Confirmation Modals
  const [verifyConfirmOpen, setVerifyConfirmOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // AI Report for selected problem in drawer
  const [selectedAIReport, setSelectedAIReport] = useState<AIReport | null>(null);
  const [loadingAIReport, setLoadingAIReport] = useState(false);

  useEffect(() => {
    if (!selected) {
      setSelectedAIReport(null);
      return;
    }

    const existing = aiReportStorage.getAIReport(selected.id);
    if (existing) {
      setSelectedAIReport(existing);
      return;
    }

    // Auto-generate for legacy problems that haven't run through AI analysis yet
    let isCancelled = false;
    setLoadingAIReport(true);
    aiAnalysisService
      .analyzeProblem(selected, problems)
      .then((report) => {
        if (!isCancelled) {
          aiReportStorage.saveAIReport(report);
          setSelectedAIReport(report);
        }
      })
      .catch((err) => {
        console.error('Could not generate AI report:', err);
      })
      .finally(() => {
        if (!isCancelled) setLoadingAIReport(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selected, problems]);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await problemService.getAll();
      setProblems(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter logic
  const filtered = problems.filter(p => {
    const s = (p.status || '').toLowerCase();
    const vs = (p.verification_status || '').toLowerCase();
    const as = (p.allocation_status || '').toLowerCase();

    if (filter === 'pending_verification') {
      if (vs !== 'pending') return false;
    } else if (filter === 'verified') {
      if (vs !== 'verified') return false;
    } else if (filter === 'ready_matching') {
      if (vs !== 'verified' || (as !== 'not allocated' && !!p.assigned_university)) return false;
    } else if (filter === 'matching_completed') {
      if (as !== 'allocated' && as !== 'accepted') return false;
    } else if (filter === 'allocated') {
      if (as !== 'allocated') return false;
    } else if (filter === 'university_accepted') {
      if (as !== 'accepted') return false;
    } else if (filter === 'in_progress') {
      if (s !== 'in_progress') return false;
    } else if (filter === 'completed') {
      if (s !== 'deployed' && s !== 'completed') return false;
    } else if (filter === 'rejected') {
      if (vs !== 'rejected' && s !== 'rejected') return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const match =
        p.title.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.citizenName && p.citizenName.toLowerCase().includes(q)) ||
        (p.district && p.district.toLowerCase().includes(q)) ||
        (p.domain && p.domain.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'priority') {
      const order: Record<string, number> = { urgent: 4, critical: 4, high: 3, medium: 2, low: 1 };
      const aVal = order[a.priority] || order[a.severity] || 2;
      const bVal = order[b.priority] || order[b.severity] || 2;
      return bVal - aVal;
    }
    if (sortBy === 'verified') {
      const aTime = a.verifiedAt ? new Date(a.verifiedAt).getTime() : 0;
      const bTime = b.verifiedAt ? new Date(b.verifiedAt).getTime() : 0;
      return bTime - aTime;
    }
    if (sortBy === 'ready_matching') {
      const aReady = a.verification_status === 'Verified' && a.allocation_status === 'Not Allocated' ? 1 : 0;
      const bReady = b.verification_status === 'Verified' && b.allocation_status === 'Not Allocated' ? 1 : 0;
      return bReady - aReady;
    }
    // 'newest' default
    const aTime = new Date(a.submittedAt || a.created_at || 0).getTime();
    const bTime = new Date(b.submittedAt || b.created_at || 0).getTime();
    return bTime - aTime;
  });

  // Handle Verify Execution
  const confirmVerify = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const officerId = user?.id || 'u-gov-1';
      const officerName = user?.name || 'Rajesh Kumar IAS';
      const updated = await problemService.verifyProblem(
        selected.id,
        officerId,
        officerName,
        'Ground verification completed. Feasibility approved for AI University Matching.'
      );
      addToast({
        type: 'success',
        title: 'Problem Verified Successfully!',
        message: `${updated.id} is now verified and eligible for AI University Matching.`,
      });
      setSelected(updated);
      setVerifyConfirmOpen(false);
      await loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Verification failed', message: err.message || 'Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Execution
  const confirmReject = async () => {
    if (!selected) return;
    if (!rejectReason.trim()) {
      addToast({ type: 'warning', title: 'Reason required', message: 'Please enter a valid rejection reason.' });
      return;
    }
    setActionLoading(true);
    try {
      const officerId = user?.id || 'u-gov-1';
      const officerName = user?.name || 'Rajesh Kumar IAS';
      const updated = await problemService.rejectProblem(selected.id, officerId, officerName, rejectReason);
      addToast({
        type: 'error',
        title: 'Problem Rejected',
        message: `${updated.id} has been marked as rejected.`,
      });
      setSelected(updated);
      setRejectModalOpen(false);
      setRejectReason('');
      await loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Action failed', message: err.message || 'Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  const startMatchingForProblem = (problemId: string) => {
    setSelected(null);
    navigate(`/government/matching?problemId=${problemId}`);
  };

  return (
    <PageTransition>
      <SectionHeader
        title="Government Problem Queue"
        subtitle={`${problems.length} total registered problems across Jharkhand districts`}
        action={
          <Button
            variant="primary"
            icon={<Cpu size={16} />}
            onClick={() => navigate('/government/matching')}
          >
            Open AI Matching Hub
          </Button>
        }
      />

      {/* Filters & Search Toolbar */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 min-w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              className="input pl-10 text-sm w-full bg-white"
              placeholder="Search by Problem ID, title, citizen, district, category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Sorting Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-surface-200 rounded-xl">
            <ArrowUpDown size={14} className="text-surface-400" />
            <span className="text-xs text-surface-500 font-medium">Sort by:</span>
            <select
              className="text-xs font-semibold text-surface-800 bg-transparent border-0 cursor-pointer focus:ring-0 p-0"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
            >
              <option value="newest">Newest First</option>
              <option value="priority">Highest Priority</option>
              <option value="verified">Recently Verified</option>
              <option value="ready_matching">Ready for Matching</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-surface-400 font-medium mr-1 flex items-center gap-1">
            <Filter size={12} /> Status:
          </span>
          {[
            { id: 'all', label: 'All Problems' },
            { id: 'pending_verification', label: 'Pending Verification' },
            { id: 'verified', label: 'Verified' },
            { id: 'ready_matching', label: 'Ready for Matching' },
            { id: 'allocated', label: 'Allocated' },
            { id: 'university_accepted', label: 'University Accepted' },
            { id: 'rejected', label: 'Rejected' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer',
                filter === f.id
                  ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                  : 'bg-white text-surface-600 border-surface-200 hover:border-surface-300 hover:bg-surface-50'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Problems Table */}
      <Card padding="none" className="shadow-card-sm overflow-hidden">
        {loading ? (
          <SkeletonTable rows={6} />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={40} className="text-surface-400" />}
            title="No matching problems found"
            description={
              search ? 'Try adjusting your search criteria or filters.' : 'No problems currently match this filter.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50/50">
                  <th className="text-left text-xs font-bold text-surface-500 uppercase tracking-wider px-4 py-3">Problem ID & Title</th>
                  <th className="text-left text-xs font-bold text-surface-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Category</th>
                  <th className="text-left text-xs font-bold text-surface-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Citizen & Location</th>
                  <th className="text-left text-xs font-bold text-surface-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Priority</th>
                  <th className="text-left text-xs font-bold text-surface-500 uppercase tracking-wider px-4 py-3">Verification</th>
                  <th className="text-left text-xs font-bold text-surface-500 uppercase tracking-wider px-4 py-3 hidden xl:table-cell">Allocation</th>
                  <th className="text-right text-xs font-bold text-surface-500 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants()} initial="initial" animate="animate">
                {sorted.map(p => {
                  const isVer = p.verification_status === 'Verified';
                  const isRej = p.verification_status === 'Rejected';
                  const isPend = p.verification_status === 'Pending';
                  const isAlloc = p.allocation_status === 'Allocated' || p.allocation_status === 'Accepted';

                  return (
                    <motion.tr
                      key={p.id}
                      variants={cardVariants}
                      className="border-b border-surface-50 hover:bg-surface-50/70 transition-colors cursor-pointer"
                      onClick={() => setSelected(p)}
                    >
                      {/* ID & Title */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono font-bold text-xs text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                            {p.id}
                          </span>
                          <span className="text-2xs text-surface-400">
                            {formatDate(p.submittedAt || p.created_at || '')}
                          </span>
                        </div>
                        <p className="font-semibold text-surface-900 truncate max-w-sm">{p.title}</p>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <Badge variant="gray" size="sm">
                          {p.category || DOMAIN_LABELS[p.domain] || p.domain}
                        </Badge>
                      </td>

                      {/* Citizen & Location */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <p className="text-xs font-medium text-surface-800">{p.citizenName}</p>
                        <p className="text-2xs text-surface-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} /> {p.district}, Jharkhand
                        </p>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span
                          className={cn(
                            'text-2xs font-bold px-2 py-0.5 rounded uppercase tracking-wider',
                            p.priority === 'urgent'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : p.priority === 'high'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-surface-100 text-surface-700'
                          )}
                        >
                          {p.priority || 'medium'}
                        </span>
                      </td>

                      {/* Verification Status */}
                      <td className="px-4 py-3.5">
                        {isVer ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                            <CheckCircle2 size={13} /> Verified
                          </span>
                        ) : isRej ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded-md border border-red-200">
                            <XCircle size={13} /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                            <AlertTriangle size={13} /> Pending Review
                          </span>
                        )}
                      </td>

                      {/* Allocation Status */}
                      <td className="px-4 py-3.5 hidden xl:table-cell">
                        {p.allocation_status === 'Accepted' ? (
                          <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-200">
                            🏛 Accepted: {p.assigned_university_name}
                          </span>
                        ) : isAlloc ? (
                          <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-1 rounded border border-purple-200">
                            Allocated: {p.assigned_university_name}
                          </span>
                        ) : isVer ? (
                          <span className="text-xs text-emerald-600 font-medium bg-emerald-50/50 px-2 py-0.5 rounded">
                            Ready for Matching
                          </span>
                        ) : (
                          <span className="text-xs text-surface-400">Not Allocated</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="outline" icon={<Eye size={13} />} onClick={() => setSelected(p)}>
                            View
                          </Button>
                          {isVer && p.allocation_status === 'Not Allocated' && (
                            <Button
                              size="sm"
                              variant="primary"
                              icon={<Cpu size={13} />}
                              onClick={() => startMatchingForProblem(p.id)}
                            >
                              AI Match
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Problem Details Drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Problem Review & Verification" width="lg">
        {selected && (
          <div className="p-6 space-y-6">
            {/* Header with Badges */}
            <div className="border-b border-surface-100 pb-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md border border-primary-200">
                    {selected.id}
                  </span>
                  <h3 className="text-lg font-bold text-surface-900 mt-2">{selected.title}</h3>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {selected.verification_status === 'Verified' ? (
                    <Badge variant="official">✓ Government Verified</Badge>
                  ) : selected.verification_status === 'Rejected' ? (
                    <Badge variant="danger">Rejected</Badge>
                  ) : (
                    <Badge variant="warning">Verification Pending</Badge>
                  )}
                  <span className="text-2xs text-surface-400">
                    Allocation: {selected.allocation_status}
                  </span>
                </div>
              </div>
              <p className="text-xs text-surface-500">
                Submitted on {formatDateTime(selected.submittedAt || selected.created_at || '')}
              </p>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-surface-50 rounded-xl border border-surface-100">
                <p className="text-2xs text-surface-400 uppercase font-bold tracking-wider mb-0.5">Citizen Name</p>
                <p className="font-semibold text-surface-800">{selected.citizenName}</p>
                <p className="text-2xs text-surface-400 font-mono mt-0.5">{selected.citizenId}</p>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl border border-surface-100">
                <p className="text-2xs text-surface-400 uppercase font-bold tracking-wider mb-0.5">Location & District</p>
                <p className="font-semibold text-surface-800">{selected.district}, Jharkhand</p>
                <p className="text-2xs text-surface-500">{selected.location || selected.village || 'Hesag Panchayat'}</p>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl border border-surface-100">
                <p className="text-2xs text-surface-400 uppercase font-bold tracking-wider mb-0.5">Domain & Subcategory</p>
                <p className="font-semibold text-surface-800">{selected.category || selected.domain}</p>
                <p className="text-2xs text-surface-500">{selected.subcategory}</p>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl border border-surface-100">
                <p className="text-2xs text-surface-400 uppercase font-bold tracking-wider mb-0.5">Impact & Severity</p>
                <p className="font-semibold text-surface-800">{selected.affectedPopulation?.toLocaleString() || 100} people affected</p>
                <p className="text-2xs text-amber-700 font-bold uppercase">{selected.priority} priority</p>
              </div>
            </div>

            {/* Full Problem Description */}
            <div>
              <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5">Problem Description</p>
              <div className="p-4 bg-surface-50 rounded-xl border border-surface-100 text-sm text-surface-800 leading-relaxed">
                {selected.description}
              </div>
            </div>

            {/* Evidence & Documents */}
            <div>
              <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Supporting Evidence & Documents</p>
              <div className="flex gap-3 flex-wrap">
                {(selected.evidence && selected.evidence.length > 0 ? selected.evidence : ['ground-report-survey.pdf', 'field-photo.jpg']).map((file, i) => {
                  const displayName = typeof file === 'string' ? file : file.originalFileName;
                  return (
                    <div key={i} className="flex items-center gap-2 p-2.5 bg-white border border-surface-200 rounded-lg text-xs text-surface-700">
                      <span className="text-primary-600 font-bold">📄</span>
                      <span className="font-mono">{displayName}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Automated Problem Analysis Report */}
            <div className="border-t border-surface-100 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <p className="text-xs font-bold text-surface-700 dark:text-surface-200 uppercase tracking-wider">
                    Automated AI Grievance Assessment
                  </p>
                </div>
                {selectedAIReport && (
                  <span className="text-2xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                    Confidence: {selectedAIReport.verification.confidence}%
                  </span>
                )}
              </div>

              {loadingAIReport ? (
                <div className="p-8 rounded-2xl bg-surface-50 dark:bg-surface-800/30 border border-surface-200 dark:border-surface-700 flex flex-col items-center justify-center gap-2 text-center text-xs text-surface-500">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  <span className="font-medium">Synthesizing AI Grievance Report...</span>
                </div>
              ) : selectedAIReport ? (
                <AIReportCard
                  report={selectedAIReport}
                  mode="compact"
                  onViewSimilarProblem={(simId) => {
                    const found = problems.find((p) => p.id === simId);
                    if (found) setSelected(found);
                  }}
                />
              ) : (
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 text-xs text-surface-500">
                  Automated AI verification report not available for this grievance.
                </div>
              )}
            </div>

            {/* Verification Metadata if already reviewed */}
            {selected.verifiedBy && (
              <div className="p-4 bg-surface-50 rounded-xl border border-surface-200 text-xs space-y-1">
                <p className="text-surface-500 font-medium">
                  Verified by: <strong className="text-surface-800">{selected.verifiedBy}</strong> on {formatDateTime(selected.verifiedAt || '')}
                </p>
                {selected.verificationNotes && (
                  <p className="text-surface-600 italic">Notes: "{selected.verificationNotes}"</p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t border-surface-100 pt-5 space-y-3">
              <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">Officer Verification Actions</p>

              {selected.verification_status !== 'Verified' ? (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    icon={<CheckCircle2 size={16} />}
                    onClick={() => setVerifyConfirmOpen(true)}
                  >
                    Verify Problem
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    icon={<XCircle size={16} />}
                    onClick={() => setRejectModalOpen(true)}
                  >
                    Reject Problem
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      Problem is Verified and eligible for AI University Matching.
                    </div>
                  </div>
                  {selected.allocation_status === 'Not Allocated' ? (
                    <Button
                      variant="primary"
                      className="w-full"
                      size="md"
                      icon={<Cpu size={16} />}
                      onClick={() => startMatchingForProblem(selected.id)}
                    >
                      Start AI University Matching
                    </Button>
                  ) : (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                      <strong>Allocated to:</strong> {selected.assigned_university_name} ({selected.allocation_status})
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Confirmation Dialog: Verify Problem */}
      <Modal
        open={verifyConfirmOpen}
        onClose={() => setVerifyConfirmOpen(false)}
        title="Confirm Problem Verification"
      >
        <div className="p-4 space-y-4 text-center sm:text-left">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto sm:mx-0">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <h4 className="text-base font-bold text-surface-900 mb-1">Verify this problem?</h4>
            <p className="text-sm text-surface-600">
              This problem will become eligible for AI university matching after verification. An official notification will be dispatched to citizen{' '}
              <strong>{selected?.citizenName}</strong>.
            </p>
          </div>

          <div className="p-3 bg-surface-50 rounded-xl border border-surface-200 text-xs text-surface-700">
            <p className="font-bold text-surface-900 mb-0.5">{selected?.title}</p>
            <p className="font-mono text-surface-500">{selected?.id} · {selected?.district}</p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
            <Button variant="secondary" onClick={() => setVerifyConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={actionLoading} onClick={confirmVerify}>
              Confirm Verification
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rejection Dialog: Reason Required */}
      <Modal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Problem Submission"
      >
        <div className="p-4 space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
            <XCircle size={28} />
          </div>
          <div>
            <h4 className="text-base font-bold text-surface-900 mb-1">Reject Problem?</h4>
            <p className="text-sm text-surface-600">
              Please enter the administrative reason for rejecting this problem submission. This reason will be recorded in the audit log and shared with the citizen.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-600 mb-1">Rejection Reason (Required)</label>
            <textarea
              className="input w-full text-sm min-h-24"
              placeholder="e.g. Duplicate submission, invalid coordinates, or outside state operational mandate..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
            <Button variant="secondary" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={actionLoading} onClick={confirmReject}>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
