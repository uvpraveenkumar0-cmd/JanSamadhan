import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Droplets,
  AlertCircle,
  Building2,
  Users,
  MapPin,
  Calendar,
  Sparkles,
  Check,
  X,
  Eye,
  FileText,
  Send,
  Upload,
} from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, StatCard, SectionHeader, SkeletonCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/Progress';
import { Modal, Drawer } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { containerVariants, cardVariants, MOTION } from '../../config/motion';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { matchingService } from '../../services/matchingService';
import { formatDate } from '../../lib/utils';
import type { ProjectAssignment, Problem, StudentTeam } from '../../types';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';

export default function StudentDashboard() {
  const { user, addToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [teamAssignments, setTeamAssignments] = useState<ProjectAssignment[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectAssignment | null>(null);
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [myTeam, setMyTeam] = useState<StudentTeam | null>(null);
  const [selectedTraceProblemId, setSelectedTraceProblemId] = useState<string | null>(null);

  // Modals
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [targetAssignmentToAccept, setTargetAssignmentToAccept] = useState<ProjectAssignment | null>(null);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [targetAssignmentToDecline, setTargetAssignmentToDecline] = useState<ProjectAssignment | null>(null);
  const [declineReason, setDeclineReason] = useState('Existing academic workload');
  const [declineNotes, setDeclineNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Submit Milestone Modal
  const [submitMilestoneOpen, setSubmitMilestoneOpen] = useState(false);
  const [submittingMilestoneId, setSubmittingMilestoneId] = useState<string>('');
  const [submissionNotes, setSubmissionNotes] = useState('');

  const currentStudentName = user?.name || 'Arjun Singh';

  useEffect(() => {
    loadStudentData();
  }, [user]);

  const loadStudentData = () => {
    setLoading(true);
    try {
      const teams = db.getStudentTeams('univ1');
      const team = teams[0] || null;
      setMyTeam(team);

      const allAssignments = db.getProjectAssignments();

      // Show assignments designated for this team
      const myAssignments = allAssignments.filter(
        (a) => a.team_id === team?.team_id || a.team_id === 'team-1'
      );
      setTeamAssignments(myAssignments);

      const active = myAssignments.find(
        (a) => a.project_status === 'PROJECT_ACTIVE' || a.team_status === 'Accepted'
      );
      if (active) {
        setActiveProject(active);
        const p = db.getProblemById(active.problem_id);
        setActiveProblem(p);
      }
    } finally {
      setLoading(false);
    }
  };

  const pendingInvitations = teamAssignments.filter((a) => a.team_status === 'Pending');

  const openAcceptModal = (assignment: ProjectAssignment) => {
    setTargetAssignmentToAccept(assignment);
    const p = db.getProblemById(assignment.problem_id);
    setActiveProblem(p);
    setAcceptModalOpen(true);
  };

  const handleConfirmAccept = async () => {
    if (!targetAssignmentToAccept) return;
    setActionLoading(true);
    try {
      await matchingService.respondToTeamAssignment(
        targetAssignmentToAccept.assignment_id,
        'Accepted',
        undefined,
        currentStudentName
      );

      addToast({
        type: 'success',
        title: 'Project Assignment Accepted!',
        message: `Your squad has accepted the assignment for Problem ${targetAssignmentToAccept.problem_id}.`,
      });

      setAcceptModalOpen(false);
      setTargetAssignmentToAccept(null);
      loadStudentData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Acceptance failed',
        message: err.message || 'Please try again.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openDeclineModal = (assignment: ProjectAssignment) => {
    setTargetAssignmentToDecline(assignment);
    setDeclineReason('Existing academic workload');
    setDeclineNotes('');
    setDeclineModalOpen(true);
  };

  const handleConfirmDecline = async () => {
    if (!targetAssignmentToDecline) return;
    setActionLoading(true);
    try {
      const fullReason = declineNotes.trim() ? `${declineReason}: ${declineNotes.trim()}` : declineReason;

      await matchingService.respondToTeamAssignment(
        targetAssignmentToDecline.assignment_id,
        'Declined',
        fullReason,
        currentStudentName
      );

      addToast({
        type: 'info',
        title: 'Assignment Declined',
        message: `University Admin and Faculty Mentor have been notified.`,
      });

      setDeclineModalOpen(false);
      setTargetAssignmentToDecline(null);
      loadStudentData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Decline failed',
        message: err.message || 'Please try again.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitMilestone = () => {
    if (!submissionNotes.trim()) {
      addToast({ type: 'warning', title: 'Notes required', message: 'Please provide deliverable notes.' });
      return;
    }

    addToast({
      type: 'success',
      title: 'Milestone Submitted for Faculty Review',
      message: 'Faculty mentor will inspect prototype deliverables.',
    });
    setSubmitMilestoneOpen(false);
    setSubmissionNotes('');
  };

  return (
    <PageTransition>
      <SectionHeader
        title="Student Innovation Portal"
        subtitle={`${myTeam?.team_name || 'Team Innovators-07'} · BIT Sindri · Lead: ${currentStudentName}`}
      />

      {/* KPI Stats */}
      <motion.div
        variants={containerVariants(MOTION.stagger.sm)}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {[
          { label: 'Pending Invitations', value: pendingInvitations.length, icon: <Clock size={18} />, color: 'yellow' as const },
          { label: 'Active R&D Projects', value: activeProject ? 1 : 0, icon: <CheckCircle2 size={18} />, color: 'green' as const },
          { label: 'Prototype Progress', value: activeProject ? `${activeProject.progress}%` : '0%', icon: <Droplets size={18} />, color: 'teal' as const },
          { label: 'Squad Size', value: myTeam ? `${myTeam.team_members.length} Students` : '4', icon: <Users size={18} />, color: 'blue' as const },
        ].map((k, i) => (
          <motion.div key={i} variants={cardVariants}>
            {loading ? <SkeletonCard lines={1} /> : <StatCard {...k} />}
          </motion.div>
        ))}
      </motion.div>

      {/* SECTION 19: NEW PROJECT ASSIGNMENT AWAITING STUDENT TEAM RESPONSE */}
      {pendingInvitations.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <h3 className="text-base font-bold text-surface-900">
                New Project Assignments ({pendingInvitations.length})
              </h3>
            </div>
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-medium">
              Action Required: Review & Accept Project
            </span>
          </div>

          <div className="space-y-4">
            {pendingInvitations.map((asgn) => {
              const prob = db.getProblemById(asgn.problem_id);

              return (
                <Card
                  key={asgn.assignment_id}
                  padding="md"
                  className="border-2 border-amber-300 bg-gradient-to-r from-amber-50/40 via-white to-white shadow-card-md"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded border border-primary-200">
                          {asgn.problem_id}
                        </span>
                        <h4 className="text-base font-bold text-surface-900">{prob?.title || 'Community Problem'}</h4>
                        <Badge variant="warning">Awaiting Team Acceptance</Badge>
                        <span className="text-2xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {asgn.team_match_score}% Team Match
                        </span>
                      </div>

                      <p className="text-xs text-surface-600 line-clamp-2 mt-1 mb-3">{prob?.description}</p>

                      <div className="flex items-center gap-4 text-xs text-surface-500 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-surface-700">
                          <Building2 size={13} className="text-primary-600" /> Faculty Mentor: <strong>{asgn.faculty_name}</strong>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-medium text-surface-700">
                          <MapPin size={13} className="text-surface-400" /> Location: {prob?.location || 'Ranchi, Jharkhand'}
                        </span>
                        <span>·</span>
                        <span className="font-medium text-surface-700">Institution: {asgn.university_name}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-surface-400" /> Assigned: {formatDate(asgn.assigned_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="danger"
                        icon={<X size={14} />}
                        loading={actionLoading}
                        onClick={() => openDeclineModal(asgn)}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Check size={14} />}
                        loading={actionLoading}
                        onClick={() => openAcceptModal(asgn)}
                      >
                        Accept Project
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Project Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-surface-900">Active R&D Innovation</h3>
              {activeProject ? (
                <p className="text-xs text-surface-500 flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setSelectedTraceProblemId(activeProject.problem_id)}
                    className="inline-flex items-center gap-1 font-mono font-bold text-primary-600 hover:text-primary-800 bg-primary-50 px-2 py-0.5 rounded border border-primary-200"
                    title="Trace full Problem Lifecycle Ecosystem"
                  >
                    {activeProject.problem_id} (Trace)
                  </button>
                  <span>· Mentor: <strong>{activeProject.faculty_name}</strong></span>
                </p>
              ) : (
                <p className="text-xs text-surface-400">No project currently active</p>
              )}
            </div>

            {activeProject && (
              <span className="text-2xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                🟢 Project Active
              </span>
            )}
          </div>

          {activeProject && activeProblem ? (
            <div className="space-y-4">
              <div className="p-3 bg-surface-50 rounded-xl space-y-1">
                <p className="text-xs font-bold text-surface-900">{activeProblem.title}</p>
                <p className="text-2xs text-surface-600 line-clamp-2">{activeProblem.description}</p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-medium text-surface-700 mb-1">
                  <span>Prototype Development Milestone</span>
                  <span>{activeProject.progress}%</span>
                </div>
                <ProgressBar value={activeProject.progress} />
              </div>

              <div className="space-y-2">
                <p className="text-2xs font-bold text-surface-500 uppercase tracking-wider">Milestones:</p>
                {activeProject.milestones.map((m, idx) => (
                  <div key={m.id} className="p-2.5 bg-white border border-surface-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-surface-800">
                        {idx + 1}. {m.title}
                      </span>
                      <span
                        className={`text-2xs font-bold px-2 py-0.5 rounded ${
                          m.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {m.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>
                    {m.faculty_remarks && (
                      <p className="text-2xs text-purple-700 bg-purple-50 p-1.5 rounded">
                        Mentor Feedback: {m.faculty_remarks}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Upload size={14} />}
                  onClick={() => setSubmitMilestoneOpen(true)}
                >
                  Submit Milestone Work
                </Button>
                <Link to="/student/tasks">
                  <Button size="sm" variant="outline">
                    View Task Board
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-surface-400">
              Accept a project assignment to view active sprint progress and milestones.
            </div>
          )}
        </Card>

        {/* Squad Members */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-surface-900">{myTeam?.team_name || 'Team Innovators-07'}</h3>
              <p className="text-2xs text-surface-400">
                {myTeam?.department} · {myTeam?.year} · Squad Lead: {currentStudentName}
              </p>
            </div>
            <Link to="/student/team" className="text-xs text-primary-600 font-medium hover:underline">
              View All Members →
            </Link>
          </div>

          <div className="space-y-3">
            {myTeam?.team_members.map((m) => (
              <div key={m.student_id} className="flex items-center justify-between p-2.5 bg-surface-50 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-surface-900">{m.name}</p>
                    <p className="text-2xs text-surface-500">{m.role}</p>
                  </div>
                </div>
                <Badge variant="success" size="sm">Available</Badge>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-surface-100 text-2xs text-surface-500 flex items-center justify-between">
            <span>Specializations:</span>
            <div className="flex items-center gap-1">
              {myTeam?.skills.slice(0, 3).map((s, i) => (
                <span key={i} className="px-2 py-0.5 bg-surface-100 rounded text-surface-700 font-mono">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Accept Project Modal */}
      <Modal
        open={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        title="Accept Project Assignment?"
      >
        {targetAssignmentToAccept && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2 text-emerald-900">
              <p className="text-sm font-bold text-emerald-950">
                {targetAssignmentToAccept.problem_id} — {activeProblem?.title}
              </p>
              <div className="grid grid-cols-2 gap-2 text-2xs pt-1 border-t border-emerald-200">
                <div>
                  <span className="text-emerald-700">Faculty Mentor:</span>
                  <p className="font-bold">{targetAssignmentToAccept.faculty_name}</p>
                </div>
                <div>
                  <span className="text-emerald-700">Team Match Score:</span>
                  <p className="font-bold">{targetAssignmentToAccept.team_match_score}% Match</p>
                </div>
              </div>
            </div>

            <p className="text-surface-600">
              Once both your squad and the faculty mentor have accepted, the project will automatically transition to <strong>PROJECT ACTIVE</strong>.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setAcceptModalOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={actionLoading}
                icon={<Check size={14} />}
                onClick={handleConfirmAccept}
              >
                Accept Project
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Decline Modal */}
      <Modal
        open={declineModalOpen}
        onClose={() => setDeclineModalOpen(false)}
        title="Decline Project Assignment"
      >
        {targetAssignmentToDecline && (
          <div className="space-y-4 text-xs">
            <p className="text-surface-600">
              Please indicate reason for declining Problem <strong>{targetAssignmentToDecline.problem_id}</strong>:
            </p>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-surface-700 block mb-1">Decline Grounds:</label>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-surface-200 bg-white text-surface-900"
                >
                  <option value="Existing academic workload">Existing academic workload</option>
                  <option value="Skills mismatch for prototype requirements">Skills mismatch for prototype requirements</option>
                  <option value="Key squad members on leave / exam prep">Key squad members on leave / exam prep</option>
                  <option value="Project complexity exceeds semester capacity">Project complexity exceeds semester capacity</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-surface-700 block mb-1">Additional Explanations (Optional):</label>
                <textarea
                  rows={3}
                  value={declineNotes}
                  onChange={(e) => setDeclineNotes(e.target.value)}
                  placeholder="Details for the university administration and mentor..."
                  className="w-full text-xs p-3 rounded-xl border border-surface-200 bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDeclineModalOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={actionLoading}
                icon={<X size={14} />}
                onClick={handleConfirmDecline}
              >
                Confirm Decline
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Submit Milestone Deliverable Modal */}
      <Modal
        open={submitMilestoneOpen}
        onClose={() => setSubmitMilestoneOpen(false)}
        title="Submit Milestone Deliverables for Mentor Review"
      >
        <div className="space-y-4 text-xs">
          <p className="text-surface-600">
            Submit your prototype progress, CAD schematics, or test data for Faculty Mentor inspection:
          </p>

          <div>
            <label className="font-bold text-surface-700 block mb-1">Deliverables & Progress Notes:</label>
            <textarea
              rows={4}
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              placeholder="e.g. Field ground survey completed. Water drainage silt sump depth logged. Schematic diagrams uploaded to project repository..."
              className="w-full text-xs p-3 rounded-xl border border-surface-200 bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-2xs text-purple-900">
            <strong>Review Protocol: </strong>
            Faculty Mentor {activeProject?.faculty_name} will review this milestone and either approve or request revisions.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setSubmitMilestoneOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon={<Send size={13} />} onClick={handleSubmitMilestone}>
              Submit for Review
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lifecycle Trace Modal */}
      <ProblemEcosystemModal
        problemId={selectedTraceProblemId}
        isOpen={!!selectedTraceProblemId}
        onClose={() => setSelectedTraceProblemId(null)}
      />
    </PageTransition>
  );
}
