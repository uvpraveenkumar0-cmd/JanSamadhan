import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Check,
  Building2,
  Star,
  ArrowRight,
  ChevronDown,
  AlertCircle,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Users,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader, EmptyState } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ProgressBar, AnimatedCounter } from '../../components/ui/Progress';
import { universityService, MATCHING_WEIGHTS } from '../../services/universityService';
import { problemService } from '../../services/problemService';
import { useApp } from '../../context/AppContext';
import { cn, formatDate, formatDateTime } from '../../lib/utils';
import type { UniversityMatch, Problem, MatchingFactors } from '../../types';
import { containerVariants, cardVariants, MOTION } from '../../config/motion';

const FACTOR_LABELS: Array<{ key: keyof MatchingFactors; label: string; weight: number }> = [
  { key: 'domainRelevance', label: 'Domain Relevance', weight: 25 },
  { key: 'universityExpertise', label: 'University Expertise', weight: 20 },
  { key: 'facultyAvailability', label: 'Faculty Availability', weight: 15 },
  { key: 'studentAvailability', label: 'Student Availability', weight: 10 },
  { key: 'infrastructure', label: 'Infrastructure Capability', weight: 10 },
  { key: 'previousExperience', label: 'Previous Experience', weight: 10 },
  { key: 'geographicRelevance', label: 'Geographic Relevance', weight: 5 },
  { key: 'projectCapacity', label: 'Project Capacity', weight: 5 },
];

const rankColors = ['bg-amber-500', 'bg-slate-400', 'bg-amber-700', 'bg-surface-400'];

const LOADING_STEPS = [
  'Analyzing problem requirements & domain classification...',
  'Querying accredited state and central universities...',
  'Computing multi-factor capability and infrastructure scores...',
  'Ranking eligible academic institutions...',
  'AI matching completed successfully.',
];

