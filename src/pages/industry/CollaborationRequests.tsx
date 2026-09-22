import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ArrowRight,
  DollarSign,
  Calendar,
  MapPin,
  Eye,
  Handshake,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader, SkeletonCard, EmptyState } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { containerVariants, cardVariants } from '../../config/motion';
import { db } from '../../services/db';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../lib/utils';
import type { CollaborationRequest, ProblemEcosystem } from '../../types';
import { IndustryProjectReviewModal } from '../../components/industry/IndustryProjectReviewModal';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';

export default function CollaborationRequests() {
  const { addToast } = useApp();
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [reviewRequest, setReviewRequest] = useState<CollaborationRequest | null>(null);
  const [reviewTab, setReviewTab] = useState<'dossier' | 'accept' | 'reject'>('dossier');
  const [ecosystem, setEcosystem] = useState<ProblemEcosystem | null>(null);

  // Ecosystem modal
  const [selectedTraceProblemId, setSelectedTraceProblemId] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    try {
      const all = db.getIndustryCollaborations();
      // Industry ONLY sees applications that were officially dispatched by University SPOC
      const dispatched = all.filter(c =>
        ['submitted_to_industry', 'submitted', 'under_review', 'accepted', 'rejected'].includes(c.status)
      );
      setRequests(dispatched);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openReview = (req: CollaborationRequest, tab: 'dossier' | 'accept' | 'reject' = 'dossier') => {
    const probId = req.problemId || req.problem_id || 'P-1029';
    const eco = db.getProblemEcosystem(probId);
    setEcosystem(eco);
    setReviewTab(tab);
    setReviewRequest(req);
  };

  const handleDecisionComplete = () => {
    loadData();
    setReviewRequest(null);
    addToast({
      type: 'success',
      title: 'Decision Recorded',
      message: 'The university, faculty lead, and student team have been notified.',
    });
  };

  const pendingCount = requests.filter(
    r => r.status === 'submitted_to_industry' || r.status === 'submitted' || r.status === 'under_review'
  ).length;

  return (
    <PageTransition>
      <div className="space-y-6">
        <SectionHeader
          title="Incoming University Co-Innovation Proposals"
          subtitle={`${pendingCount} official institutional applications awaiting technical review and collaboration decision`}
        />

        {/* Informational Guidance Banner */}
        <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>JanSamadhan Co-Innovation Governance:</strong> Proposals displayed here have been verified by accredited University Faculty Leads and officially dispatched by University SPOCs. Review the complete project dossier (civic problem, government requirements, faculty, student squad, research findings, and working prototype) to accept or decline with feedback.
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={<Building2 size={40} />}
            title="No official industry applications found"
            description="University SPOCs will dispatch official collaboration dossiers when faculty prototypes achieve verified testing readiness."
          />
        ) : (
          <motion.div variants={containerVariants()} initial="initial" animate="animate" className="space-y-4">
            {requests.map(req => {
              const probId = req.problemId || req.problem_id || 'P-1029';
              const isSubmitted =
                req.status === 'submitted_to_industry' || req.status === 'submitted' || req.status === 'under_review';
              const isAccepted = req.status === 'accepted';
              const isRejected = req.status === 'rejected';

              return (
                <motion.div key={req.id} variants={cardVariants}>
                  <Card
                    padding="lg"
                    className="border border-surface-200 bg-white shadow-card-sm hover:shadow-card transition-all"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <button
                            onClick={() => setSelectedTraceProblemId(probId)}
                            className="font-mono text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 px-2.5 py-0.5 rounded border border-primary-200 transition-colors inline-flex items-center gap-1"
                            title="Inspect Connected Problem Ecosystem"
                          >
                            <Layers className="w-3 h-3" /> {probId}
                          </button>

                          <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                            {req.applicationId || `IND-REQ-${probId.replace(/[^0-9]/g, '')}`}
                          </span>

                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                              isAccepted
                                ? 'bg-emerald-100 text-emerald-800'
                                : isRejected
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {isSubmitted ? 'SUBMITTED TO INDUSTRY' : req.status.replace(/_/g, ' ').toUpperCase()}
                          </span>

                          <span className="text-xs text-surface-500">
                            Dispatched by SPOC: {req.spocDispatchedAt ? formatDate(req.spocDispatchedAt) : req.submittedAt ? formatDate(req.submittedAt) : 'Recently'}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-surface-900 mt-1">
                          {req.projectTitle || req.project}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {isAccepted ? (
                          <a
                            href="/industry/workspace"
                            className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                          >
                            <Handshake className="w-4 h-4" /> Open Shared Workspace
                          </a>
                        ) : isRejected ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg flex items-center gap-1">
                              <XCircle className="w-4 h-4 text-red-500" /> Declined
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReview(req, 'dossier')}
                              icon={<FileText className="w-4 h-4" />}
                            >
                              Inspect Dossier
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReview(req, 'dossier')}
                              icon={<FileText className="w-4 h-4" />}
                            >
                              Inspect Dossier
                            </Button>
                            <button
                              onClick={() => openReview(req, 'reject')}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                              title="Reject with mandatory constructive feedback"
                            >
                              <XCircle className="w-4 h-4 text-red-600" />
                              Reject
                            </button>
                            <button
                              onClick={() => openReview(req, 'accept')}
                              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors inline-flex items-center gap-1.5"
                              title="Accept application, assign mentor & allocate funding"
                            >
                              <CheckCircle2 className="w-4 h-4 text-white" />
                              Accept
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metadata Matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-50 p-3.5 rounded-xl border border-surface-200 mb-4 text-xs">
                      <div>
                        <span className="text-surface-500 block">Origin University:</span>
                        <span className="font-bold text-surface-900">{req.universityName || 'BIT Sindri'}</span>
                      </div>
                      <div>
                        <span className="text-surface-500 block">Faculty PI:</span>
                        <span className="font-bold text-surface-900">{req.facultyName || 'Dr. Anita Sharma'}</span>
                      </div>
                      <div>
                        <span className="text-surface-500 block">Requested Funding:</span>
                        <span className="font-mono font-bold text-primary-700">
                          ₹{(req.requestedFunding || req.fundingRequested || 150000).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-surface-500 block">Target Timeline:</span>
                        <span className="font-medium text-surface-800">{req.expectedTimeline || '4-6 Months'}</span>
                      </div>
                    </div>

                    {/* Support Areas Badges */}
                    <div className="mb-3">
                      <span className="text-[11px] font-bold text-surface-500 block mb-1.5 uppercase tracking-wider">
                        Requested Support Areas:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(req.supportRequirements || req.supportAreas || req.requestType || []).map((area, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 bg-surface-100 text-surface-800 rounded-md text-[11px] font-medium border border-surface-200"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Faculty Project Statement */}
                    {req.message && (
                      <div className="p-3 bg-surface-50 rounded-xl border border-surface-200 text-xs text-surface-700 space-y-1">
                        <span className="font-bold text-surface-900 block">Faculty Project Statement:</span>
                        <p className="leading-relaxed">{req.message}</p>
                      </div>
                    )}

                    {/* Awaiting Review Decision Action Banner */}
                    {isSubmitted && (
                      <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                              Decision Required: Accept or Reject Application
                            </span>
                          </div>
                          <span className="text-[11px] text-blue-700 bg-white/80 px-2 py-0.5 rounded border border-blue-200 font-medium">
                            Based on Problem Progress, Prototype Readiness & Program Tracking
                          </span>
                        </div>
                        <p className="text-xs text-blue-900 leading-relaxed">
                          University SPOC has officially submitted this application requesting <strong>₹{(req.requestedFunding || req.fundingRequested || 150000).toLocaleString()}</strong> funding and industry co-mentorship. If approved, your organization commits to mentor allocation and field testing. If declined, constructive technical feedback is required to guide the university team.
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-200/60 flex-wrap">
                          <button
                            type="button"
                            onClick={() => openReview(req, 'dossier')}
                            className="text-xs font-semibold text-surface-700 hover:text-surface-900 px-3 py-1.5 rounded-lg hover:bg-white/60 transition-colors inline-flex items-center gap-1"
                          >
                            <FileText size={13} /> View 9-Section Dossier
                          </button>
                          <button
                            type="button"
                            onClick={() => openReview(req, 'reject')}
                            className="text-xs font-bold text-red-700 hover:bg-red-100/80 bg-white border border-red-200 px-3.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <XCircle size={14} className="text-red-600" /> Reject with Feedback
                          </button>
                          <button
                            type="button"
                            onClick={() => openReview(req, 'accept')}
                            className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <CheckCircle2 size={14} /> Accept & Commit Mentorship
                          </button>
                        </div>
                      </div>
                    )}

                    {/* If accepted, show mentor and commitment */}
                    {isAccepted && (
                      <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                        <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          Co-Pilot Ratified:
                        </span>
                        <p className="leading-relaxed">
                          Assigned Mentor: <strong>{req.industryMentor || 'Senior Technical Specialist'}</strong> • Funding Commitment: <strong>₹{req.committedFunding?.toLocaleString() || '3,50,000'}</strong>
                        </p>
                      </div>
                    )}

                    {/* If rejected, show reason and feedback */}
                    {isRejected && (
                      <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-900 space-y-1">
                        <span className="font-bold text-red-800 flex items-center gap-1.5">
                          <XCircle size={14} className="text-red-600" />
                          Declined Reason: {req.rejectionReason}
                        </span>
                        <p className="leading-relaxed italic">"{req.rejectionFeedback}"</p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Review Modal with 8 Dossier Sections and Accept/Reject Forms */}
        {reviewRequest && (
          <IndustryProjectReviewModal
            request={reviewRequest}
            ecosystem={ecosystem}
            initialTab={reviewTab}
            onClose={() => setReviewRequest(null)}
            onDecisionComplete={handleDecisionComplete}
          />
        )}

        {/* Ecosystem Modal */}
        <ProblemEcosystemModal
          problemId={selectedTraceProblemId}
          isOpen={!!selectedTraceProblemId}
          onClose={() => setSelectedTraceProblemId(null)}
        />
      </div>
    </PageTransition>
  );
}
