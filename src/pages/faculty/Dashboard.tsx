import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertTriangle,
  Building2,
  Users,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  Check,
  X,
  Eye,
  FileText,
  AlertCircle,
  HelpCircle,
  FolderGit2,
} from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader, StatCard, SkeletonCard } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal, Drawer } from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { matchingService } from '../../services/matchingService';
import { formatDate, formatDateTime } from '../../lib/utils';
import type { ProjectAssignment, Problem } from '../../types';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';

export default function FacultyDashboard() {
  const { user, addToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [activeProjects, setActiveProjects] = useState<ProjectAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<ProjectAssignment | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [selectedTraceProblemId, setSelectedTraceProblemId] = useState<string | null>(null);

  // Accept Modal
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [targetAssignmentToAccept, setTargetAssignmentToAccept] = useState<ProjectAssignment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Decline Modal
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [targetAssignmentToDecline, setTargetAssignmentToDecline] = useState<ProjectAssignment | null>(null);
  const [declineReason, setDeclineReason] = useState('Current workload too high');
  const [declineNotes, setDeclineNotes] = useState('');

  // Identify current faculty identifier
  // If logged in as Dr. Anita Sharma or Vinod Kumar, match either by user_id or email
  const currentFacultyEmail = user?.email || 'anita.sharma@bitsindri.ac.in';
  const currentFacultyName = user?.name || 'Dr. Anita Sharma';

  useEffect(() => {
    loadFacultyData();
  }, [currentFacultyEmail]);

  const loadFacultyData = () => {
    setLoading(true);
    try {
      const all = db.getProjectAssignments();

      // STRICT FILTERING RULE:
      // Show ONLY project assignments designated to this specific faculty member!
      const myAssignments = all.filter(
        (a) =>
          a.faculty_email?.toLowerCase() === currentFacultyEmail.toLowerCase() ||
          a.faculty_name.toLowerCase().includes(currentFacultyName.toLowerCase()) ||
          a.faculty_id === 'fac-1' || // Default faculty seed
          a.faculty_id === user?.id
      );

      setAssignments(myAssignments);

      // Separate into pending vs active
      const active = myAssignments.filter(
        (a) => a.faculty_status === 'Accepted' || a.project_status === 'PROJECT_ACTIVE'
      );
      setActiveProjects(active);
    } finally {
      setLoading(false);
    }
  };

  const pendingInvitations = assignments.filter((a) => a.faculty_status === 'Pending');

  const openAcceptModal = (assignment: ProjectAssignment) => {
    setTargetAssignmentToAccept(assignment);
    const p = db.getProblemById(assignment.problem_id);
    setSelectedProblem(p);
    setAcceptModalOpen(true);
  };

  const handleConfirmAccept = async () => {
    if (!targetAssignmentToAccept) return;
    setActionLoading(true);
    try {
      await matchingService.respondToFacultyAssignment(
        targetAssignmentToAccept.assignment_id,
        'Accepted',
        undefined,
        currentFacultyName
      );

      addToast({
        type: 'success',
        title: 'Assignment Accepted!',
        message: `You are now the active Project Mentor for Problem ${targetAssignmentToAccept.problem_id}.`,
      });

      setAcceptModalOpen(false);
      setTargetAssignmentToAccept(null);
      loadFacultyData();
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
    setDeclineReason('Current workload too high');
    setDeclineNotes('');
    setDeclineModalOpen(true);
  };

  const handleConfirmDecline = async () => {
    if (!targetAssignmentToDecline) return;
    setActionLoading(true);
    try {
      const fullReason = declineNotes.trim() ? `${declineReason}: ${declineNotes.trim()}` : declineReason;

      await matchingService.respondToFacultyAssignment(
        targetAssignmentToDecline.assignment_id,
        'Declined',
        fullReason,
        currentFacultyName
      );

      addToast({
        type: 'info',
        title: 'Assignment Declined',
        message: `University Admin has been notified. Problem ${targetAssignmentToDecline.problem_id} returned for re-assignment.`,
      });

      setDeclineModalOpen(false);
      setTargetAssignmentToDecline(null);
      loadFacultyData();
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

  return (
    <PageTransition>
      <SectionHeader
        title="Faculty Command Portal"
        subtitle={`${currentFacultyName} · Project Mentorship & R&D Hub`}
        action={
          <Link to="/faculty/projects">
            <Button variant="primary" icon={<FolderGit2 size={15} />}>
              Active Projects Workspace
            </Button>
          </Link>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="New Nominations"
          value={pendingInvitations.length}
          icon={<AlertCircle size={18} />}
          color="yellow"
        />
        <StatCard
          label="Active Mentorships"
          value={activeProjects.length}
          icon={<Briefcase size={18} />}
          color="blue"
        />
        <StatCard
          label="Student Teams Mentored"
          value={activeProjects.length > 0 ? activeProjects.length : 1}
          icon={<Users size={18} />}
          color="green"
        />
        <StatCard
          label="Pending Milestone Reviews"
          value={1}
          icon={<Clock size={18} />}
          color="teal"
        />
      </div>

      {/* SECTION 15: NEW PROJECT ASSIGNMENTS AWAITING FACULTY RESPONSE */}
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
              Action Required: Review & Accept Mentorship
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
                        <h4 className="text-base font-bold text-surface-900">{prob?.title || 'Community Innovation Project'}</h4>
                        <Badge variant="warning">Awaiting Your Acceptance</Badge>
                        <span className="text-2xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {asgn.faculty_match_score}% AI Match
                        </span>
                      </div>

                      <p className="text-xs text-surface-600 line-clamp-2 mt-1 mb-3">{prob?.description}</p>

                      <div className="flex items-center gap-4 text-xs text-surface-500 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-surface-700">
                          <Building2 size={13} className="text-primary-600" /> Assigned by: {asgn.assigned_by} ({asgn.university_name})
                        </span>
                        <span>·</span>
                        <span className="font-medium text-surface-700">
                          Category: {prob?.category || 'Water & Sanitation'}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-medium text-surface-700">
                          <MapPin size={13} className="text-surface-400" /> Location: {prob?.location || 'Ranchi, Jharkhand'}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Users size={13} className="text-purple-600" /> Nominated Team: <strong>{asgn.team_name}</strong>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-surface-400" /> Assigned: {formatDate(asgn.assigned_at)}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Eye size={14} />}
                        onClick={() => {
                          setSelectedAssignment(asgn);
                          setSelectedProblem(prob || null);
                        }}
                      >
                        View Problem
                      </Button>
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
                        Accept Assignment
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Mentorship Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-surface-900 flex items-center gap-2">
            <Briefcase size={18} className="text-primary-600" />
            Active Mentorship Projects & Milestones ({activeProjects.length})
          </h3>
          <Link to="/faculty/projects" className="text-xs text-primary-600 font-semibold hover:underline">
            Open Full Workspace →
          </Link>
        </div>

        {activeProjects.length === 0 ? (
          <Card padding="lg" className="text-center py-10 text-surface-400">
            <Briefcase size={36} className="mx-auto mb-2 text-surface-300" />
            <p className="text-sm font-medium text-surface-600">No active projects currently under mentorship.</p>
            <p className="text-xs mt-1">Review and accept project invitations from the queue above.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeProjects.map((asgn) => {
              const prob = db.getProblemById(asgn.problem_id);
              const isProjectActive = asgn.project_status === 'PROJECT_ACTIVE';

              return (
                <Card key={asgn.assignment_id} padding="md" className="border-l-4 border-l-emerald-500">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedTraceProblemId(asgn.problem_id)}
                          className="font-mono text-xs font-bold text-primary-700 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 px-2.5 py-0.5 rounded border border-primary-200 transition-colors"
                          title="Inspect Problem Lifecycle Ecosystem Trace"
                        >
                          {asgn.problem_id} (Trace)
                        </button>
                        <h4 className="text-base font-bold text-surface-900">{prob?.title}</h4>
                        {isProjectActive ? (
                          <span className="text-2xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Project Active
                          </span>
                        ) : (
                          <span className="text-2xs font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded border border-blue-300">
                            ✓ Faculty Accepted · Awaiting Student Team
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-surface-600 mt-1 line-clamp-1">{prob?.description}</p>

                      <div className="flex items-center gap-4 text-xs text-surface-500 mt-2 flex-wrap">
                        <span>Student Squad: <strong>{asgn.team_name}</strong></span>
                        <span>·</span>
                        <span>Location: <strong>{prob?.location}</strong></span>
                        <span>·</span>
                        <span>Overall Readiness: <strong>{asgn.overall_match_score}%</strong></span>
                      </div>
                    </div>

                    <Link to={`/faculty/projects/${asgn.assignment_id}`}>
                      <Button size="sm" variant="outline" icon={<ArrowRight size={14} />}>
                        Manage Milestones
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Accept Confirmation Modal */}
      <Modal
        open={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        title="Accept Project Assignment?"
      >
        {targetAssignmentToAccept && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2 text-emerald-900">
              <p className="text-sm font-bold text-emerald-950">
                {targetAssignmentToAccept.problem_id} — {selectedProblem?.title}
              </p>
              <div className="grid grid-cols-2 gap-2 text-2xs pt-1 border-t border-emerald-200">
                <div>
                  <span className="text-emerald-700">Faculty Role:</span>
                  <p className="font-bold">Lead Project Mentor</p>
                </div>
                <div>
                  <span className="text-emerald-700">Institution:</span>
                  <p className="font-bold">{targetAssignmentToAccept.university_name}</p>
                </div>
                <div>
                  <span className="text-emerald-700">Student Team:</span>
                  <p className="font-bold">{targetAssignmentToAccept.team_name}</p>
                </div>
                <div>
                  <span className="text-emerald-700">AI Compatibility:</span>
                  <p className="font-bold">{targetAssignmentToAccept.faculty_match_score}% Match</p>
                </div>
              </div>
            </div>

            <p className="text-surface-600">
              By accepting this project assignment, you agree to mentor the student team, review progress milestones, and oversee prototype development.
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
                Accept Assignment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Decline Reason Modal */}
      <Modal
        open={declineModalOpen}
        onClose={() => setDeclineModalOpen(false)}
        title="Decline Project Assignment"
      >
        {targetAssignmentToDecline && (
          <div className="space-y-4 text-xs">
            <p className="text-surface-600">
              Please state why you are declining mentorship for Problem{' '}
              <strong>{targetAssignmentToDecline.problem_id}</strong>:
            </p>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-surface-700 block mb-1">Reason for Declining:</label>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-surface-200 bg-white text-surface-900"
                >
                  <option value="Current workload too high">Current workload too high</option>
                  <option value="Outside domain expertise">Outside domain expertise</option>
                  <option value="Academic leave / Sabbatical">Academic leave / Sabbatical</option>
                  <option value="Project domain mismatch">Project domain mismatch</option>
                  <option value="Other administrative grounds">Other administrative grounds</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-surface-700 block mb-1">Additional Notes (Optional):</label>
                <textarea
                  rows={3}
                  value={declineNotes}
                  onChange={(e) => setDeclineNotes(e.target.value)}
                  placeholder="Provide context for the university administration..."
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

      {/* Problem View Drawer */}
      <Drawer
        open={!!selectedAssignment}
        onClose={() => {
          setSelectedAssignment(null);
          setSelectedProblem(null);
        }}
        title="Problem Assignment Details"
        width="lg"
      >
        {selectedAssignment && selectedProblem && (
          <div className="p-6 space-y-4 text-xs">
            <div>
              <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                {selectedProblem.id}
              </span>
              <h3 className="text-base font-bold text-surface-900 mt-2">{selectedProblem.title}</h3>
              <p className="text-xs text-surface-500 mt-0.5">Assigned by {selectedAssignment.assigned_by}</p>
            </div>

            <div className="p-3 bg-surface-50 rounded-xl space-y-2">
              <p className="font-bold text-surface-800">Problem Description:</p>
              <p className="text-surface-600 leading-relaxed">{selectedProblem.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-surface-50 rounded-xl">
                <span className="text-2xs text-surface-400">Category</span>
                <p className="font-bold text-surface-800 mt-0.5">{selectedProblem.category || selectedProblem.domain}</p>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl">
                <span className="text-2xs text-surface-400">Priority</span>
                <p className="font-bold text-amber-700 uppercase mt-0.5">{selectedProblem.priority}</p>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl">
                <span className="text-2xs text-surface-400">Assigned Student Squad</span>
                <p className="font-bold text-surface-800 mt-0.5">{selectedAssignment.team_name}</p>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl">
                <span className="text-2xs text-surface-400">Match Compatibility</span>
                <p className="font-bold text-purple-700 mt-0.5">{selectedAssignment.faculty_match_score}%</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-100">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setSelectedAssignment(null);
                  openDeclineModal(selectedAssignment);
                }}
              >
                Decline
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedAssignment(null);
                  openAcceptModal(selectedAssignment);
                }}
              >
                Accept Assignment
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Lifecycle Trace Modal */}
      <ProblemEcosystemModal
        problemId={selectedTraceProblemId}
        isOpen={!!selectedTraceProblemId}
        onClose={() => setSelectedTraceProblemId(null)}
      />
    </PageTransition>
  );
}
