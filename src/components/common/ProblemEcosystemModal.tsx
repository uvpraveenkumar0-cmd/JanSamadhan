import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Layers,
  Sparkles,
  Building2,
  GraduationCap,
  Users,
  FlaskConical,
  Wrench,
  Briefcase,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Cpu,
  AlertTriangle,
} from 'lucide-react';
import { db } from '../../services/db';
import type { ProblemEcosystem, Problem } from '../../types';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../lib/utils';

interface ProblemEcosystemModalProps {
  problemId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProblemEcosystemModal: React.FC<ProblemEcosystemModalProps> = ({
  problemId,
  isOpen,
  onClose,
}) => {
  const [ecosystem, setEcosystem] = useState<ProblemEcosystem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (problemId && isOpen) {
      setLoading(true);
      try {
        const eco = db.getProblemEcosystem(problemId);
        setEcosystem(eco);
      } finally {
        setLoading(false);
      }
    } else {
      setEcosystem(null);
    }
  }, [problemId, isOpen]);

  if (!isOpen) return null;

  const problem = ecosystem?.problem;
  const assignment = ecosystem?.assignment;
  const team = ecosystem?.team;
  const prototype = ecosystem?.prototype;
  const research = ecosystem?.research || [];
  const collabs = ecosystem?.collaboration || [];
  const tasks = problemId ? db.getTasks(problemId) : [];

  const lifecycleSteps = [
    { label: 'Citizen Submission', done: true, current: false },
    { label: 'AI Civic Analysis', done: true, current: false },
    { label: 'Govt Verification', done: !!problem?.verified_by || !!problem?.verifiedBy, current: false },
    { label: 'University & Faculty', done: !!assignment, current: !team },
    { label: 'Student Squad', done: !!assignment && assignment.team_status === 'Accepted', current: false },
    { label: 'R&D / Research', done: research.length > 0, current: false },
    { label: 'Working Prototype', done: !!prototype, current: prototype?.status === 'field_pilot' },
    { label: 'Industry Pilot', done: collabs.length > 0, current: false },
    { label: 'Field Resolution', done: problem?.status === 'resolved' || (problem?.status as string) === 'Resolved', current: problem?.status === 'in_progress' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-5xl my-8 bg-white border border-surface-200 rounded-2xl shadow-2xl overflow-hidden text-surface-900 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 bg-surface-50/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-50 border border-primary-200 text-primary-600">
                <Layers size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                    {problemId}
                  </span>
                  <span className="text-xs text-surface-500 font-medium">Unified Problem Ecosystem Trace</span>
                </div>
                <h2 className="text-lg font-bold text-surface-900 tracking-tight mt-0.5 line-clamp-1">
                  {problem?.title || 'Problem Lifecycle Trace'}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-surface-400 hover:text-surface-700 rounded-lg hover:bg-surface-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-50/40">
            {loading || !problem ? (
              <div className="py-20 text-center text-surface-500">
                <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm font-medium">Tracing cross-dashboard ecosystem nodes...</p>
              </div>
            ) : (
              <>
                {/* Lifecycle Stage Header Banner */}
                <div className="bg-gradient-to-r from-primary-50/60 via-white to-white border border-primary-200 rounded-xl p-4 shadow-card-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-surface-500 uppercase tracking-wider font-semibold">Active State:</span>
                      <span className="text-sm font-bold text-primary-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {ecosystem?.lifecycleStage || 'In Progress'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="primary">{problem.category}</Badge>
                      <Badge variant={problem.severity === 'critical' ? 'danger' : 'warning'}>
                        {problem.severity?.toUpperCase()} SEVERITY
                      </Badge>
                      <span className="text-xs text-surface-600 flex items-center gap-1 font-medium">
                        <MapPin size={12} className="text-surface-400" /> {problem.location || problem.district}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Lifecycle Stepper */}
                  <div className="hidden md:grid grid-cols-9 gap-1 pt-3 border-t border-surface-200">
                    {lifecycleSteps.map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center text-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 ${
                            step.done
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : step.current
                              ? 'bg-primary-100 text-primary-800 border border-primary-400 animate-pulse font-extrabold'
                              : 'bg-surface-100 text-surface-400 border border-surface-200'
                          }`}
                        >
                          {step.done ? '✓' : idx + 1}
                        </div>
                        <span className={`text-[10px] leading-tight font-medium ${step.done ? 'text-surface-800' : 'text-surface-500'}`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grid of Interconnected Ecosystem Nodes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Node 1: Citizen Grievance */}
                  <div className="bg-white border border-surface-200 rounded-xl p-4 shadow-card-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Users size={14} className="text-amber-600" /> 1. Citizen Origin
                      </span>
                      <span className="text-[11px] text-surface-500">
                        {problem.submittedAt ? formatDate(problem.submittedAt) : 'August 2026'}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <p className="font-semibold text-surface-900">{problem.citizen_name || problem.citizenName}</p>
                      <p className="text-xs text-surface-600 line-clamp-3 leading-relaxed">{problem.description}</p>
                      <div className="pt-2 flex items-center justify-between text-xs text-surface-500 border-t border-surface-100">
                        <span>Affected Population: <strong className="text-surface-800">{problem.affectedPopulation || problem.affected_people || '7,800'}</strong></span>
                        <span className="text-emerald-700 font-medium">Verified Citizen Case</span>
                      </div>
                    </div>
                  </div>

                  {/* Node 2: AI & Government Routing */}
                  <div className="bg-white border border-surface-200 rounded-xl p-4 shadow-card-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-primary-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} className="text-primary-600" /> 2. AI & Government Governance
                      </span>
                      <Badge variant="success">Govt Verified</Badge>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <p className="font-semibold text-surface-900">
                        {problem.verifiedBy || problem.verified_by || 'Rajesh Kumar IAS'}
                      </p>
                      <p className="text-xs text-surface-600">
                        Assigned to University: <strong className="text-surface-800">{problem.assigned_university_name || assignment?.university_name || 'BIT Sindri'}</strong>
                      </p>
                      <div className="pt-2 flex items-center justify-between text-xs text-surface-500 border-t border-surface-100">
                        <span>Allocation Mode: <strong className="text-surface-800">{assignment?.assignment_type || 'AI Match'}</strong></span>
                        <span className="text-primary-700 font-semibold">Match Score: {assignment?.overall_match_score || 93}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Node 3: Faculty Mentor & Academic Custody */}
                  <div className="bg-white border border-surface-200 rounded-xl p-4 shadow-card-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                        <GraduationCap size={14} className="text-purple-600" /> 3. Faculty Mentorship
                      </span>
                      <Badge variant="primary">{assignment?.faculty_status || 'Accepted'}</Badge>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <p className="font-semibold text-surface-900">{assignment?.faculty_name || 'Dr. Anita Sharma'}</p>
                      <p className="text-xs text-surface-600">{assignment?.faculty_department || 'Engineering Department'}</p>
                      <div className="pt-2 flex flex-wrap gap-1">
                        {(assignment?.faculty_expertise || ['IoT Architecture', 'Telemetry', 'Sensor Systems']).map((exp, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                            {exp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Node 4: Student Squad */}
                  <div className="bg-white border border-surface-200 rounded-xl p-4 shadow-card-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Users size={14} className="text-emerald-600" /> 4. Student Innovation Squad
                      </span>
                      <Badge variant="success">{assignment?.team_status || 'Active'}</Badge>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <p className="font-semibold text-surface-900">{assignment?.team_name || 'Team Innovators-07'}</p>
                      <p className="text-xs text-surface-600">
                        Lead: <strong className="text-surface-800">{assignment?.team_leader_name || team?.team_leader_name || 'Arjun Singh'}</strong>
                        {team?.team_members && ` • ${team.team_members.length} members`}
                      </p>
                      <div className="pt-2 flex flex-wrap gap-1">
                        {(assignment?.team_skills || ['Python', 'IoT Sensors', 'C++', 'Data Analytics']).slice(0, 4).map((sk, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Node 5: Field Research & Publications */}
                <div className="bg-white border border-surface-200 rounded-xl p-4 shadow-card-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={14} className="text-teal-600" /> 5. Field Research & Empirical Investigation ({research.length} studies)
                    </span>
                  </div>
                  {research.length === 0 ? (
                    <p className="text-xs text-surface-500 italic">Field baseline study scheduled.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {research.map(r => (
                        <div key={r.id} className="p-3 rounded-lg bg-surface-50 border border-surface-200">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-surface-900 leading-snug">{r.title}</h4>
                            <span className="text-[10px] font-mono font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                              {r.type.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-surface-600 mt-1 leading-relaxed">{r.findings}</p>
                          <div className="flex items-center gap-4 mt-2 text-[11px] text-surface-500">
                            <span>Conducted by: <strong className="text-surface-700">{r.conductedBy}</strong></span>
                            {r.location && <span>Location: {r.location}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Node 6: Working Prototype & Hardware Telemetry */}
                <div className="bg-white border border-surface-200 rounded-xl p-4 shadow-card-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-primary-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu size={14} className="text-primary-600" /> 6. Working Prototype & Real-World Hardware Telemetry
                    </span>
                    {prototype && (
                      <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                        Readiness: {prototype.readinessScore}%
                      </span>
                    )}
                  </div>
                  {!prototype ? (
                    <p className="text-xs text-surface-500 italic">Prototype design in progress.</p>
                  ) : (
                    <div className="p-3 rounded-lg bg-surface-50 border border-surface-200 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-surface-900">{prototype.title}</h4>
                          <span className="text-xs font-mono text-primary-700 font-medium">{prototype.version} • {prototype.status.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      </div>
                      <p className="text-xs text-surface-600 leading-relaxed">{prototype.description}</p>
                      {prototype.architecture && (
                        <div className="p-2.5 rounded bg-white border border-surface-200 text-[11px] font-mono text-surface-800">
                          <strong className="text-surface-900 font-sans">Hardware Stack:</strong> {prototype.architecture}
                        </div>
                      )}
                      {prototype.fieldTestingStatus && (
                        <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                          <strong className="font-semibold">Field Validation:</strong> {prototype.fieldTestingStatus}
                        </div>
                      )}
                      {prototype.governmentFeedback && (
                        <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-xs text-blue-800">
                          <strong className="font-semibold">Official Feedback:</strong> {prototype.governmentFeedback}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Node 7: Industry Co-Innovation */}
                <div className="bg-white border border-surface-200 rounded-xl p-4 shadow-card-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-orange-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase size={14} className="text-orange-600" /> 7. Industry Co-Innovation & Production Deployment
                    </span>
                  </div>
                  {collabs.length === 0 ? (
                    <p className="text-xs text-surface-500 italic">Open for industry co-sponsorship.</p>
                  ) : (
                    <div className="space-y-2">
                      {collabs.map(c => (
                        <div key={c.id} className="p-3 rounded-lg bg-surface-50 border border-surface-200">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-surface-900">{c.industryPartner}</h4>
                            <Badge variant="warning">{c.status.toUpperCase()}</Badge>
                          </div>
                          <p className="text-xs text-surface-600 mt-1 leading-relaxed">{c.message}</p>
                          {c.response && (
                            <div className="mt-2 p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                              <strong className="font-semibold">Partner Response:</strong> {c.response}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Node 8: Connected Sprint Tasks */}
                {tasks.length > 0 && (
                  <div className="bg-white border border-surface-200 rounded-xl p-4 shadow-card-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-surface-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Wrench size={14} className="text-surface-500" /> Connected Student Execution Tasks ({tasks.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {tasks.map(t => (
                        <div key={t.id} className="p-2.5 rounded-lg bg-surface-50 border border-surface-200 text-xs flex items-center justify-between">
                          <div className="pr-2">
                            <p className="font-semibold text-surface-900 line-clamp-1">{t.title}</p>
                            <span className="text-[10px] text-surface-500">Due: {t.dueDate}</span>
                          </div>
                          <Badge variant={t.status === 'completed' ? 'success' : 'primary'}>
                            {t.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-surface-200 bg-surface-50/80">
            <span className="text-xs text-surface-500">
              Single-Source Data Ecosystem • JanSamadhan Unified Trace
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface-200 hover:bg-surface-300 text-surface-800 text-xs font-semibold transition-colors"
            >
              Close Trace
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
