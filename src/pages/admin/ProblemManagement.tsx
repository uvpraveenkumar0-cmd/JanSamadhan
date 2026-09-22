// ─── AI Grievance Management Component ──────────────────────────────────────
// Modern Government Grievance Operations Center.
// Replaces the legacy Institutional Verification Center with an AI-assisted
// citizen grievance triage, prioritization, and routing workspace.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ClipboardCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  MapPin,
  Users,
  Building2,
  Calendar,
  Layers,
  ArrowUpDown,
  Tag,
  Cpu,
  Loader2,
  Check,
} from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader, EmptyState } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Drawer, Modal } from '../../components/ui/Modal';
import { problemService } from '../../services/problemService';
import { aiReportStorage } from '../../services/aiReportStorage';
import { aiAnalysisService } from '../../services/aiAnalysisService';
import { AIReportCard } from '../../components/ai/AIReportCard';
import { useApp } from '../../context/AppContext';
import { formatDateTime, formatDate, DOMAIN_LABELS } from '../../lib/utils';
import type { Problem } from '../../types';
import type { AIReport } from '../../types/aiReportTypes';

export const ProblemManagement: React.FC = () => {
  const { addToast, user } = useApp();
  const navigate = useNavigate();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'priority' | 'verified'>('newest');

  // Selected Problem Drawer State
  const [selected, setSelected] = useState<Problem | null>(null);
  const [selectedAIReport, setSelectedAIReport] = useState<AIReport | null>(null);
  const [loadingAIReport, setLoadingAIReport] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Officer Action Confirmation Modals
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await problemService.getAll();
      setProblems(list);
    } catch (err) {
      console.error('Failed to load grievances:', err);
      addToast({ type: 'error', title: 'Loading failed', message: 'Could not fetch complaints.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Load or generate AI report when a problem is selected in the review drawer
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
        console.error('Could not synthesize AI report:', err);
      })
      .finally(() => {
        if (!isCancelled) setLoadingAIReport(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selected, problems]);

  // Real backend metric calculations
  const newComplaintsCount = problems.filter(
    (p) => (p.verification_status || '').toLowerCase() === 'pending' || (p.status || '').toLowerCase() === 'pending_verification'
  ).length;

  const aiAnalyzedCount = problems.filter((p) => !!p.aiAnalysis || aiReportStorage.getAIReport(p.id) !== null).length;

  const highPriorityCount = problems.filter(
    (p) =>
      (p.priority || '').toLowerCase() === 'high' ||
      (p.priority || '').toLowerCase() === 'critical' ||
      (p.severity || '').toLowerCase() === 'critical'
  ).length;

  const resolvedCount = problems.filter(
    (p) =>
      (p.status || '').toLowerCase() === 'resolved' ||
      (p.status || '').toLowerCase() === 'completed' ||
      (p.status || '').toLowerCase() === 'deployed'
  ).length;

  // Filter logic
  const filtered = problems.filter((p) => {
    const s = (p.status || '').toLowerCase();
    const vs = (p.verification_status || '').toLowerCase();
    const as = (p.allocation_status || '').toLowerCase();
    const pri = (p.priority || p.severity || '').toLowerCase();

    if (filter === 'new') {
      if (vs !== 'pending' && s !== 'pending_verification') return false;
    } else if (filter === 'ai_analyzed') {
      const hasAI = !!p.aiAnalysis || aiReportStorage.getAIReport(p.id) !== null;
      if (!hasAI) return false;
    } else if (filter === 'high_priority') {
      if (pri !== 'high' && pri !== 'critical') return false;
    } else if (filter === 'assigned') {
      if (as === 'not allocated' && !p.assigned_university && !p.assigned_government_officer) return false;
    } else if (filter === 'in_progress') {
      if (s !== 'in_progress' && as !== 'accepted') return false;
    } else if (filter === 'resolved') {
      if (s !== 'resolved' && s !== 'completed' && s !== 'deployed') return false;
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
      const weight: Record<string, number> = { critical: 4, urgent: 4, high: 3, medium: 2, low: 1 };
      const aVal = weight[a.priority] || weight[a.severity] || 2;
      const bVal = weight[b.priority] || weight[b.severity] || 2;
      return bVal - aVal;
    }
    if (sortBy === 'verified') {
      const aTime = a.verifiedAt ? new Date(a.verifiedAt).getTime() : 0;
      const bTime = b.verifiedAt ? new Date(b.verifiedAt).getTime() : 0;
      return bTime - aTime;
    }
    const aTime = new Date(a.submittedAt || a.created_at || 0).getTime();
    const bTime = new Date(b.submittedAt || b.created_at || 0).getTime();
    return bTime - aTime;
  });

  // Officer decision handlers
  const handleVerify = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const officerId = user?.id || 'u-gov-1';
      const officerName = user?.name || 'Authorized Officer';
      const updated = await problemService.verifyProblem(
        selected.id,
        officerId,
        officerName,
        'Grievance assessed and verified for official departmental action and university R&D matching.'
      );
      addToast({
        type: 'success',
        title: 'Grievance Verified',
        message: `${updated.id} verified and queued for departmental routing.`,
      });
      setSelected(updated);
      setVerifyModalOpen(false);
      await loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Verification failed', message: err.message || 'Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    if (!rejectReason.trim()) {
      addToast({ type: 'warning', title: 'Reason required', message: 'Please specify rejection justification.' });
      return;
    }
    setActionLoading(true);
    try {
      const officerId = user?.id || 'u-gov-1';
      const officerName = user?.name || 'Authorized Officer';
      const updated = await problemService.rejectProblem(selected.id, officerId, officerName, rejectReason.trim());
      addToast({
        type: 'warning',
        title: 'Grievance Rejected',
        message: `${updated.id} marked as rejected.`,
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

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 font-sans">
        {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Admin</span>
          <span>&gt;</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">Problem Management</span>
        </div>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-cyan-500 text-white rounded-2xl shadow-md flex-shrink-0">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  AI Grievance Management
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Operations Center
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Review, prioritize, route and resolve citizen grievances with AI-assisted analysis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
            <Button
              variant="primary"
              size="sm"
              icon={<Cpu size={14} />}
              onClick={() => navigate('/government/matching')}
            >
              AI Matching Hub
            </Button>
          </div>
        </div>

        {/* ── Summary KPI Cards (Real Data) ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              <span>New Complaints</span>
              <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {newComplaintsCount}
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
              Awaiting review & triage
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              <span>AI Analyzed</span>
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {aiAnalyzedCount}
            </div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
              Automatically processed
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              <span>High Priority</span>
              <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {highPriorityCount}
            </div>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1">
              Needs immediate attention
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              <span>Active / Resolved</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {resolvedCount}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              In progress or completed
            </p>
          </div>
        </div>

        {/* ── Compact AI Processing Pipeline Workflow ──────────────────────── */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/60 via-white to-cyan-50/40 dark:from-slate-800 dark:via-slate-800 dark:to-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                AI Grievance Processing Pipeline
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">Automated Triage & Routing</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 text-center text-[11px]">
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-indigo-600 font-bold block">1. Received</span>
              <span className="text-slate-500 text-[10px]">Citizen record</span>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-indigo-600 font-bold block">2. AI Analysis</span>
              <span className="text-slate-500 text-[10px]">Natural NLP</span>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-indigo-600 font-bold block">3. Categorized</span>
              <span className="text-slate-500 text-[10px]">Domain & tags</span>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-indigo-600 font-bold block">4. Prioritized</span>
              <span className="text-slate-500 text-[10px]">Urgency metric</span>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-indigo-600 font-bold block">5. Duplicates</span>
              <span className="text-slate-500 text-[10px]">Nearby match</span>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-indigo-600 font-bold block">6. Summary</span>
              <span className="text-slate-500 text-[10px]">Officer brief</span>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-indigo-600 font-bold block">7. Department</span>
              <span className="text-slate-500 text-[10px]">Suggested route</span>
            </div>
            <div className="p-2 rounded-xl bg-indigo-100/70 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-800">
              <span className="text-indigo-900 dark:text-indigo-200 font-bold block">8. Review</span>
              <span className="text-indigo-700 dark:text-indigo-300 text-[10px]">Officer action</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
              <span className="text-emerald-700 dark:text-emerald-300 font-bold block">9. Resolution</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">Ground closure</span>
            </div>
          </div>
        </div>

        {/* ── Main Grievance Queue Section ─────────────────────────────────── */}
        <Card padding="none" className="overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Grievance Queue
                </h2>
                <span className="text-xs text-slate-400">({sorted.length} complaints)</span>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-medium">Sort by:</span>
                <select
                  className="font-semibold text-slate-700 dark:text-slate-200 bg-transparent border-0 cursor-pointer focus:ring-0 p-0 text-xs"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="newest">Newest First</option>
                  <option value="priority">Highest Priority</option>
                  <option value="verified">Recently Reviewed</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search complaints by tracking ID, problem title, citizen, location, domain..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
                <Filter size={12} /> Filters:
              </span>
              {[
                { id: 'all', label: 'All' },
                { id: 'new', label: 'New' },
                { id: 'ai_analyzed', label: 'AI Analyzed' },
                { id: 'high_priority', label: 'High Priority' },
                { id: 'assigned', label: 'Assigned' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'resolved', label: 'Resolved' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                    filter === f.id
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Loading citizen grievances...</span>
            </div>
          ) : sorted.length === 0 ? (
            <div className="p-12 text-center">
              <EmptyState
                icon={<ClipboardCheck size={40} className="text-slate-300 mx-auto mb-2" />}
                title="No grievances currently require review."
                description="No complaints matched your search and filter criteria."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="px-4 py-3.5">Tracking ID</th>
                    <th className="px-4 py-3.5">Problem</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Location</th>
                    <th className="px-4 py-3.5">Priority</th>
                    <th className="px-4 py-3.5">AI Status</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sorted.map((p) => {
                    const pri = (p.priority || p.severity || 'medium').toLowerCase();
                    const hasAI = !!p.aiAnalysis || aiReportStorage.getAIReport(p.id) !== null;

                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelected(p)}
                        className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer"
                      >
                        {/* Tracking ID */}
                        <td className="px-4 py-3 font-mono font-bold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
                          {p.problem_id || p.id}
                        </td>

                        {/* Problem */}
                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-semibold text-slate-900 dark:text-white truncate">
                            {p.title}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            By {p.citizenName || 'Citizen'} • {formatDate(p.submittedAt || p.created_at || '')}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {DOMAIN_LABELS[p.domain] || p.category || p.domain}
                          </span>
                        </td>

                        {/* Location */}
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {p.district || 'Jharkhand'}
                        </td>

                        {/* Priority */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              pri === 'critical'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                : pri === 'high'
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                                : pri === 'medium'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {pri}
                          </span>
                        </td>

                        {/* AI Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {hasAI ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                              <Sparkles className="w-3 h-3 text-cyan-500" />
                              AI Analyzed
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              Pending AI
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                              p.verification_status === 'Verified'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : p.verification_status === 'Rejected'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {p.verification_status === 'Verified'
                              ? 'Verified'
                              : p.verification_status === 'Rejected'
                              ? 'Rejected'
                              : 'Awaiting Review'}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="outline" icon={<Eye size={13} />} onClick={() => setSelected(p)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ── Problem Review Drawer ────────────────────────────────────────── */}
        <Drawer
          open={!!selected}
          onClose={() => setSelected(null)}
          title="Citizen Grievance Review & AI Triage"
          width="lg"
        >
          {selected && (
            <div className="p-6 space-y-6 text-slate-800 dark:text-slate-100">
              {/* Header */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800">
                      {selected.id}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                      {selected.title}
                    </h3>
                  </div>
                  <div>
                    {selected.verification_status === 'Verified' ? (
                      <Badge variant="official">✓ Government Verified</Badge>
                    ) : selected.verification_status === 'Rejected' ? (
                      <Badge variant="danger">Rejected</Badge>
                    ) : (
                      <Badge variant="warning">Awaiting Review</Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Submitted on {formatDateTime(selected.submittedAt || selected.created_at || '')}
                </p>
              </div>

              {/* Citizen & Location Meta Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Citizen</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{selected.citizenName}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selected.citizenId}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Location</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{selected.district}, Jharkhand</p>
                  <p className="text-[10px] text-slate-500">{selected.location || selected.village || 'Local Panchayat'}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Domain</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {selected.category || selected.domain}
                  </p>
                  <p className="text-[10px] text-slate-500">{selected.subcategory}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Impact</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {selected.affectedPopulation?.toLocaleString() || 100} citizens affected
                  </p>
                  <p className="text-[10px] text-orange-600 font-bold uppercase">{selected.priority} priority</p>
                </div>
              </div>

              {/* Full Description */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Citizen Description
                </p>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {selected.description}
                </div>
              </div>

              {/* Evidence */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Supporting Evidence & Documents
                </p>
                <div className="flex gap-2.5 flex-wrap">
                  {(selected.evidence && selected.evidence.length > 0 ? selected.evidence : ['ground-report.pdf']).map(
                    (file, i) => {
                      const displayName = typeof file === 'string' ? file : file.originalFileName;
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        >
                          <span className="text-indigo-600 font-bold">📄</span>
                          <span className="font-mono truncate max-w-[200px]">{displayName}</span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Automated AI Grievance Assessment */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      Automated AI Grievance Assessment
                    </p>
                  </div>
                  {selectedAIReport && (
                    <span className="text-2xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                      Confidence: {selectedAIReport.verification.confidence}%
                    </span>
                  )}
                </div>

                {loadingAIReport ? (
                  <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2 text-center text-xs text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    <span>Synthesizing AI Grievance Analysis...</span>
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
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                    Automated AI report not available for this complaint.
                  </div>
                )}
              </div>

              {/* Officer Verification Actions */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Officer Decision & Dispatch
                </p>

                {selected.verification_status !== 'Verified' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="primary"
                      size="md"
                      icon={<CheckCircle2 size={16} />}
                      onClick={() => setVerifyModalOpen(true)}
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
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        Grievance is officially verified and eligible for AI University Matching.
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      className="w-full"
                      size="md"
                      icon={<Cpu size={16} />}
                      onClick={() => navigate(`/government/matching`)}
                    >
                      Start AI University Matching
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </Drawer>

        {/* ── Verify Confirmation Modal ────────────────────────────────────── */}
        <Modal
          open={verifyModalOpen}
          onClose={() => setVerifyModalOpen(false)}
          title="Confirm Grievance Verification"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <p className="text-slate-600 dark:text-slate-300">
              Are you sure you want to verify <strong>{selected?.id}</strong>?
            </p>
            <p className="text-xs text-slate-500">
              This confirms the problem validity in Jharkhand government records and makes it available for departmental assignment and university R&D matching.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setVerifyModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" loading={actionLoading} onClick={handleVerify}>
                Confirm Verification
              </Button>
            </div>
          </div>
        </Modal>

        {/* ── Reject Modal ─────────────────────────────────────────────────── */}
        <Modal
          open={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title="Reject Grievance Submission"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <p className="text-slate-600 dark:text-slate-300">
              Please specify the official reason for rejecting grievance <strong>{selected?.id}</strong>:
            </p>
            <textarea
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
              placeholder="e.g., Incomplete information, outside municipal jurisdiction, or duplicate submission..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" loading={actionLoading} onClick={handleReject}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
};
export default ProblemManagement;
