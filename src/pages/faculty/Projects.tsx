import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Check,
  X,
  FileText,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Users,
  MapPin,
  Calendar,
  Building2,
  ShieldCheck,
  Send,
  Plus,
} from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader, StatCard } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/Progress';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { matchingService } from '../../services/matchingService';
import { formatDate } from '../../lib/utils';
import type { ProjectAssignment, Problem, AssignmentMilestone } from '../../types';
import { IndustryCollaborationWizard } from '../../components/industry/IndustryCollaborationWizard';
import { ExternalLink, Handshake, CheckCheck, PlayCircle, Rocket } from 'lucide-react';

export default function FacultyProjects() {
  const { user, addToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectAssignment[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectAssignment | null>(null);

  // Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [targetMilestone, setTargetMilestone] = useState<AssignmentMilestone | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'changes_requested'>('approved');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Add remarks
  const [remarkText, setRemarkText] = useState('');

  // Industry Collaboration Wizard
  const [industryWizardOpen, setIndustryWizardOpen] = useState(false);

  const currentFacultyEmail = user?.email || 'anita.sharma@bitsindri.ac.in';
  const currentFacultyName = user?.name || 'Dr. Anita Sharma';

  useEffect(() => {
    loadProjects();
  }, [currentFacultyEmail]);

  const loadProjects = () => {
    setLoading(true);
    try {
      const all = db.getProjectAssignments();
      const myProjects = all.filter(
        (a) =>
          a.faculty_email?.toLowerCase() === currentFacultyEmail.toLowerCase() ||
          a.faculty_name.toLowerCase().includes(currentFacultyName.toLowerCase()) ||
          a.faculty_id === 'fac-1'
      );
      setProjects(myProjects);
      if (myProjects.length > 0 && !selectedProject) {
        setSelectedProject(myProjects[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (m: AssignmentMilestone) => {
    setTargetMilestone(m);
    setReviewDecision('approved');
    setReviewRemarks('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedProject || !targetMilestone) return;
    if (!reviewRemarks.trim()) {
      addToast({
        type: 'warning',
        title: 'Remarks required',
        message: 'Please provide mentor review notes for the student team.',
      });
      return;
    }

    setActionLoading(true);
    try {
      const updated = await matchingService.updateMilestoneReview(
        selectedProject.assignment_id,
        targetMilestone.id,
        reviewDecision,
        reviewRemarks.trim(),
        currentFacultyName
      );

      addToast({
        type: reviewDecision === 'approved' ? 'success' : 'info',
        title: reviewDecision === 'approved' ? 'Milestone Approved!' : 'Feedback Sent',
        message:
          reviewDecision === 'approved'
            ? `Milestone marked as approved. Progress updated.`
            : `Revisions requested from ${selectedProject.team_name}.`,
      });

      setReviewModalOpen(false);
      setTargetMilestone(null);
      setSelectedProject(updated);
      loadProjects();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Review failed',
        message: err.message || 'Please try again.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddRemarks = () => {
    if (!remarkText.trim() || !selectedProject) return;
    addToast({
      type: 'success',
      title: 'Mentor Remark Recorded',
      message: `Guidance shared with ${selectedProject.team_name}.`,
    });
    setRemarkText('');
  };

  return (
    <PageTransition>
      <SectionHeader
        title="Faculty Project & Milestone Workspace"
        subtitle={`${currentFacultyName} · Active civic innovations and team mentorship`}
      />

      {projects.length === 0 ? (
        <Card padding="lg" className="text-center py-12 text-surface-400">
          <Briefcase size={36} className="mx-auto mb-2 text-surface-300" />
          <p className="text-sm font-bold text-surface-700">No active projects found.</p>
          <p className="text-xs mt-1 text-surface-500">
            Accept project nominations from the Faculty Dashboard to start mentoring student teams.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Project Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider">
              Assigned Projects ({projects.length})
            </h3>

            {projects.map((p) => {
              const prob = db.getProblemById(p.problem_id);
              const isSelected = selectedProject?.assignment_id === p.assignment_id;

              return (
                <div
                  key={p.assignment_id}
                  onClick={() => setSelectedProject(p)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50/40 shadow-sm'
                      : 'border-surface-200 bg-white hover:border-surface-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-2xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                      {p.problem_id}
                    </span>
                    <span
                      className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                        p.project_status === 'PROJECT_ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {p.project_status === 'PROJECT_ACTIVE' ? '🟢 Active' : '⏳ In Onboarding'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-surface-900 line-clamp-1">{prob?.title}</h4>
                  <p className="text-2xs text-surface-500 mt-1">
                    Team: <strong>{p.team_name}</strong> · Match: <strong>{p.faculty_match_score}%</strong>
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Project Details & Milestones */}
          {selectedProject && (
            <div className="lg:col-span-2 space-y-6">
              {(() => {
                const prob = db.getProblemById(selectedProject.problem_id);

                return (
                  <>
                    <Card padding="md">
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded border border-primary-200">
                              {selectedProject.problem_id}
                            </span>
                            <h3 className="text-base font-bold text-surface-900">{prob?.title}</h3>
                            <Badge variant="success">
                              <ShieldCheck size={12} className="inline mr-1" /> Government Verified
                            </Badge>
                          </div>
                          <p className="text-xs text-surface-500 mt-1">{prob?.description}</p>
                        </div>

                        <div className="text-right">
                          <span className="text-2xs text-surface-400">Overall Progress</span>
                          <p className="text-lg font-black text-purple-700">{selectedProject.progress}%</p>
                        </div>
                      </div>

                      <ProgressBar value={selectedProject.progress} className="mb-4" />

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-surface-50 p-3 rounded-xl border border-surface-100">
                        <div>
                          <span className="text-2xs text-surface-400">Institution</span>
                          <p className="font-bold text-surface-800">{selectedProject.university_name}</p>
                        </div>
                        <div>
                          <span className="text-2xs text-surface-400">Faculty Lead</span>
                          <p className="font-bold text-surface-800">{selectedProject.faculty_name}</p>
                        </div>
                        <div>
                          <span className="text-2xs text-surface-400">Student Squad</span>
                          <p className="font-bold text-surface-800">{selectedProject.team_name}</p>
                        </div>
                        <div>
                          <span className="text-2xs text-surface-400">AI Compatibility</span>
                          <p className="font-bold text-purple-700">{selectedProject.faculty_match_score}% Match</p>
                        </div>
                      </div>
                    </Card>

                    {/* Section 44 Lifecycle Status Card */}
                    {(() => {
                      const eco = db.getProblemEcosystem(selectedProject.problem_id);
                      const indCollab = eco?.industryCollaboration;
                      const pilot = eco?.pilotDeployment;
                      const finalSub = eco?.finalSubmission;

                      return (
                        <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-card-sm space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-100 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                                  <Rocket size={16} className="text-primary-600" />
                                  Connected Civic Lifecycle & Industry Pathway
                                </h4>
                                <span className="font-mono text-2xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                                  Stage: {eco?.lifecycleStage?.toUpperCase() || 'PROTOTYPING'}
                                </span>
                              </div>
                              <p className="text-xs text-surface-500 mt-0.5">
                                Trace progress across Research, Prototype, Industry Sponsorship, Field Pilot, and Govt Resolution.
                              </p>
                            </div>

                            <div>
                              {indCollab?.status === 'accepted' ? (
                                <a
                                  href="/industry/workspace"
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                >
                                  <Handshake size={14} /> View Shared Workspace
                                </a>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  icon={<Handshake size={14} />}
                                  onClick={() => setIndustryWizardOpen(true)}
                                >
                                  {indCollab?.status === 'pending' ? 'Update Industry Need / View Fits' : 'Request Industry Support'}
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* 5-Phase Horizontal Track */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1">
                              <div className="flex items-center justify-between text-emerald-800 font-bold text-2xs">
                                <span>Phase 1: Research</span>
                                <Check size={12} className="text-emerald-600" />
                              </div>
                              <p className="font-bold text-surface-800 text-xs">IEEE Publication</p>
                              <span className="text-2xs text-emerald-700 font-medium">✓ 100% Completed</span>
                            </div>

                            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1">
                              <div className="flex items-center justify-between text-emerald-800 font-bold text-2xs">
                                <span>Phase 2: Prototype</span>
                                <Check size={12} className="text-emerald-600" />
                              </div>
                              <p className="font-bold text-surface-800 text-xs truncate">{eco?.prototype?.name || 'AgriDetect v0.9'}</p>
                              <span className="text-2xs text-emerald-700 font-medium">✓ {eco?.prototype?.readinessScore || 85}% Field Ready</span>
                            </div>

                            <div className={`p-3 rounded-xl border space-y-1 ${
                              indCollab?.status === 'accepted'
                                ? 'bg-emerald-50/60 border-emerald-100'
                                : indCollab?.status === 'pending'
                                ? 'bg-amber-50/60 border-amber-100'
                                : 'bg-surface-50 border-surface-200'
                            }`}>
                              <div className="flex items-center justify-between font-bold text-2xs">
                                <span className={indCollab?.status === 'accepted' ? 'text-emerald-800' : indCollab?.status === 'pending' ? 'text-amber-800' : 'text-surface-600'}>
                                  Phase 3: Industry
                                </span>
                                {indCollab?.status === 'accepted' ? <Check size={12} className="text-emerald-600" /> : <Clock size={12} className="text-surface-400" />}
                              </div>
                              <p className="font-bold text-surface-800 text-xs truncate">
                                {indCollab?.industryPartner || 'Not Requested'}
                              </p>
                              <span className={`text-2xs font-medium ${
                                indCollab?.status === 'accepted' ? 'text-emerald-700' : indCollab?.status === 'pending' ? 'text-amber-700' : 'text-surface-500'
                              }`}>
                                {indCollab?.status === 'accepted' ? '✓ Co-Innovation Active' : indCollab?.status === 'pending' ? '⏳ Under Review' : '○ Needs Industry'}
                              </span>
                            </div>

                            <div className={`p-3 rounded-xl border space-y-1 ${
                              pilot?.status === 'approved' || pilot?.status === 'active'
                                ? 'bg-emerald-50/60 border-emerald-100'
                                : pilot?.status === 'requested' || pilot?.status === 'under_govt_review'
                                ? 'bg-blue-50/60 border-blue-100'
                                : 'bg-surface-50 border-surface-200'
                            }`}>
                              <div className="flex items-center justify-between font-bold text-2xs">
                                <span className={pilot ? 'text-primary-800' : 'text-surface-600'}>
                                  Phase 4: Pilot
                                </span>
                                {pilot?.status === 'completed' ? <Check size={12} className="text-emerald-600" /> : <Clock size={12} className="text-surface-400" />}
                              </div>
                              <p className="font-bold text-surface-800 text-xs truncate">
                                {pilot ? `${pilot.durationDays}d Cluster Trial` : 'Awaiting Auth'}
                              </p>
                              <span className="text-2xs text-surface-500 font-medium">
                                {pilot?.status ? `Status: ${pilot.status}` : '○ Not Initiated'}
                              </span>
                            </div>

                            <div className={`p-3 rounded-xl border space-y-1 ${
                              finalSub?.status === 'resolved' || finalSub?.status === 'scaling_approved'
                                ? 'bg-emerald-50/60 border-emerald-100'
                                : 'bg-surface-50 border-surface-200'
                            }`}>
                              <div className="flex items-center justify-between font-bold text-2xs">
                                <span className={finalSub ? 'text-emerald-800' : 'text-surface-600'}>
                                  Phase 5: Scaling
                                </span>
                                {finalSub?.status === 'resolved' ? <Check size={12} className="text-emerald-600" /> : <Clock size={12} className="text-surface-400" />}
                              </div>
                              <p className="font-bold text-surface-800 text-xs truncate">
                                {finalSub ? 'Package Ready' : 'Govt Validation'}
                              </p>
                              <span className="text-2xs text-surface-500 font-medium">
                                {finalSub?.status ? finalSub.status : '○ Pending Pilot'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Milestones & Approvals */}
                    <Card padding="md">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                          <Clock size={16} className="text-purple-600" />
                          Project Deliverables & Milestones
                        </h4>
                        <span className="text-2xs text-surface-500">Faculty mentor sign-off required</span>
                      </div>

                      <div className="space-y-3">
                        {selectedProject.milestones.map((m, idx) => (
                          <div
                            key={m.id}
                            className="p-3.5 bg-surface-50 rounded-xl border border-surface-200 space-y-2"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-2xs font-bold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <h5 className="text-xs font-bold text-surface-900">{m.title}</h5>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                                    m.status === 'approved'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : m.status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-800'
                                      : m.status === 'changes_requested'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-surface-200 text-surface-600'
                                  }`}
                                >
                                  {m.status.toUpperCase().replace('_', ' ')}
                                </span>

                                <Button size="sm" variant="outline" onClick={() => handleOpenReview(m)}>
                                  Review
                                </Button>
                              </div>
                            </div>

                            <p className="text-xs text-surface-600 pl-7">{m.description}</p>

                            {m.faculty_remarks && (
                              <div className="ml-7 p-2 bg-purple-50 rounded-lg border border-purple-100 text-2xs text-purple-900">
                                <strong>Mentor Remarks:</strong> {m.faculty_remarks}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Mentor Notes & Remarks */}
                    <Card padding="md">
                      <h4 className="text-sm font-bold text-surface-900 mb-2 flex items-center gap-2">
                        <MessageSquare size={16} className="text-primary-600" />
                        Add Mentor Guidance Note
                      </h4>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Provide technical directives or advice for the student squad..."
                          value={remarkText}
                          onChange={(e) => setRemarkText(e.target.value)}
                          className="flex-1 text-xs px-3 py-2 rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <Button size="sm" variant="primary" icon={<Send size={13} />} onClick={handleAddRemarks}>
                          Send
                        </Button>
                      </div>
                    </Card>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Milestone Review Modal */}
      <Modal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Faculty Milestone Review"
      >
        {targetMilestone && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-surface-50 rounded-xl border border-surface-200">
              <p className="font-bold text-surface-900">{targetMilestone.title}</p>
              <p className="text-surface-600 mt-1">{targetMilestone.description}</p>
            </div>

            <div>
              <label className="font-bold text-surface-700 block mb-1">Mentor Evaluation Decision:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewDecision('approved')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    reviewDecision === 'approved'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold'
                      : 'border-surface-200 hover:border-surface-300 text-surface-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Approve Deliverable</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewDecision('changes_requested')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    reviewDecision === 'changes_requested'
                      ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-bold'
                      : 'border-surface-200 hover:border-surface-300 text-surface-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-600" />
                    <span>Request Revisions</span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-surface-700 block mb-1">Mentor Feedback & Remarks:</label>
              <textarea
                rows={3}
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                placeholder="Detail technical feedback, validation metrics, or revision requirements..."
                className="w-full text-xs p-3 rounded-xl border border-surface-200 bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setReviewModalOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                variant={reviewDecision === 'approved' ? 'primary' : 'outline'}
                loading={actionLoading}
                onClick={handleSubmitReview}
              >
                Submit Review
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Industry Collaboration Outreach Wizard */}
      {selectedProject && (
        <IndustryCollaborationWizard
          problemId={selectedProject.problem_id}
          isOpen={industryWizardOpen}
          onClose={() => setIndustryWizardOpen(false)}
          onSuccess={() => {
            loadProjects();
            addToast({
              type: 'success',
              title: 'Industry Application Dispatched',
              message: 'Industry co-innovation proposal has been submitted and notifications sent.',
            });
          }}
        />
      )}
    </PageTransition>
  );
}
