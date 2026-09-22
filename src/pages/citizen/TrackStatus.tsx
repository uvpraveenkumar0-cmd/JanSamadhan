import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Cpu,
  Building2,
  Rocket,
  MapPin,
  Droplets,
  Users,
  Calendar,
  ShieldCheck,
  XCircle,
  AlertTriangle,
  Sparkles,
  GraduationCap,
  Check,
  Award,
} from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader, EmptyState } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { problemService } from '../../services/problemService';
import { db } from '../../services/db';
import { useApp } from '../../context/AppContext';
import { formatDate, formatDateTime, STATUS_LABELS } from '../../lib/utils';
import { cn } from '../../lib/utils';
import type { Problem, ProjectAssignment } from '../../types';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';

export default function TrackStatus() {
  const { problemId: pathId } = useParams<{ problemId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentProblemId = pathId || searchParams.get('problemId') || 'P-1028';

  const [problem, setProblem] = useState<Problem | null>(null);
  const [assignment, setAssignment] = useState<ProjectAssignment | null>(null);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTraceModal, setShowTraceModal] = useState(false);

  useEffect(() => {
    // Load all citizen problems for selector
    problemService.getAll().then((list) => {
      setAllProblems(list);
      const found =
        list.find((p) => p.id === currentProblemId || p.problem_id === currentProblemId) ||
        list.find((p) => p.problem_id === 'P-1028') ||
        list[0] ||
        null;

      if (found) {
        setProblem(found);
        const pid = found.problem_id || found.id;
        const asgn = db.getProjectAssignmentByProblemId(pid);
        setAssignment(asgn);
      }
      setLoading(false);
    });
  }, [currentProblemId]);

  const handleSelectProblem = (id: string) => {
    setSearchParams({ problemId: id });
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="skeleton h-12 w-64 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
          <div className="skeleton h-96 rounded-xl" />
        </div>
      </PageTransition>
    );
  }

  if (!problem) {
    return (
      <PageTransition>
        <EmptyState
          icon={<AlertTriangle size={48} className="text-warning-500" />}
          title="Problem Not Found"
          description={`Could not find any registered problem with ID "${currentProblemId}".`}
          action={
            <button className="btn-primary" onClick={() => navigate('/citizen/problems')}>
              Back to My Problems
            </button>
          }
        />
      </PageTransition>
    );
  }

  // Derive Milestone States
  const isVerified = problem.verification_status === 'Verified';
  const isRejected = problem.verification_status === 'Rejected';

  const isAllocated = problem.allocation_status === 'Allocated' || problem.allocation_status === 'Accepted';
  const isUnivAccepted = problem.allocation_status === 'Accepted';
  const isDeclined = problem.allocation_status === 'Declined';

  const isFacultyAssigned = Boolean(problem.assigned_faculty || assignment?.faculty_id);
  const isFacultyAccepted =
    problem.faculty_status === 'Accepted' || assignment?.faculty_status === 'Accepted';
  const isFacultyDeclined =
    problem.faculty_status === 'Declined' || assignment?.faculty_status === 'Declined';

  const isTeamAssigned = Boolean(problem.assigned_team || assignment?.team_id);
  const isTeamAccepted =
    problem.team_status === 'Accepted' || assignment?.team_status === 'Accepted';
  const isTeamDeclined =
    problem.team_status === 'Declined' || assignment?.team_status === 'Declined';

  const isProjectActive =
    problem.project_status === 'PROJECT_ACTIVE' ||
    assignment?.project_status === 'PROJECT_ACTIVE' ||
    (isUnivAccepted && isFacultyAccepted && isTeamAccepted);

  const isDeployed = problem.status?.toLowerCase() === 'deployed';

  const milestones = [
    {
      key: 'submitted',
      label: 'Problem Submitted',
      description: `Submitted by ${problem.citizenName || 'Citizen'} via Citizen Grievance Portal.`,
      icon: <MapPin size={16} />,
      status: 'done' as const,
      date: formatDate(problem.submittedAt || problem.created_at || new Date().toISOString()),
    },
    {
      key: 'verified',
      label: 'Government Verification',
      description: isVerified
        ? `Verified by ${problem.verifiedBy || 'State Innovation Nodal Officer'}. Quality score assessed.`
        : isRejected
        ? `Problem rejected during verification: ${problem.verificationNotes || 'Administrative criteria not met.'}`
        : 'Under active review by District Administrative Cell.',
      icon: isRejected ? <XCircle size={16} /> : <ShieldCheck size={16} />,
      status: isVerified ? ('done' as const) : isRejected ? ('rejected' as const) : ('active' as const),
      date: problem.verifiedAt ? formatDate(problem.verifiedAt) : 'In Review',
    },
    {
      key: 'matched',
      label: 'AI University Matching',
      description:
        isAllocated || isUnivAccepted
          ? 'AI multi-factor capability ranking completed across accredited institutions.'
          : isVerified
          ? 'Analyzing academic faculties, labs, and research competencies for matching.'
          : 'Queued for government verification approval.',
      icon: <Cpu size={16} />,
      status: (isAllocated || isUnivAccepted ? 'done' : isVerified ? 'active' : 'pending') as
        | 'done'
        | 'active'
        | 'pending',
      date: isVerified ? 'Completed' : 'Pending',
    },
    {
      key: 'allocated',
      label: 'University Assigned',
      description:
        isAllocated || isUnivAccepted
          ? `Officially allocated to ${problem.assigned_university_name || 'BIT Sindri'} by Government.`
          : isDeclined
          ? 'Declined by institution. Re-queued for matching.'
          : 'Government officer evaluating AI recommendations.',
      icon: <Building2 size={16} />,
      status: (isAllocated || isUnivAccepted
        ? 'done'
        : isDeclined
        ? 'rejected'
        : isVerified
        ? 'active'
        : 'pending') as 'done' | 'active' | 'pending' | 'rejected',
      date: problem.allocated_at ? formatDate(problem.allocated_at) : 'Pending',
    },
    {
      key: 'univ_accepted',
      label: 'University Accepted',
      description: isUnivAccepted
        ? `${problem.assigned_university_name || 'University'} accepted institutional custody of the problem.`
        : isAllocated
        ? `Awaiting institutional confirmation from ${problem.assigned_university_name}.`
        : 'Awaiting university assignment.',
      icon: <CheckCircle2 size={16} />,
      status: (isUnivAccepted ? 'done' : isAllocated ? 'active' : 'pending') as 'done' | 'active' | 'pending',
      date: problem.accepted_at ? formatDate(problem.accepted_at) : isAllocated ? 'Awaiting' : 'Pending',
    },
    {
      key: 'faculty_assigned',
      label: 'Faculty Mentor Matched',
      description: isFacultyAssigned
        ? `Matched with ${problem.assigned_faculty_name || assignment?.faculty_name || 'Faculty Expert'} via 8-Factor AI Matching.`
        : isUnivAccepted
        ? 'University Admin evaluating top-ranked faculty mentors in relevant domain.'
        : 'Pending university acceptance.',
      icon: <GraduationCap size={16} />,
      status: (isFacultyAssigned ? 'done' : isUnivAccepted ? 'active' : 'pending') as
        | 'done'
        | 'active'
        | 'pending',
      date: isFacultyAssigned ? 'Matched & Assigned' : 'Pending',
    },
    {
      key: 'faculty_accepted',
      label: 'Faculty Mentor Acceptance',
      description: isFacultyAccepted
        ? `${problem.assigned_faculty_name || assignment?.faculty_name} officially accepted mentorship role.`
        : isFacultyDeclined
        ? 'Declined by faculty mentor. University reassignment required.'
        : isFacultyAssigned
        ? `Invitation pending review by ${problem.assigned_faculty_name || assignment?.faculty_name}.`
        : 'Pending faculty assignment.',
      icon: isFacultyDeclined ? <XCircle size={16} /> : <CheckCircle2 size={16} />,
      status: (isFacultyAccepted
        ? 'done'
        : isFacultyDeclined
        ? 'rejected'
        : isFacultyAssigned
        ? 'active'
        : 'pending') as 'done' | 'active' | 'pending' | 'rejected',
      date: assignment?.faculty_accepted_at ? formatDate(assignment.faculty_accepted_at) : 'Pending',
    },
    {
      key: 'team_assigned',
      label: 'Student Team Matched',
      description: isTeamAssigned
        ? `Assigned to student squad ${problem.assigned_team_name || assignment?.team_name || 'Innovation Team'}.`
        : isUnivAccepted
        ? 'University matching student teams based on skill compatibility and hackathon track record.'
        : 'Pending university matching.',
      icon: <Users size={16} />,
      status: (isTeamAssigned ? 'done' : isUnivAccepted ? 'active' : 'pending') as
        | 'done'
        | 'active'
        | 'pending',
      date: isTeamAssigned ? 'Matched & Assigned' : 'Pending',
    },
    {
      key: 'team_accepted',
      label: 'Student Team Acceptance',
      description: isTeamAccepted
        ? `${problem.assigned_team_name || assignment?.team_name} accepted the project challenge.`
        : isTeamDeclined
        ? 'Team declined assignment due to workload. Awaiting team re-match.'
        : isTeamAssigned
        ? `Team ${problem.assigned_team_name || assignment?.team_name} reviewing project scope.`
        : 'Pending team assignment.',
      icon: isTeamDeclined ? <XCircle size={16} /> : <CheckCircle2 size={16} />,
      status: (isTeamAccepted
        ? 'done'
        : isTeamDeclined
        ? 'rejected'
        : isTeamAssigned
        ? 'active'
        : 'pending') as 'done' | 'active' | 'pending' | 'rejected',
      date: assignment?.team_accepted_at ? formatDate(assignment.team_accepted_at) : 'Pending',
    },
    {
      key: 'project_active',
      label: 'Active R&D & Prototyping',
      description: isProjectActive
        ? 'All 3 stakeholders confirmed! Multidisciplinary team actively developing sensor-based redressal prototype.'
        : 'Requires 3-way consensus: University + Faculty Mentor + Student Squad.',
      icon: <Sparkles size={16} />,
      status: (isProjectActive ? 'done' : isUnivAccepted ? 'active' : 'pending') as
        | 'done'
        | 'active'
        | 'pending',
      date: isProjectActive ? '🟢 Active in Lab' : 'Future Phase',
    },
    {
      key: 'industry_collab',
      label: 'Industry Co-Innovation & Sponsorship',
      description: (() => {
        const eco = db.getProblemEcosystem(problem.id);
        const ind = eco?.industryCollaboration;
        if (ind?.status === 'accepted') {
          return `Co-sponsored by ${ind.industryPartner || 'Industry Partner'}. Technical mentoring & financial support committed.`;
        } else if (ind?.status === 'pending') {
          return `University proposal submitted to ${ind.industryPartner}. Formal review in progress.`;
        }
        return 'Faculty lead and student squad preparing prototype for corporate partnership.';
      })(),
      icon: <Building2 size={16} />,
      status: (() => {
        const eco = db.getProblemEcosystem(problem.id);
        const ind = eco?.industryCollaboration;
        return ind?.status === 'accepted' ? ('done' as const) : ind?.status === 'pending' ? ('active' as const) : ('pending' as const);
      })(),
      date: 'Industry Phase',
    },
    {
      key: 'pilot_trial',
      label: 'On-Ground Field Pilot Trial',
      description: (() => {
        const eco = db.getProblemEcosystem(problem.id);
        const pilot = eco?.pilotDeployment;
        if (pilot?.status === 'approved' || pilot?.status === 'active' || pilot?.status === 'completed') {
          return `Field trial authorized by Government. Operational at ${pilot.location || 'designated pilot zone'}.`;
        } else if (pilot?.status === 'under_govt_review' || pilot?.status === 'requested') {
          return `Pilot clearance requested to Government Department for ${pilot.location}.`;
        }
        return 'Scheduled upon completion of prototype hardware testing.';
      })(),
      icon: <Rocket size={16} />,
      status: (() => {
        const eco = db.getProblemEcosystem(problem.id);
        const pilot = eco?.pilotDeployment;
        return (pilot?.status === 'approved' || pilot?.status === 'active' || pilot?.status === 'completed')
          ? ('done' as const)
          : pilot?.status
          ? ('active' as const)
          : ('pending' as const);
      })(),
      date: 'Field Pilot',
    },
    {
      key: 'deployed',
      label: 'Government Scaling & Grievance Resolution',
      description: (() => {
        const eco = db.getProblemEcosystem(problem.id);
        const finalSub = eco?.finalSubmission;
        if (problem.status?.toLowerCase() === 'resolved' || finalSub?.status === 'resolved' || isDeployed) {
          return 'Verified empirical telemetry sign-off complete! Government sanctioned state-wide rollout. Citizen issue fully resolved.';
        } else if (finalSub?.status === 'submitted') {
          return 'Final innovation package submitted to Government for scaling sanction.';
        }
        return 'Final resolution will be certified following empirical pilot results.';
      })(),
      icon: <Award size={16} />,
      status: (problem.status?.toLowerCase() === 'resolved' || isDeployed ? 'done' : 'pending') as 'done' | 'pending',
      date: problem.status?.toLowerCase() === 'resolved' || isDeployed ? 'Resolved ✓' : 'Target Outcome',
    },
  ];

  // Calculate completed progress percentage
  const completedCount = milestones.filter((m) => m.status === 'done').length;
  const progressPercent = Math.round((completedCount / milestones.length) * 100);

  return (
    <PageTransition>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <SectionHeader
          title="Track Problem Journey"
          subtitle={`Real-time transparent lifecycle tracking from citizen submission to on-ground redressal`}
        />

        {/* Problem Switcher */}
        {allProblems.length > 1 && (
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-surface-200 rounded-xl shadow-xs">
            <span className="text-xs text-surface-500 font-medium">Switch Problem:</span>
            <select
              className="text-xs font-semibold text-primary-700 bg-transparent border-0 cursor-pointer focus:ring-0"
              value={problem.id}
              onChange={(e) => handleSelectProblem(e.target.value)}
            >
              {allProblems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.problem_id || p.id} — {p.title.slice(0, 32)}...
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 3-Way Project Activation Banner */}
      {isProjectActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md flex items-center justify-between flex-wrap gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                Project Officially Active (3-Way Consensus Complete)
                <span className="text-2xs bg-white/30 px-2 py-0.5 rounded-full font-semibold">
                  Phase 3: R&D
                </span>
              </h4>
              <p className="text-xs text-emerald-100 mt-0.5">
                BIT Sindri, Dr. Anita Sharma, and Team Innovators-07 have all accepted custody. Prototype development is currently underway.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-xs">
            <Check size={14} className="text-emerald-200" />
            Milestone 1 in Progress
          </div>
        </motion.div>
      )}

      {/* Problem Summary Card */}
      <Card padding="md" className="mb-6 border-l-4 border-l-primary-500 shadow-card-sm">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="p-3 bg-primary-50 text-primary-700 rounded-xl shrink-0">
            <Droplets size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-md border border-primary-200">
                {problem.problem_id || problem.id}
              </span>
              <button
                onClick={() => setShowTraceModal(true)}
                className="text-xs font-semibold text-primary-600 hover:text-primary-800 underline flex items-center gap-1"
                title="Inspect Cross-Role Innovation Lifecycle"
              >
                Inspect Ecosystem Trace
              </button>
              <h3 className="text-base font-bold text-surface-900">{problem.title}</h3>
            </div>
            <p className="text-xs text-surface-600 line-clamp-2 mb-3">{problem.description}</p>
            <div className="flex items-center gap-4 flex-wrap text-xs text-surface-500">
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-surface-400" />{' '}
                {problem.location || `${problem.district}, Jharkhand`}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Users size={13} className="text-surface-400" />{' '}
                {problem.affectedPopulation?.toLocaleString() || 1200} citizens affected
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-surface-400" /> Submitted{' '}
                {formatDate(problem.submittedAt || problem.created_at || '')}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <StatusBadge status={problem.status} label={STATUS_LABELS[problem.status] ?? problem.status} />
              {problem.verification_status === 'Verified' ? (
                <Badge variant="official">✓ Government Verified</Badge>
              ) : problem.verification_status === 'Rejected' ? (
                <Badge variant="danger">Rejected</Badge>
              ) : (
                <Badge variant="warning">Verification Pending</Badge>
              )}
            </div>
            {problem.assigned_university_name && (
              <span className="text-xs font-medium text-primary-800 bg-primary-50 border border-primary-200 px-2.5 py-1 rounded-lg">
                Assigned: {problem.assigned_university_name}
              </span>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="md">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-surface-100">
              <div>
                <h3 className="text-sm font-bold text-surface-900">End-to-End Lifecycle Progress</h3>
                <p className="text-xs text-surface-400">
                  Real-time blockchain-grade verifiable timeline updated by JanSamadhan Hub
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-primary-700">{progressPercent}%</span>
                <p className="text-2xs text-surface-400">Stages Complete</p>
              </div>
            </div>

            <div className="relative pl-6 space-y-6">
              {/* Vertical progress line */}
              <div className="absolute left-9 top-4 bottom-4 w-0.5 bg-surface-200" />

              {milestones.map((m, idx) => {
                const isDone = m.status === 'done';
                const isActive = m.status === 'active';
                const isRej = m.status === 'rejected';

                return (
                  <motion.div
                    key={m.key}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="relative flex items-start gap-4"
                  >
                    {/* Marker */}
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 font-bold text-xs shadow-xs',
                        isDone && 'bg-emerald-500 text-white ring-4 ring-emerald-50',
                        isActive && 'bg-primary-600 text-white ring-4 ring-primary-100 animate-pulse',
                        isRej && 'bg-red-500 text-white ring-4 ring-red-50',
                        !isDone && !isActive && !isRej && 'bg-white border-2 border-surface-300 text-surface-400'
                      )}
                    >
                      {isDone ? '✓' : isRej ? '✕' : idx + 1}
                    </div>

                    {/* Milestone Content */}
                    <div
                      className={cn(
                        'flex-1 p-3.5 rounded-xl border transition-colors',
                        isDone
                          ? 'bg-emerald-50/40 border-emerald-100'
                          : isActive
                          ? 'bg-primary-50/50 border-primary-200 shadow-xs'
                          : 'bg-surface-50/60 border-surface-100'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                        <span
                          className={cn(
                            'text-sm font-bold',
                            isDone ? 'text-surface-900' : isActive ? 'text-primary-700' : 'text-surface-600'
                          )}
                        >
                          {m.label}
                        </span>
                        <span className="text-2xs font-medium text-surface-400 font-mono">{m.date}</span>
                      </div>
                      <p className="text-xs text-surface-500 leading-relaxed">{m.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Stakeholder Details Column (1 col) */}
        <div className="space-y-6">
          {/* Institutional Assignment Card */}
          <Card padding="md">
            <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">
              Allocated Institution
            </h4>
            {problem.assigned_university_name ? (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 size={16} className="text-blue-700" />
                    <span className="text-sm font-bold text-blue-900">{problem.assigned_university_name}</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    Officially designated institution for prototype development and field implementation.
                  </p>
                </div>

                <div className="space-y-2 text-xs text-surface-600">
                  <div className="flex justify-between py-1 border-b border-surface-100">
                    <span className="text-surface-400">Institutional Custody:</span>
                    <span className="font-semibold text-emerald-700">
                      {problem.allocation_status === 'Accepted'
                        ? '✓ Accepted by University'
                        : 'Awaiting Confirmation'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-100">
                    <span className="text-surface-400">Allocation Type:</span>
                    <span className="font-semibold text-surface-800">
                      {problem.allocation_type || 'AI Recommended'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-surface-50 border border-surface-200 border-dashed rounded-xl text-center text-surface-500">
                <Clock size={28} className="mx-auto mb-2 text-surface-400" />
                <p className="text-xs font-medium text-surface-700">No University Allocated Yet</p>
              </div>
            )}
          </Card>

          {/* Faculty Mentor Card */}
          <Card padding="md">
            <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Assigned Faculty Mentor</span>
              {isFacultyAccepted && (
                <Badge variant="success" size="sm">
                  ✓ Confirmed
                </Badge>
              )}
            </h4>
            {problem.assigned_faculty_name || assignment?.faculty_name ? (
              <div className="space-y-3">
                <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      {(problem.assigned_faculty_name || assignment?.faculty_name || 'F')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-indigo-950">
                        {problem.assigned_faculty_name || assignment?.faculty_name}
                      </h5>
                      <p className="text-xs text-indigo-700">
                        {assignment?.faculty_department || problem.assigned_faculty_dept || 'Civil & Water Resources'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-surface-600">
                  <div className="flex justify-between py-1 border-b border-surface-100">
                    <span className="text-surface-400">Mentor Status:</span>
                    <span
                      className={cn(
                        'font-semibold',
                        isFacultyAccepted
                          ? 'text-emerald-700'
                          : isFacultyDeclined
                          ? 'text-red-600'
                          : 'text-amber-600'
                      )}
                    >
                      {isFacultyAccepted
                        ? '✓ Accepted Mentorship'
                        : isFacultyDeclined
                        ? 'Declined'
                        : '⏳ Awaiting Acceptance'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-100">
                    <span className="text-surface-400">Specialization:</span>
                    <span className="font-semibold text-surface-800">
                      {assignment?.faculty_expertise?.slice(0, 2).join(', ') || 'Water Infrastructure & IoT'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-surface-50 border border-surface-200 border-dashed rounded-xl text-center text-surface-500">
                <Clock size={24} className="mx-auto mb-1.5 text-surface-400" />
                <p className="text-xs font-medium text-surface-700">Faculty Matching Pending</p>
                <p className="text-2xs text-surface-400 mt-0.5">
                  University Admin will assign mentor upon acceptance.
                </p>
              </div>
            )}
          </Card>

          {/* Student Innovation Squad Card */}
          <Card padding="md">
            <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Assigned Student Squad</span>
              {isTeamAccepted && (
                <Badge variant="success" size="sm">
                  ✓ Confirmed
                </Badge>
              )}
            </h4>
            {problem.assigned_team_name || assignment?.team_name ? (
              <div className="space-y-3">
                <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                      {(problem.assigned_team_name || assignment?.team_name || 'T')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-teal-950">
                        {problem.assigned_team_name || assignment?.team_name}
                      </h5>
                      <p className="text-xs text-teal-700">
                        Lead: {assignment?.team_leader_name || 'Arjun Singh'} · 4 Squad Members
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-surface-600">
                  <div className="flex justify-between py-1 border-b border-surface-100">
                    <span className="text-surface-400">Team Status:</span>
                    <span
                      className={cn(
                        'font-semibold',
                        isTeamAccepted
                          ? 'text-emerald-700'
                          : isTeamDeclined
                          ? 'text-red-600'
                          : 'text-amber-600'
                      )}
                    >
                      {isTeamAccepted
                        ? '✓ Accepted Challenge'
                        : isTeamDeclined
                        ? 'Declined'
                        : '⏳ Awaiting Acceptance'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-100">
                    <span className="text-surface-400">Squad Focus:</span>
                    <span className="font-semibold text-surface-800">
                      {assignment?.team_skills?.slice(0, 2).join(', ') || 'IoT, Embedded C, Sensors'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-surface-50 border border-surface-200 border-dashed rounded-xl text-center text-surface-500">
                <Clock size={24} className="mx-auto mb-1.5 text-surface-400" />
                <p className="text-xs font-medium text-surface-700">Student Team Matching Pending</p>
                <p className="text-2xs text-surface-400 mt-0.5">
                  University will assign verified squad matching required skills.
                </p>
              </div>
            )}
          </Card>

          {/* Verification Audit Details */}
          <Card padding="md">
            <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">
              Verification Audit Details
            </h4>
            <div className="space-y-2 text-xs text-surface-600">
              <div className="flex justify-between py-1 border-b border-surface-100">
                <span className="text-surface-400">Verification Status:</span>
                <span
                  className={cn(
                    'font-bold',
                    isVerified ? 'text-emerald-700' : isRejected ? 'text-red-600' : 'text-amber-600'
                  )}
                >
                  {problem.verification_status}
                </span>
              </div>
              {problem.verifiedBy && (
                <div className="flex justify-between py-1 border-b border-surface-100">
                  <span className="text-surface-400">Reviewed By:</span>
                  <span className="font-semibold text-surface-800">{problem.verifiedBy}</span>
                </div>
              )}
              {problem.verifiedAt && (
                <div className="flex justify-between py-1 border-b border-surface-100">
                  <span className="text-surface-400">Reviewed On:</span>
                  <span className="font-medium text-surface-700">
                    {formatDateTime(problem.verifiedAt)}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Lifecycle Trace Modal */}
      {problem && (
        <ProblemEcosystemModal
          problemId={problem.problem_id || problem.id}
          isOpen={showTraceModal}
          onClose={() => setShowTraceModal(false)}
        />
      )}
    </PageTransition>
  );
}
