import React, { useState, useEffect } from 'react';
import { PageTransition } from '../../components/ui/PageTransition';
import { SectionHeader, Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Briefcase,
  Layers,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Send,
  MessageSquare,
  DollarSign,
  Cpu,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Users,
  ChevronRight,
  Handshake,
  FileText,
} from 'lucide-react';
import { db } from '../../services/db';
import type { CollaborationRequest, Problem, ProjectAssignment, Prototype } from '../../types';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';
import { IndustryCollaborationWizard } from '../../components/industry/IndustryCollaborationWizard';
import { useApp } from '../../context/AppContext';

interface FacultyProjectCardData {
  problem: Problem;
  assignment?: ProjectAssignment;
  prototype?: Prototype;
  collaboration?: CollaborationRequest;
}

export default function FacultyIndustryCollab() {
  const { addToast } = useApp();
  const [projectCards, setProjectCards] = useState<FacultyProjectCardData[]>([]);
  const [selectedTraceProblemId, setSelectedTraceProblemId] = useState<string | null>(null);

  // Wizard state
  const [activeWizardProblemId, setActiveWizardProblemId] = useState<string | null>(null);
  const [inspectRequestModal, setInspectRequestModal] = useState<CollaborationRequest | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    // Current logged-in Faculty ID (Dr. Anita Sharma)
    const currentFacultyId = 'fac-1';
    const assignments = db.getProjectAssignments().filter(a => a.faculty_id === currentFacultyId || a.assigned_by === 'Dr. Anita Sharma');
    
    // In case no assignments found, fallback to the core problems
    const problemIds = assignments.length > 0
      ? Array.from(new Set(assignments.map(a => a.problem_id)))
      : ['P-1029', 'P-1030', 'P-1028'];

    const cards: FacultyProjectCardData[] = [];

    for (const pid of problemIds) {
      const problem = db.getProblemById(pid);
      if (!problem) continue;

      const assignment = db.getProjectAssignmentByProblemId(pid) || undefined;
      const prototype = db.getPrototypeByProblemId(pid) || undefined;
      const collabs = db.getIndustryCollaborations(pid);
      const collaboration = collabs.length > 0 ? collabs[0] : undefined;

      cards.push({
        problem,
        assignment,
        prototype,
        collaboration,
      });
    }

    setProjectCards(cards);
  };

  const handleOpenWizard = (problemId: string) => {
    setActiveWizardProblemId(problemId);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Section Header as requested in Prompt Section 3 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Industry Collaboration"
            subtitle="Find the right industry partner for your project's next stage."
          />
        </div>

        {/* Workflow Governance Guidance Banner */}
        <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-blue-800">
            <ShieldCheck size={16} className="text-blue-600" />
            JanSamadhan Industry Collaboration Lifecycle Protocol
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-[11px] pt-1">
            <div className="p-2 rounded-lg bg-white/80 border border-blue-100">
              <span className="font-bold block text-blue-800">1. Identify Need</span>
              <span className="text-surface-600">Select required support</span>
            </div>
            <div className="p-2 rounded-lg bg-white/80 border border-blue-100">
              <span className="font-bold block text-blue-800">2. AI Matching</span>
              <span className="text-surface-600">Engine analyzes context</span>
            </div>
            <div className="p-2 rounded-lg bg-white/80 border border-blue-100">
              <span className="font-bold block text-blue-800">3. Select Partner</span>
              <span className="text-surface-600">Choose best-fit entity</span>
            </div>
            <div className="p-2 rounded-lg bg-white/80 border border-blue-100">
              <span className="font-bold block text-blue-800">4. SPOC Review</span>
              <span className="text-surface-600">University oversight</span>
            </div>
            <div className="p-2 rounded-lg bg-white/80 border border-blue-100">
              <span className="font-bold block text-blue-800">5. Official Dispatch</span>
              <span className="text-surface-600">SPOC sends dossier</span>
            </div>
            <div className="p-2 rounded-lg bg-white/80 border border-blue-100">
              <span className="font-bold block text-blue-800">6. Co-Pilot Sprints</span>
              <span className="text-surface-600">Active joint workspace</span>
            </div>
          </div>
        </div>

        {/* Faculty's Actual Projects Cards */}
        <div className="grid grid-cols-1 gap-6">
          {projectCards.map(({ problem, assignment, prototype, collaboration }) => {
            const probId = problem.problem_id || problem.id;
            const hasCollab = !!collaboration;
            const status = collaboration?.status || 'not_requested';

            // Determine display status and badge
            let statusBadge = (
              <Badge variant="gray" className="bg-surface-100 text-surface-600 border-surface-300">
                NO INDUSTRY SUPPORT REQUESTED
              </Badge>
            );

            if (status === 'pending_spoc') {
              statusBadge = (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  🟡 Pending University SPOC Review
                </span>
              );
            } else if (status === 'returned_to_faculty') {
              statusBadge = (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-300">
                  <AlertCircle size={13} className="text-orange-600" />
                  🟠 Returned by University SPOC
                </span>
              );
            } else if (status === 'submitted_to_industry' || status === 'submitted' || status === 'under_review') {
              statusBadge = (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                  <Clock size={13} className="text-blue-600" />
                  SUBMITTED TO INDUSTRY
                </span>
              );
            } else if (status === 'accepted') {
              statusBadge = (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  COLLABORATION ACTIVE
                </span>
              );
            } else if (status === 'rejected') {
              statusBadge = (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300">
                  <AlertCircle size={13} className="text-red-600" />
                  INDUSTRY DECLINED
                </span>
              );
            }

            return (
              <Card
                key={probId}
                padding="lg"
                className="border border-surface-200 bg-white shadow-card-sm hover:shadow-card transition-all"
              >
                <div className="space-y-4">
                  {/* Top Bar: Problem ID, Stage, Status */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-200 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setSelectedTraceProblemId(probId)}
                        className="font-mono text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 px-2.5 py-1 rounded border border-primary-200 transition-colors inline-flex items-center gap-1"
                        title="Click to inspect complete Problem Lifecycle Ecosystem"
                      >
                        <Layers size={12} /> {probId}
                      </button>
                      <span className="text-xs text-surface-500 font-medium">
                        Current Stage: <strong className="text-surface-800">{prototype?.status || 'Prototype Testing'}</strong>
                      </span>
                    </div>

                    <div>{statusBadge}</div>
                  </div>

                  {/* Project Title & Squad */}
                  <div>
                    <h3 className="text-base font-bold text-surface-900 leading-snug">
                      {prototype?.title || problem.title}
                    </h3>
                    <p className="text-xs text-surface-600 mt-1">
                      Faculty PI: <strong className="text-surface-800">{assignment?.faculty_name || 'Dr. Anita Sharma'}</strong> • Student Team: <strong className="text-surface-800">{assignment?.team_name || 'Smart Infrastructure Team'}</strong>
                    </p>
                  </div>

                  {/* Progress Bars: Prototype & Research */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-surface-50 border border-surface-200 text-xs">
                    <div>
                      <div className="flex justify-between font-medium mb-1">
                        <span className="text-surface-600">Prototype Progress:</span>
                        <strong className="text-surface-900">{prototype?.readinessScore || 65}%</strong>
                      </div>
                      <div className="h-2 w-full bg-surface-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 rounded-full"
                          style={{ width: `${prototype?.readinessScore || 65}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-medium mb-1">
                        <span className="text-surface-600">Research Progress:</span>
                        <strong className="text-surface-900">
                          {probId === 'P-1030' || probId === 'P-1029' ? '100% (Baseline Complete)' : '75% (In Progress)'}
                        </strong>
                      </div>
                      <div className="h-2 w-full bg-surface-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{
                            width: probId === 'P-1030' || probId === 'P-1029' ? '100%' : '75%',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contextual Status Card */}
                  {status === 'not_requested' && (
                    <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs space-y-1">
                        <span className="font-bold text-surface-800 block">Industry Support: Not Requested</span>
                        <p className="text-surface-600 leading-relaxed">
                          Identify support needs (hardware, testing, funding, mentors) and run the AI Matching Engine to recommend verified industry partners.
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => handleOpenWizard(probId)}
                        icon={<Briefcase size={15} />}
                        className="shrink-0"
                      >
                        Find Industry Support
                      </Button>
                    </div>
                  )}

                  {status === 'pending_spoc' && collaboration && (
                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-2">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                            🟡 Faculty Request Pending University SPOC Review
                          </span>
                          <h4 className="text-sm font-bold text-surface-900 mt-0.5 flex items-center gap-1.5">
                            <Building2 size={16} className="text-amber-700" />
                            Selected Industry: {collaboration.industryPartner}
                          </h4>
                        </div>
                        <span className="text-[11px] text-surface-500 font-medium">
                          Submitted: {collaboration.requestedAt?.split('T')[0] || 'Today'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-surface-500 block">Requested By:</span>
                          <strong className="text-surface-800">{collaboration.facultyName || 'Dr. Anita Sharma'}</strong>
                        </div>
                        <div>
                          <span className="text-surface-500 block">Project ID:</span>
                          <strong className="text-surface-800">{collaboration.problem_id || probId}</strong>
                        </div>
                        <div>
                          <span className="text-surface-500 block">Support Needed:</span>
                          <span className="text-surface-800 font-medium">
                            {collaboration.supportRequirements?.join(' + ') || collaboration.requestType.join(' + ')}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white/80 border border-amber-200/60 text-[11px] text-amber-900 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1">
                          <Sparkles size={13} className="text-amber-600 shrink-0" />
                          AI Match Score: <strong>{collaboration.aiMatchScore || 92}% Fit</strong>
                        </span>
                        <span className="text-amber-700 font-medium">
                          University SPOC must review and dispatch the official application.
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenWizard(probId)}
                          icon={<RefreshCw size={13} />}
                        >
                          Re-run AI Matching
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInspectRequestModal(collaboration)}
                          icon={<FileText size={13} />}
                        >
                          Inspect Request
                        </Button>
                      </div>
                    </div>
                  )}

                  {status === 'returned_to_faculty' && collaboration && (
                    <div className="p-4 rounded-xl bg-orange-50/80 border border-orange-300 space-y-3 text-xs">
                      <div className="flex items-center gap-2 text-orange-900 font-bold">
                        <AlertCircle size={16} className="text-orange-600" />
                        University SPOC Requested Changes
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-orange-200 text-surface-800">
                        <span className="font-semibold text-orange-800 block mb-0.5">SPOC Feedback:</span>
                        <p className="leading-relaxed font-medium">{collaboration.spocFeedback || 'Please provide updated test data before sending to industry.'}</p>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenWizard(probId)}
                          icon={<RefreshCw size={13} />}
                        >
                          Modify & Resubmit to SPOC
                        </Button>
                      </div>
                    </div>
                  )}

                  {(status === 'submitted_to_industry' || status === 'submitted' || status === 'under_review') && collaboration && (
                    <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/80 pb-2">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 block">
                            Official Industry Application Dispatched
                          </span>
                          <h4 className="text-sm font-bold text-surface-900 mt-0.5 flex items-center gap-1.5">
                            <Building2 size={16} className="text-blue-700" />
                            Target Industry: {collaboration.industryPartner}
                          </h4>
                        </div>
                        <span className="font-mono text-xs font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded border border-blue-300">
                          {collaboration.applicationId || 'IND-REQ-1029'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-surface-500 block">Dispatched by University SPOC:</span>
                          <strong className="text-surface-800">{collaboration.spocDispatchedAt?.split('T')[0] || 'Recently'}</strong>
                        </div>
                        <div>
                          <span className="text-surface-500 block">Status:</span>
                          <span className="text-blue-900 font-bold">Under Review by Industry Technical Board</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInspectRequestModal(collaboration)}
                          icon={<FileText size={13} />}
                        >
                          View Application Dossier
                        </Button>
                      </div>
                    </div>
                  )}

                  {status === 'accepted' && collaboration && (
                    <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-3 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-2">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                            Industry Co-Innovation Ratified & Active
                          </span>
                          <h4 className="text-sm font-bold text-surface-900 mt-0.5 flex items-center gap-1.5">
                            <Building2 size={16} className="text-emerald-700" />
                            {collaboration.industryPartner}
                          </h4>
                        </div>
                        <Badge variant="success">COLLABORATION ACTIVE</Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-surface-500 block">Industry Mentor:</span>
                          <strong className="text-surface-800">{collaboration.industryMentor || 'Senior Technical Specialist'}</strong>
                        </div>
                        <div>
                          <span className="text-surface-500 block">Funding Commitment:</span>
                          <strong className="text-emerald-800">₹{collaboration.committedFunding?.toLocaleString() || '3,50,000'}</strong>
                        </div>
                        <div>
                          <span className="text-surface-500 block">Duration:</span>
                          <strong className="text-surface-800">{collaboration.expectedDuration || '6 months'}</strong>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedTraceProblemId(probId)}
                          icon={<Handshake size={14} />}
                        >
                          Open Shared Workspace
                        </Button>
                      </div>
                    </div>
                  )}

                  {status === 'rejected' && collaboration && (
                    <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-red-200/80 pb-2">
                        <div className="font-bold text-red-900 flex items-center gap-1.5">
                          <AlertCircle size={15} className="text-red-600" /> Application Declined by {collaboration.industryPartner}
                        </div>
                        <Badge variant="danger">DECLINED</Badge>
                      </div>
                      <div className="text-xs space-y-1">
                        <span className="text-surface-600 block">Rejection Reason: <strong className="text-red-800">{collaboration.rejectionReason}</strong></span>
                        <p className="text-surface-700 leading-relaxed font-medium">"{collaboration.rejectionFeedback || 'Project scope requires additional field testing.'}"</p>
                      </div>
                      <div className="flex justify-end pt-1">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenWizard(probId)}
                          icon={<RefreshCw size={13} />}
                        >
                          Run AI Matching Again / Select Another Industry
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Collaboration Wizard Modal */}
      {activeWizardProblemId && (
        <IndustryCollaborationWizard
          problemId={activeWizardProblemId}
          isOpen={!!activeWizardProblemId}
          onClose={() => setActiveWizardProblemId(null)}
          onSuccess={() => {
            loadProjects();
            addToast({
              type: 'success',
              title: 'Request Updated',
              message: 'Industry collaboration workflow updated.',
            });
          }}
        />
      )}

      {/* Lifecycle Trace Modal */}
      <ProblemEcosystemModal
        problemId={selectedTraceProblemId}
        isOpen={!!selectedTraceProblemId}
        onClose={() => setSelectedTraceProblemId(null)}
      />

      {/* Inspect Request Modal */}
      {inspectRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-surface-200 shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-200 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                  {inspectRequestModal.problem_id || inspectRequestModal.projectId}
                </span>
                <h3 className="text-base font-bold text-surface-900 mt-1">
                  Industry Collaboration Request Details
                </h3>
              </div>
              <button
                onClick={() => setInspectRequestModal(null)}
                className="text-surface-400 hover:text-surface-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-surface-500 block">Selected Partner:</span>
                  <strong className="text-surface-900">{inspectRequestModal.industryPartner}</strong>
                </div>
                <div>
                  <span className="text-surface-500 block">Current Status:</span>
                  <Badge variant={inspectRequestModal.status === 'accepted' ? 'success' : 'warning'}>
                    {inspectRequestModal.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <span className="text-surface-500 block">Requested Funding:</span>
                  <strong className="text-surface-900">₹{inspectRequestModal.requestedFunding?.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-surface-500 block">Submission Date:</span>
                  <span className="text-surface-800">{inspectRequestModal.requestedAt?.split('T')[0]}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 space-y-1">
                <span className="font-bold text-surface-800 block">Faculty Justification:</span>
                <p className="text-surface-700 leading-relaxed">{inspectRequestModal.message}</p>
              </div>

              {inspectRequestModal.expectedOutcome && (
                <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 space-y-1">
                  <span className="font-bold text-surface-800 block">Expected Outcome:</span>
                  <p className="text-surface-700 leading-relaxed">{inspectRequestModal.expectedOutcome}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-surface-200">
              <Button variant="outline" onClick={() => setInspectRequestModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
