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
  DollarSign,
  Handshake,
  ShieldCheck,
  MapPin,
  Send,
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles,
  Users,
  Cpu,
  GraduationCap,
  ChevronRight,
  X,
  Check,
  ExternalLink,
} from 'lucide-react';
import { db } from '../../services/db';
import type { CollaborationRequest, ProblemEcosystem } from '../../types';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';
import { useApp } from '../../context/AppContext';

export default function UniversityIndustryCollab() {
  const { addToast } = useApp();
  const [collabs, setCollabs] = useState<CollaborationRequest[]>([]);
  const [selectedTraceProblemId, setSelectedTraceProblemId] = useState<string | null>(null);

  // Review Dossier Modal State
  const [selectedDossierRequest, setSelectedDossierRequest] = useState<CollaborationRequest | null>(null);
  const [selectedEcosystem, setSelectedEcosystem] = useState<ProblemEcosystem | null>(null);

  // Return to Faculty Modal
  const [returnModalRequest, setReturnModalRequest] = useState<CollaborationRequest | null>(null);
  const [returnFeedback, setReturnFeedback] = useState('');

  // Dispatch Application Modal
  const [dispatchModalRequest, setDispatchModalRequest] = useState<CollaborationRequest | null>(null);
  const [spocNotes, setSpocNotes] = useState(
    'Institutional review complete. Endorsed by University SPOC for official co-pilot field development.'
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const list = db.getIndustryCollaborations();
    setCollabs(list);
  };

  const handleOpenDossier = (req: CollaborationRequest) => {
    const probId = req.problem_id || req.projectId;
    const eco = db.getProblemEcosystem(probId);
    setSelectedEcosystem(eco);
    setSelectedDossierRequest(req);
  };

  const handleConfirmDispatch = (requestId: string) => {
    const updated = db.spocSendOfficialIndustryApplication(requestId, spocNotes);
    if (updated) {
      addToast({
        type: 'success',
        title: 'Official Application Dispatched!',
        message: `Generated ${updated.applicationId}. Notified ${updated.industryPartner} and Faculty lead. Status: SUBMITTED TO INDUSTRY.`,
      });
      setDispatchModalRequest(null);
      setSelectedDossierRequest(null);
      loadData();
    }
  };

  const handleConfirmReturn = (requestId: string) => {
    if (!returnFeedback.trim()) {
      addToast({
        type: 'error',
        title: 'Feedback required',
        message: 'Please provide feedback explaining the changes required.',
      });
      return;
    }
    const updated = db.spocReturnRequestToFaculty(requestId, returnFeedback);
    if (updated) {
      addToast({
        type: 'warning',
        title: 'Request Returned to Faculty',
        message: `Faculty notified with feedback. Status: RETURNED TO FACULTY.`,
      });
      setReturnModalRequest(null);
      setSelectedDossierRequest(null);
      setReturnFeedback('');
      loadData();
    }
  };

  const pendingSpocList = collabs.filter(c => c.status === 'pending_spoc');
  // Awaiting industry decision (submitted but not yet reviewed)
  const awaitingDecisionList = collabs.filter(
    c => c.status === 'submitted_to_industry' || c.status === 'submitted' || c.status === 'under_review'
  );
  // All dispatched to industry (awaiting + decided) — shown in Section 2
  const dispatchedList = collabs.filter(
    c => ['submitted_to_industry', 'submitted', 'under_review', 'accepted', 'rejected'].includes(c.status)
  );
  const acceptedList = collabs.filter(c => c.status === 'accepted');
  const industryRejectedList = collabs.filter(c => c.status === 'rejected');
  const returnedOrDeclined = collabs.filter(c => c.status === 'returned_to_faculty' || c.status === 'rejected');

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="University SPOC — Industry Collaboration Governance"
            subtitle="Review faculty industry requests, verify project dossiers, and dispatch official institutional applications"
          />
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card padding="md" className="border-l-4 border-l-amber-500 border border-surface-200 bg-white shadow-card-sm">
            <span className="text-xs text-surface-500 font-medium uppercase tracking-wider">Pending SPOC Review</span>
            <div className="text-2xl font-black text-amber-700 mt-1">{pendingSpocList.length} Requests</div>
          </Card>
          <Card padding="md" className="border-l-4 border-l-blue-500 border border-surface-200 bg-white shadow-card-sm">
            <span className="text-xs text-surface-500 font-medium uppercase tracking-wider">Awaiting Industry Decision</span>
            <div className="text-2xl font-black text-blue-700 mt-1">{awaitingDecisionList.length} Under Review</div>
          </Card>
          <Card padding="md" className="border-l-4 border-l-emerald-500 border border-surface-200 bg-white shadow-card-sm">
            <span className="text-xs text-surface-500 font-medium uppercase tracking-wider">Industry Accepted</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{acceptedList.length} Partnerships</div>
          </Card>
          <Card padding="md" className="border-l-4 border-l-red-400 border border-surface-200 bg-white shadow-card-sm">
            <span className="text-xs text-surface-500 font-medium uppercase tracking-wider">Industry Rejected</span>
            <div className="text-2xl font-black text-red-600 mt-1">{industryRejectedList.length} Declined</div>
          </Card>
        </div>

        {/* SECTION 1: Pending Faculty Requests (Awaiting University SPOC Review) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
                Pending Faculty Requests (Awaiting University SPOC Action)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {pendingSpocList.length}
              </span>
            </div>
            <span className="text-xs text-surface-500">
              Only University SPOC can dispatch official applications to industry
            </span>
          </div>

          {pendingSpocList.length === 0 ? (
            <div className="p-6 rounded-2xl bg-surface-50 border border-surface-200 text-center text-xs text-surface-500">
              No faculty collaboration requests currently pending University SPOC review.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingSpocList.map(req => {
                const probId = req.problem_id || req.projectId;
                return (
                  <Card
                    key={req.id}
                    padding="lg"
                    className="border-2 border-amber-300/80 bg-white shadow-card-sm hover:shadow-card transition-all"
                  >
                    <div className="space-y-4">
                      {/* Top bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-200 pb-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedTraceProblemId(probId)}
                            className="font-mono text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 px-2.5 py-1 rounded border border-primary-200 transition-colors inline-flex items-center gap-1"
                          >
                            <Layers size={11} /> {probId}
                          </button>
                          <Badge variant="warning">🟡 PENDING UNIVERSITY SPOC</Badge>
                          <span className="text-xs text-surface-500">
                            Requested: {req.requestedAt?.split('T')[0] || 'Recently'}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-surface-700">
                          Faculty Lead: <span className="text-primary-700">{req.facultyName}</span>
                        </span>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-surface-500 block">Target Problem:</span>
                          <strong className="text-surface-900 text-sm">{req.project}</strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-surface-500 block">Selected Industry Partner:</span>
                          <h4 className="font-bold text-surface-900 flex items-center gap-1.5 text-sm">
                            <Building2 size={16} className="text-primary-600" />
                            {req.industryPartner}
                          </h4>
                        </div>
                        <div className="space-y-1">
                          <span className="text-surface-500 block">Requested Support:</span>
                          <span className="font-medium text-surface-800">
                            {req.supportRequirements?.join(', ') || req.requestType.join(', ')}
                          </span>
                        </div>
                      </div>

                      {/* AI Matching Explanation Box */}
                      <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-surface-800 flex items-center gap-1.5">
                            <Sparkles size={14} className="text-primary-600" />
                            AI Matching Explanation & Fit Verification:
                          </span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {req.aiMatchScore || 92}% Match Score
                          </span>
                        </div>
                        <ul className="space-y-1 pt-1">
                          {req.aiMatchReasons?.map((r, i) => (
                            <li key={i} className="text-surface-700 flex items-start gap-1.5 leading-relaxed">
                              <span className="text-emerald-600 font-bold shrink-0">✓</span>
                              <span>{r.replace(/^✓\s*/, '')}</span>
                            </li>
                          )) || (
                            <li className="text-surface-600">✓ Direct domain and technical capabilities match.</li>
                          )}
                        </ul>
                      </div>

                      {/* SPOC Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDossier(req)}
                          icon={<FileText size={14} />}
                        >
                          Review Complete Project Dossier
                        </Button>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReturnModalRequest(req);
                              setReturnFeedback('');
                            }}
                            icon={<RotateCcw size={14} className="text-orange-600" />}
                          >
                            Return to Faculty
                          </Button>

                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setDispatchModalRequest(req);
                              setSpocNotes(
                                'Institutional review complete. Endorsed by University SPOC for official co-pilot field development.'
                              );
                            }}
                            icon={<Send size={14} />}
                          >
                            Send Official Industry Application
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: Officially Dispatched Applications — with Industry Decision */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
                Dispatched Industry Applications — Decision Tracker
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                {dispatchedList.length}
              </span>
            </div>
            <span className="text-xs text-surface-500">
              {awaitingDecisionList.length} awaiting · {acceptedList.length} accepted · {industryRejectedList.length} rejected
            </span>
          </div>

          {dispatchedList.length === 0 ? (
            <div className="p-6 rounded-2xl bg-surface-50 border border-surface-200 text-center text-xs text-surface-500">
              No applications have been dispatched to industry yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {dispatchedList.map(collab => {
                const probId = collab.problem_id || collab.projectId;
                const isAccepted = collab.status === 'accepted';
                const isRejected = collab.status === 'rejected';
                const isAwaiting = !isAccepted && !isRejected;

                return (
                  <Card
                    key={collab.id}
                    padding="lg"
                    className={`shadow-card-sm hover:shadow-card transition-all ${
                      isAccepted
                        ? 'border border-emerald-200 bg-emerald-50/30'
                        : isRejected
                        ? 'border border-red-200 bg-red-50/20'
                        : 'border border-surface-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">

                        {/* Header badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setSelectedTraceProblemId(probId)}
                            className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors"
                          >
                            <Layers size={11} /> {probId}
                          </button>

                          {isAccepted && (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <Check size={11} /> INDUSTRY ACCEPTED
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-red-100 text-red-800 border border-red-300">
                              <X size={11} /> INDUSTRY REJECTED
                            </span>
                          )}
                          {isAwaiting && (
                            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-blue-100 text-blue-800 border border-blue-300 animate-pulse">
                              <Clock size={11} /> AWAITING INDUSTRY DECISION
                            </span>
                          )}

                          <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {collab.applicationId || 'IND-REQ-1029'}
                          </span>
                          <span className="text-xs text-surface-500">
                            Dispatched: {collab.spocDispatchedAt?.split('T')[0] || collab.requestedAt?.split('T')[0]}
                          </span>
                        </div>

                        {/* Industry partner & project */}
                        <div>
                          <h3 className="text-base font-bold text-surface-900 tracking-tight flex items-center gap-2">
                            <Building2 size={18} className={isAccepted ? 'text-emerald-700' : isRejected ? 'text-red-600' : 'text-primary-700'} />
                            {collab.industryPartner}
                          </h3>
                          <p className="text-xs text-surface-500 mt-0.5">
                            Target Project: <strong className="text-surface-800">{collab.project}</strong> • Faculty PI: <strong className="text-surface-800">{collab.facultyName}</strong>
                          </p>
                        </div>

                        {/* SPOC endorsement */}
                        <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 text-xs text-surface-700 space-y-1">
                          <span className="font-semibold text-surface-900">SPOC Endorsement & Purpose:</span>
                          <p className="leading-relaxed">{collab.spocNotes || collab.message}</p>
                        </div>

                        {/* ── INDUSTRY ACCEPTED BANNER ── */}
                        {isAccepted && (
                          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={16} className="text-emerald-600" />
                              <span className="text-sm font-bold text-emerald-800">Industry Decision: ACCEPTED ✓</span>
                              {collab.respondedAt && (
                                <span className="text-xs text-emerald-600 ml-auto">
                                  {new Date(collab.respondedAt).toLocaleDateString('en-IN')}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                              <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                                <span className="text-emerald-700 block font-medium mb-0.5">Assigned Industry Mentor</span>
                                <strong className="text-surface-900">{collab.industryMentor || 'Senior Technical Specialist'}</strong>
                              </div>
                              <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                                <span className="text-emerald-700 block font-medium mb-0.5">Committed Funding</span>
                                <strong className="text-emerald-800 font-mono">₹{(collab.committedFunding || 350000).toLocaleString()}</strong>
                              </div>
                              <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                                <span className="text-emerald-700 block font-medium mb-0.5">Engagement Duration</span>
                                <strong className="text-surface-900">{collab.expectedDuration || '4–6 Months'}</strong>
                              </div>
                            </div>
                            {collab.response && (
                              <p className="text-xs text-emerald-900 italic leading-relaxed pt-1 border-t border-emerald-200">
                                "{collab.response}"
                              </p>
                            )}
                            <a
                              href="/industry/workspace"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Handshake size={13} /> Open Shared Workspace
                            </a>
                          </div>
                        )}

                        {/* ── INDUSTRY REJECTED BANNER ── */}
                        {isRejected && (
                          <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3">
                            <div className="flex items-center gap-2">
                              <AlertCircle size={16} className="text-red-600" />
                              <span className="text-sm font-bold text-red-800">Industry Decision: REJECTED ✗</span>
                              {collab.respondedAt && (
                                <span className="text-xs text-red-500 ml-auto">
                                  {new Date(collab.respondedAt).toLocaleDateString('en-IN')}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div className="p-2.5 bg-white rounded-lg border border-red-200">
                                <span className="text-red-700 block font-medium mb-0.5">Rejection Reason</span>
                                <strong className="text-surface-900">{collab.rejectionReason || 'Scope mismatch with current mandate'}</strong>
                              </div>
                              <div className="p-2.5 bg-white rounded-lg border border-red-200">
                                <span className="text-red-700 block font-medium mb-0.5">Industry Feedback</span>
                                <p className="text-surface-700 italic leading-relaxed">"{collab.rejectionFeedback || 'Please address the feedback and resubmit.'}"</p>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-red-200 flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className="text-xs text-red-700 flex-1">
                                Action required: Review industry feedback with Faculty PI and re-initiate the application with a revised proposal or a different industry partner.
                              </span>
                              <button
                                onClick={() => {
                                  db.spocReturnRequestToFaculty(
                                    collab.id,
                                    `Industry rejection feedback: "${collab.rejectionReason}". ${collab.rejectionFeedback || ''} Please revise and resubmit.`
                                  );
                                  addToast({
                                    type: 'warning',
                                    title: 'Returned to Faculty for Revision',
                                    message: 'Faculty PI has been notified with industry rejection feedback to revise and resubmit.',
                                  });
                                  loadData();
                                }}
                                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <RotateCcw size={12} /> Re-Initiate with Faculty
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ── AWAITING DECISION INDICATOR ── */}
                        {isAwaiting && (
                          <div className="p-3.5 rounded-xl bg-blue-50 border border-dashed border-blue-300 text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Clock size={15} className="text-blue-600 shrink-0" />
                              <span>
                                <strong>Awaiting industry review.</strong> {collab.industryPartner} will review project progress and problem tracking to either <strong>Accept</strong> (allocate mentor & funding) or <strong>Reject</strong> (with mandatory constructive feedback).
                              </span>
                            </div>
                            <a
                              href="/industry/requests"
                              className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white/80 hover:bg-white border border-blue-200 px-3 py-1.5 rounded-lg transition-colors shadow-xs"
                            >
                              <Building2 size={13} /> Open Industry Portal →
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDossier(collab)}
                          className="text-xs flex items-center gap-1"
                        >
                          <FileText size={13} /> View Dossier
                        </Button>
                        {isAwaiting && (
                          <a
                            href="/industry/requests"
                            className="inline-flex items-center justify-center gap-1 text-xs font-medium text-surface-600 hover:text-primary-700 hover:bg-surface-100 px-2.5 py-1.5 rounded-lg transition-colors border border-surface-200"
                          >
                            <ExternalLink size={12} /> Industry Review
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>


        {/* SECTION 3: Active Industry Co-Pilots */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
              Active Industry Co-Pilots & Joint Deployments
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {acceptedList.length}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {acceptedList.map(collab => {
              const probId = collab.problem_id || collab.projectId;
              return (
                <Card
                  key={collab.id}
                  padding="lg"
                  className="border border-surface-200 bg-white shadow-card-sm hover:shadow-card transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setSelectedTraceProblemId(probId)}
                          className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors"
                        >
                          <Layers size={11} /> {probId}
                        </button>
                        <Badge variant="success">COLLABORATION ACTIVE</Badge>
                        <span className="text-xs text-surface-500 font-mono">
                          {collab.applicationId || collab.id}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-surface-900 tracking-tight flex items-center gap-2">
                          <Building2 size={18} className="text-emerald-700" />
                          {collab.industryPartner}
                        </h3>
                        <p className="text-xs text-surface-500 mt-0.5">
                          Target Project: <strong className="text-surface-800">{collab.project}</strong>
                        </p>
                      </div>

                      {collab.response && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                          <span className="font-semibold text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 size={13} className="text-emerald-600" /> Ratified MoU & Industry Commitment:
                          </span>
                          <p className="leading-relaxed font-medium">{collab.response}</p>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTraceProblemId(probId)}
                      className="self-start text-xs flex items-center gap-1"
                    >
                      <Layers size={13} /> View Ecosystem Trace
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL: Review Complete Project Dossier (Section 13) */}
      {selectedDossierRequest && selectedEcosystem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-surface-200 shadow-2xl max-w-4xl w-full my-8 flex flex-col max-h-[92vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-surface-200 bg-surface-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary-100 text-primary-700">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                      {selectedDossierRequest.problem_id || selectedDossierRequest.projectId}
                    </span>
                    <Badge variant={selectedDossierRequest.status === 'pending_spoc' ? 'warning' : 'primary'}>
                      {selectedDossierRequest.status.toUpperCase()}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-surface-900 mt-0.5">
                    University SPOC Dossier Review: {selectedDossierRequest.project}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedDossierRequest(null)}
                className="text-surface-400 hover:text-surface-700 text-sm font-bold p-1.5 rounded-lg hover:bg-surface-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* 1. Original Citizen Problem & Govt Context */}
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-2">
                <span className="font-bold text-surface-800 uppercase tracking-wider text-[11px] block">
                  1. Original Citizen Grievance & Government Context
                </span>
                <p className="text-surface-700 leading-relaxed font-medium">
                  {selectedEcosystem.problem.description}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-surface-200 text-[11px]">
                  <div><span className="text-surface-500">Location:</span> <strong>{selectedEcosystem.problem.location}</strong></div>
                  <div><span className="text-surface-500">Beneficiaries:</span> <strong>{selectedEcosystem.problem.affectedPopulation?.toLocaleString() || '1,200+'}</strong></div>
                  <div><span className="text-surface-500">Govt Status:</span> <strong>{selectedEcosystem.problem.verification_status || 'Verified'}</strong></div>
                  <div><span className="text-surface-500">Department:</span> <strong>{selectedEcosystem.problem.category}</strong></div>
                </div>
              </div>

              {/* 2. University, Faculty & Students */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-white border border-surface-200">
                <div>
                  <span className="text-surface-500 block">University:</span>
                  <strong className="text-surface-900">{selectedDossierRequest.universityName || 'BIT Sindri'}</strong>
                </div>
                <div>
                  <span className="text-surface-500 block">Faculty PI:</span>
                  <strong className="text-surface-900">{selectedDossierRequest.facultyName || 'Dr. Anita Sharma'}</strong>
                </div>
                <div>
                  <span className="text-surface-500 block">Student Squad:</span>
                  <strong className="text-surface-900">{selectedDossierRequest.studentTeamName || 'Smart Infrastructure Team'}</strong>
                </div>
              </div>

              {/* 3. Research & Prototype State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-2">
                  <span className="font-bold text-surface-800 uppercase tracking-wider text-[11px] block">
                    Research Findings
                  </span>
                  <strong className="text-surface-900 block">
                    {selectedEcosystem.research?.[0]?.title || 'Field Baseline Investigation'}
                  </strong>
                  <p className="text-surface-600 leading-relaxed text-[11px]">
                    {selectedEcosystem.research?.[0]?.findings || 'Baseline data collected and verified in laboratory setup.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-2">
                  <span className="font-bold text-surface-800 uppercase tracking-wider text-[11px] block">
                    Prototype Readiness ({selectedEcosystem.prototype?.readinessScore || 65}%)
                  </span>
                  <strong className="text-surface-900 block">
                    {selectedEcosystem.prototype?.title || 'Lab Working Prototype'} ({selectedEcosystem.prototype?.version || 'v1.4'})
                  </strong>
                  <div className="flex flex-wrap gap-1">
                    {selectedEcosystem.prototype?.techStack.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded bg-surface-200 text-surface-800 text-[10px] font-bold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Support Needed & Selected Partner */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 uppercase tracking-wider text-[11px]">
                    Faculty Requested Industry Support
                  </span>
                  <span className="font-bold text-amber-900">₹{selectedDossierRequest.requestedFunding?.toLocaleString()}</span>
                </div>
                <div className="text-surface-800 font-semibold">
                  Selected Partner: <strong className="text-surface-950">{selectedDossierRequest.industryPartner}</strong>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedDossierRequest.supportRequirements?.map(s => (
                    <span key={s} className="px-2.5 py-0.5 rounded-full bg-white text-amber-900 border border-amber-300 font-bold text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="pt-2 border-t border-amber-200/60 space-y-1">
                  <span className="font-bold text-surface-800 block">Faculty Statement of Need:</span>
                  <p className="text-surface-700 leading-relaxed font-medium">{selectedDossierRequest.message}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-surface-200 bg-surface-50 flex items-center justify-between">
              <Button variant="outline" onClick={() => setSelectedDossierRequest(null)}>
                Close
              </Button>

              {selectedDossierRequest.status === 'pending_spoc' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReturnModalRequest(selectedDossierRequest);
                      setReturnFeedback('');
                    }}
                    icon={<RotateCcw size={14} className="text-orange-600" />}
                  >
                    Return to Faculty with Feedback
                  </Button>

                  <Button
                    variant="primary"
                    onClick={() => {
                      setDispatchModalRequest(selectedDossierRequest);
                      setSpocNotes(
                        'Institutional review complete. Endorsed by University SPOC for official co-pilot field development.'
                      );
                    }}
                    icon={<Send size={14} />}
                  >
                    Send Official Industry Application
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Dispatch Official Application Modal */}
      {dispatchModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-surface-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-200 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                  {dispatchModalRequest.problem_id || dispatchModalRequest.projectId}
                </span>
                <h3 className="text-base font-bold text-surface-900 mt-1">
                  Send Official Industry Application
                </h3>
              </div>
              <button onClick={() => setDispatchModalRequest(null)} className="text-surface-400 hover:text-surface-700 text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-surface-600">
                You are about to issue the formal University Industry Application to:
              </p>
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                <span className="font-bold text-blue-900 block text-sm">{dispatchModalRequest.industryPartner}</span>
                <span className="text-blue-700 mt-0.5 block">Application ID: IND-REQ-{(dispatchModalRequest.problem_id || dispatchModalRequest.projectId).replace(/[^0-9]/g, '')}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-900 mb-1">
                  Official SPOC Endorsement Notes:
                </label>
                <textarea
                  rows={3}
                  value={spocNotes}
                  onChange={e => setSpocNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-surface-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-surface-200">
              <Button variant="outline" onClick={() => setDispatchModalRequest(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleConfirmDispatch(dispatchModalRequest.id)}
                icon={<Send size={14} />}
              >
                Confirm & Dispatch to Industry
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Return to Faculty Modal */}
      {returnModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-surface-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-200 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                  {returnModalRequest.problem_id || returnModalRequest.projectId}
                </span>
                <h3 className="text-base font-bold text-surface-900 mt-1">
                  Return Request to Faculty
                </h3>
              </div>
              <button onClick={() => setReturnModalRequest(null)} className="text-surface-400 hover:text-surface-700 text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-surface-600">
                Specify the modifications required by the Faculty PI before this application can be officially dispatched to {returnModalRequest.industryPartner}.
              </p>
              <div>
                <label className="block text-xs font-bold text-surface-900 mb-1">
                  Required Changes / Feedback: <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={returnFeedback}
                  onChange={e => setReturnFeedback(e.target.value)}
                  placeholder="e.g. Please update the sensor tolerance figures and ensure test bench logs are attached..."
                  className="w-full text-xs p-3 rounded-xl border border-surface-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-surface-200">
              <Button variant="outline" onClick={() => setReturnModalRequest(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleConfirmReturn(returnModalRequest.id)}
                icon={<RotateCcw size={14} />}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Return with Feedback
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lifecycle Trace Modal */}
      <ProblemEcosystemModal
        problemId={selectedTraceProblemId}
        isOpen={!!selectedTraceProblemId}
        onClose={() => setSelectedTraceProblemId(null)}
      />
    </PageTransition>
  );
}