export default function AIMatching() {
  const { addToast, user } = useApp();
  const navigate = useNavigate();
  const { problemId: pathId } = useParams<{ problemId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentProblemId = pathId || searchParams.get('problemId');

  const [readyProblems, setReadyProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [matches, setMatches] = useState<UniversityMatch[]>([]);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  const [expanded, setExpanded] = useState<string | null>(null);

  // Allocation & Override Modals
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedTargetUni, setSelectedTargetUni] = useState<UniversityMatch | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [allocating, setAllocating] = useState(false);

  // 1. Fetch ready problems & load requested problem
  useEffect(() => {
    loadReadyProblems();
  }, [currentProblemId]);

  const loadReadyProblems = async () => {
    setLoadingProblems(true);
    try {
      const ready = await problemService.getReadyForMatching();
      setReadyProblems(ready);

      if (currentProblemId) {
        const prob = await problemService.getById(currentProblemId);
        if (prob) {
          setSelectedProblem(prob);
          // Only calculate matching if verified!
          if (prob.verification_status === 'Verified') {
            runAIMatching(prob.id);
          }
        } else {
          setSelectedProblem(null);
        }
      } else if (ready.length > 0) {
        // Default to first ready problem
        setSelectedProblem(ready[0]);
        runAIMatching(ready[0].id);
      } else {
        setSelectedProblem(null);
      }
    } finally {
      setLoadingProblems(false);
    }
  };

  const runAIMatching = async (problemId: string) => {
    setMatchingLoading(true);
    setLoadingStepIndex(0);

    // Multi-step loading sequence
    const interval = setInterval(() => {
      setLoadingStepIndex(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 280);

    try {
      const results = await universityService.getMatches(problemId);
      setMatches(results);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Matching Error', message: err.message || 'Failed to match universities.' });
    } finally {
      clearInterval(interval);
      setMatchingLoading(false);
    }
  };

  const handleSelectProblem = (id: string) => {
    setSearchParams({ problemId: id });
  };

  // Allocation Handlers
  const initiateAllocate = (match: UniversityMatch) => {
    setSelectedTargetUni(match);
    if (match.aiRecommendation) {
      setConfirmModalOpen(true);
    } else {
      setOverrideModalOpen(true);
    }
  };

  const handleConfirmOverride = () => {
    if (!overrideReason.trim()) {
      addToast({ type: 'warning', title: 'Override Reason Required', message: 'Please provide a justification for overriding the AI recommendation.' });
      return;
    }
    setOverrideModalOpen(false);
    setConfirmModalOpen(true);
  };

  const executeAllocation = async () => {
    if (!selectedProblem || !selectedTargetUni) return;
    setAllocating(true);
    try {
      const isOverride = !selectedTargetUni.aiRecommendation;
      const officer = {
        id: user?.id || 'u-gov-1',
        name: user?.name || 'Rajesh Kumar IAS',
        email: user?.email || 'rajesh@jharkhand.gov',
      };

      await universityService.allocate(
        selectedProblem.id,
        selectedTargetUni.universityId,
        officer,
        isOverride,
        isOverride ? overrideReason : undefined
      );

      addToast({
        type: 'success',
        title: 'University Allocated Successfully!',
        message: `${selectedTargetUni.university.name} has been officially assigned to ${selectedProblem.id}.`,
      });

      setConfirmModalOpen(false);
      setOverrideReason('');

      // Reload problem state to reflect allocation immediately
      const refreshed = await problemService.getById(selectedProblem.id);
      setSelectedProblem(refreshed);
      const ready = await problemService.getReadyForMatching();
      setReadyProblems(ready);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Allocation Failed', message: err.message || 'Could not allocate problem.' });
    } finally {
      setAllocating(false);
    }
  };

  if (loadingProblems) {
    return (
      <PageTransition>
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="skeleton h-10 w-72 rounded-xl" />
          <div className="skeleton h-44 rounded-xl" />
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </PageTransition>
    );
  }

  // If no problem exists or was found
  if (!selectedProblem) {
    return (
      <PageTransition>
        <EmptyState
          icon={<AlertTriangle size={48} className="text-amber-500" />}
          title="No Verified Problems Ready for Matching"
          description="Only government-verified problems with 'Not Allocated' status can enter the AI Matching Engine. Please review submitted problems first."
          action={
            <Button variant="primary" onClick={() => navigate('/government/verification')}>
              Go to Problem Queue
            </Button>
          }
        />
      </PageTransition>
    );
  }

  // Critical Business Rule Enforcement
  const isProblemVerified = selectedProblem.verification_status === 'Verified';
  const isAlreadyAllocated = selectedProblem.allocation_status === 'Allocated' || selectedProblem.allocation_status === 'Accepted';

  return (
    <PageTransition>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <SectionHeader
          title="AI University Matching Hub"
          subtitle="Accredited Institutional Capability & Domain Alignment Engine"
        />

        {/* Ready Problems Dropdown */}
        {readyProblems.length > 0 && (
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-surface-200 rounded-xl shadow-xs">
            <span className="text-xs text-surface-500 font-medium">Verified Problems ({readyProblems.length}):</span>
            <select
              className="text-xs font-bold text-primary-700 bg-transparent border-0 cursor-pointer focus:ring-0"
              value={selectedProblem.id}
              onChange={e => handleSelectProblem(e.target.value)}
            >
              {readyProblems.map(p => (
                <option key={p.id} value={p.id}>
                  {p.id} — {p.title.slice(0, 35)}... ({p.district})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Critical Business Rule Warning if Unverified */}
      {!isProblemVerified && (
        <Card padding="md" className="mb-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-900">Critical Business Rule: Problem Not Verified</h3>
              <p className="text-xs text-red-700 mt-1">
                Problem <strong>{selectedProblem.id}</strong> has verification status "
                {selectedProblem.verification_status}". Only verified problems are permitted to enter the AI Matching
                workflow.
              </p>
              <div className="mt-3">
                <Button size="sm" variant="danger" onClick={() => navigate('/government/verification')}>
                  Go to Problem Queue to Verify
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Problem Context Banner */}
      <Card padding="md" className="mb-6 border-l-4 border-l-primary-600 shadow-card-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-md border border-primary-200">
                {selectedProblem.id}
              </span>
              <h2 className="text-base font-bold text-surface-900">{selectedProblem.title}</h2>
            </div>
            <div className="flex items-center gap-4 text-xs text-surface-500 flex-wrap mt-2">
              <span className="flex items-center gap-1 font-medium text-surface-700">
                <MapPin size={13} className="text-primary-600" /> {selectedProblem.location || `${selectedProblem.district}, Jharkhand`}
              </span>
              <span>·</span>
              <span className="font-medium text-surface-700">
                Category: <strong>{selectedProblem.category || selectedProblem.domain}</strong>
              </span>
              <span>·</span>
              <span>Subcategory: {selectedProblem.subcategory}</span>
              <span>·</span>
              <span>Priority: <strong className="uppercase text-amber-700">{selectedProblem.priority}</strong></span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-2">
              {isProblemVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
                  <CheckCircle2 size={14} /> ✓ Government Verified
                </span>
              ) : (
                <Badge variant="warning">{selectedProblem.verification_status}</Badge>
              )}
            </div>
            <span className="text-2xs font-semibold text-surface-500">
              {isAlreadyAllocated ? (
                <span className="text-blue-700">Allocated to {selectedProblem.assigned_university_name}</span>
              ) : (
                <span className="text-emerald-700">Ready for University Matching</span>
              )}
            </span>
          </div>
        </div>
      </Card>

      {/* AI Advisory Disclaimer Notice */}
      <div className="mb-6 p-4 bg-purple-50/70 border border-purple-200 rounded-xl flex items-start gap-3">
        <Cpu size={20} className="text-purple-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-bold text-purple-900">AI Advisory Recommendation</p>
            <Badge variant="ai" size="sm"><Sparkles size={10} /> 8 Weighted Factors</Badge>
          </div>
          <p className="text-xs text-purple-700 leading-relaxed">
            AI recommendations are advisory only. Final allocation decision rests solely with the Government Officer.
            Officers may allocate the AI top recommendation or override with institutional justification.
          </p>
        </div>
      </div>

      {/* Already Allocated Notice */}
      {isAlreadyAllocated && (
        <Card padding="md" className="mb-6 bg-blue-50/80 border border-blue-200">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
                <Building2 size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-900">
                  Problem Officially Allocated to {selectedProblem.assigned_university_name}
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Allocated on {formatDateTime(selectedProblem.allocated_at || '')} by {selectedProblem.allocated_by} ({selectedProblem.allocation_type}).
                  Duplicate allocation is prohibited.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-white border border-blue-200 px-3 py-1.5 rounded-lg shadow-xs">
              ✓ Allocated
            </span>
          </div>
        </Card>
      )}

      {/* Matching Results Loading State */}
      {matchingLoading ? (
        <Card padding="lg" className="text-center py-12">
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Cpu size={32} />
          </div>
          <h3 className="text-base font-bold text-surface-900 mb-1">AI Matching in Progress...</h3>
          <p className="text-xs font-semibold text-purple-700 font-mono mb-4">
            {LOADING_STEPS[loadingStepIndex]}
          </p>
          <div className="max-w-md mx-auto">
            <ProgressBar value={((loadingStepIndex + 1) / LOADING_STEPS.length) * 100} size="sm" color="ai" />
          </div>
        </Card>
      ) : isProblemVerified ? (
        <motion.div variants={containerVariants(MOTION.stagger.md)} initial="initial" animate="animate" className="space-y-4">
          {matches.map((match, i) => {
            const isTopMatch = match.aiRecommendation;
            const isExpanded = expanded === match.universityId;

            return (
              <motion.div key={match.universityId} variants={cardVariants}>
                <Card
                  padding="md"
                  className={cn(
                    'transition-all shadow-card-sm',
                    isTopMatch && 'ring-2 ring-purple-400 ring-offset-1 bg-purple-50/15'
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Rank Badge */}
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-xs',
                        rankColors[i] || 'bg-surface-400'
                      )}
                    >
                      #{match.rank}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* University Header */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-surface-900">{match.university.name}</h3>
                            {isTopMatch && (
                              <Badge variant="ai" size="sm">
                                <Sparkles size={11} /> AI Recommended Top Match
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-surface-500 mt-0.5">
                            {match.university.institution_type || match.university.type.toUpperCase()} · {match.university.city}, Jharkhand · {match.university.accreditation || `NAAC ${match.university.naacGrade}`}
                          </p>
                        </div>

                        {/* Match Score */}
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-black text-surface-900">
                            <AnimatedCounter value={match.matchScore} suffix="%" />
                          </p>
                          <p className="text-2xs font-semibold uppercase tracking-wider text-surface-400">Match Score</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <ProgressBar value={match.matchScore} size="md" color={isTopMatch ? 'ai' : 'primary'} />
                      </div>

                      {/* Resource Stats */}
                      <div className="flex gap-4 text-xs text-surface-600 mb-3 flex-wrap">
                        <span className="flex items-center gap-1 font-medium">
                          👨‍🏫 <strong>{match.availableFaculty}</strong> faculty available
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-medium">
                          👨‍🎓 <strong>{match.availableStudents}</strong> researchers available
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-medium">
                          ⏱ Duration: <strong>{match.estimatedTimeline}</strong>
                        </span>
                      </div>

                      {/* Dynamic AI Explanation */}
                      {match.explanation && (
                        <div className="p-3 bg-surface-50 border border-surface-200 rounded-xl mb-3 text-xs text-surface-700 leading-relaxed">
                          <span className="font-bold text-surface-800">AI Assessment: </span>
                          {match.explanation}
                        </div>
                      )}

                      {/* Gemini 3.5 Flash-Lite Strategic Fit Rationale */}
                      {match.geminiRecommendation && (
                        <div className="p-3 bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl mb-3 text-xs space-y-1.5 shadow-2xs">
                          <div className="flex items-center gap-1.5 font-bold text-purple-950 dark:text-purple-200">
                            <Sparkles size={13} className="text-purple-600 animate-pulse shrink-0" />
                            <span>Gemini 3.5 Flash-Lite Institutional Rationale:</span>
                            <span className="font-mono text-[10px] bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-full">
                              Fit: {match.geminiRecommendation.matchScore}%
                            </span>
                          </div>
                          <p className="text-purple-900 dark:text-purple-300 leading-relaxed font-medium">
                            {match.geminiRecommendation.reason}
                          </p>
                          {match.geminiRecommendation.matchingDomains?.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                                Key Departmental Alignments:
                              </span>
                              {match.geminiRecommendation.matchingDomains.map((dom, dIdx) => (
                                <span
                                  key={dIdx}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-purple-200 text-purple-800 dark:text-purple-300 font-medium"
                                >
                                  {dom}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Expand Factor Breakdown Button */}
                      <button
                        onClick={() => setExpanded(isExpanded ? null : match.universityId)}
                        className="flex items-center gap-1.5 text-xs text-primary-700 hover:text-primary-800 font-semibold cursor-pointer mb-2"
                      >
                        {isExpanded ? 'Hide' : 'Show'} 8-Factor Breakdown
                        <ChevronDown size={14} className={cn('transition-transform', isExpanded && 'rotate-180')} />
                      </button>

                      {/* Factor Breakdown Panel */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-surface-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {FACTOR_LABELS.map(f => {
                                const score = (match.factors as any)[f.key] || 80;
                                return (
                                  <div key={f.key} className="flex items-center gap-2 p-2 bg-surface-50/70 rounded-lg">
                                    <span className="text-2xs text-surface-500 w-36 shrink-0 truncate">
                                      {f.label} ({f.weight}%)
                                    </span>
                                    <div className="flex-1">
                                      <ProgressBar value={score} size="sm" color="primary" />
                                    </div>
                                    <span className="text-2xs font-bold text-surface-800 w-8 text-right">{score}%</span>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Government Decision Row */}
                      <div className="mt-4 pt-3 border-t border-surface-100 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={16} className="text-primary-700" />
                          <span className="text-xs font-bold text-surface-700 uppercase tracking-wider">
                            Government Decision
                          </span>
                        </div>

                        {isAlreadyAllocated ? (
                          <span className="text-xs font-semibold text-surface-500 bg-surface-100 px-3 py-1.5 rounded-lg">
                            {selectedProblem.assigned_university === match.universityId
                              ? '✓ Assigned to this University'
                              : 'Allocation Complete'}
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant={isTopMatch ? 'primary' : 'outline'}
                            icon={isTopMatch ? <Check size={14} /> : undefined}
                            onClick={() => initiateAllocate(match)}
                          >
                            {isTopMatch ? 'Allocate (AI Recommended)' : 'Override & Allocate'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      ) : null}

      {/* Confirmation Modal for Top AI Allocation */}
      <Modal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm University Allocation"
      >
        <div className="p-4 space-y-4">
          <div className="w-12 h-12 bg-primary-50 text-primary-700 rounded-full flex items-center justify-center">
            <Building2 size={26} />
          </div>

          <div>
            <h4 className="text-base font-bold text-surface-900 mb-1">
              Allocate Problem to {selectedTargetUni?.university.name}?
            </h4>
            <p className="text-xs text-surface-600">
              This will officially assign the problem to {selectedTargetUni?.university.name}. The university dashboard
              will receive this assignment for formal acceptance.
            </p>
          </div>

          <div className="p-3 bg-surface-50 rounded-xl border border-surface-200 text-xs space-y-1.5 text-surface-700">
            <div className="flex justify-between">
              <span className="text-surface-500">Problem:</span>
              <span className="font-bold text-surface-900">{selectedProblem.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">University:</span>
              <span className="font-bold text-primary-800">{selectedTargetUni?.university.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">Match Score:</span>
              <span className="font-bold text-emerald-700">{selectedTargetUni?.matchScore}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">Estimated Duration:</span>
              <span className="font-medium text-surface-800">{selectedTargetUni?.estimatedTimeline}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">Recommendation Status:</span>
              <span className="font-bold text-purple-700">
                {selectedTargetUni?.aiRecommendation ? 'AI Recommended (Rank #1)' : 'Government Override'}
              </span>
            </div>
            {overrideReason && (
              <div className="pt-1 border-t border-surface-200">
                <span className="text-surface-500 block mb-0.5">Override Justification:</span>
                <span className="italic text-surface-800 bg-white p-1.5 rounded block">{overrideReason}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
            <Button variant="secondary" onClick={() => setConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={allocating} onClick={executeAllocation}>
              Confirm Allocation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Override Reason Dialog */}
      <Modal
        open={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        title="Override AI Recommendation"
      >
        <div className="p-4 space-y-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
            <AlertTriangle size={26} />
          </div>

          <div>
            <h4 className="text-base font-bold text-surface-900 mb-1">
              Government Override: Select {selectedTargetUni?.university.name}
            </h4>
            <p className="text-xs text-surface-600">
              You are selecting a university other than the top AI recommendation ({matches[0]?.university.name} —{' '}
              {matches[0]?.matchScore}%). For government transparency, please provide the administrative justification.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">
              Why are you overriding the AI recommendation? (Required)
            </label>
            <textarea
              className="input w-full text-sm min-h-24"
              placeholder="e.g. Better geographical proximity to rural project site, ongoing field lab facility, or existing district administrative MOU..."
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
            <Button variant="secondary" onClick={() => setOverrideModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmOverride}>
              Continue to Confirmation
            </Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
