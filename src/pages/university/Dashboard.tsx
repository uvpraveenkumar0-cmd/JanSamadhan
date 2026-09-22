import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Layers,
  Users,
  Briefcase,
  Handshake,
  ArrowRight,
  CheckCircle2,
  Clock,
  Building2,
  Check,
  X,
  MapPin,
  Calendar,
  AlertTriangle,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, StatCard, SectionHeader, SkeletonCard, EmptyState } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/Progress';
import { Modal, Drawer } from '../../components/ui/Modal';
import { containerVariants, cardVariants, MOTION } from '../../config/motion';
import { problemService } from '../../services/problemService';
import { universityService } from '../../services/universityService';
import { useApp } from '../../context/AppContext';
import { formatDate, formatDateTime, STATUS_LABELS, DOMAIN_LABELS } from '../../lib/utils';
import type { Problem, ProjectAssignment } from '../../types';
import { db } from '../../services/db';

export default function UniversityDashboard() {
  const { user, addToast } = useApp();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [assignedProblems, setAssignedProblems] = useState<Problem[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<ProjectAssignment[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

  // Decline Dialog
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [targetProblemToDecline, setTargetProblemToDecline] = useState<Problem | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // University institution details from authenticated user
  const currentInstitutionId = user?.institutionId || 'univ1';
  const currentUnivName = user?.organizationName || 'BIT Sindri';

  const loadData = async () => {
    setLoading(true);
    try {
      const all = await problemService.getAll();
      // Problems assigned to this university or allocated
      const assigned = all.filter(
        p =>
          (p.assigned_university === currentInstitutionId ||
            p.assigned_university_name?.toLowerCase() === currentUnivName.toLowerCase() ||
            p.allocation_status === 'Allocated' ||
            p.allocation_status === 'Accepted')
      );
      setAssignedProblems(assigned);
      const asgns = db.getProjectAssignments({ university_id: currentInstitutionId });
      setProjectAssignments(asgns);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentInstitutionId]);

  const handleAccept = async (prob: Problem) => {
    setActionLoading(true);
    try {
      await universityService.respondToAllocation(prob.id, currentInstitutionId, 'accept');
      addToast({
        type: 'success',
        title: 'Assignment Accepted!',
        message: `${prob.id}: "${prob.title}" is now officially accepted for project onboarding.`,
      });
      await loadData();
      if (selectedProblem?.id === prob.id) {
        setSelectedProblem(null);
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Acceptance failed', message: err.message || 'Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  const openDeclineModal = (prob: Problem) => {
    setTargetProblemToDecline(prob);
    setDeclineReason('');
    setDeclineModalOpen(true);
  };

  const handleConfirmDecline = async () => {
    if (!targetProblemToDecline) return;
    if (!declineReason.trim()) {
      addToast({ type: 'warning', title: 'Reason required', message: 'Please provide a reason for declining.' });
      return;
    }
    setActionLoading(true);
    try {
      await universityService.respondToAllocation(
        targetProblemToDecline.id,
        currentInstitutionId,
        'decline',
        declineReason
      );
      addToast({
        type: 'info',
        title: 'Assignment Declined',
        message: `Problem ${targetProblemToDecline.id} has been returned to Government for re-allocation.`,
      });
      setDeclineModalOpen(false);
      setTargetProblemToDecline(null);
      await loadData();
      if (selectedProblem?.id === targetProblemToDecline.id) {
        setSelectedProblem(null);
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Decline failed', message: err.message || 'Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  const pendingAssignments = assignedProblems.filter(p => p.allocation_status === 'Allocated');
  const acceptedAssignments = assignedProblems.filter(p => p.allocation_status === 'Accepted');

  return (
    <PageTransition>
      <SectionHeader
        title="University Command Portal"
        subtitle={`${currentUnivName} — Research & Innovation Hub`}
        action={
          <Link to="/university/marketplace">
            <Button variant="primary" icon={<Layers size={15} />}>
              Open Marketplace
            </Button>
          </Link>
        }
      />

      {/* KPI Cards */}
      <motion.div
        variants={containerVariants(MOTION.stagger.sm)}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {[
          {
            label: 'New Assignments',
            value: pendingAssignments.length,
            icon: <AlertTriangle size={18} />,
            color: 'yellow' as const,
          },
          {
            label: 'Active Accepted Projects',
            value: acceptedAssignments.length + 3,
            icon: <Briefcase size={18} />,
            color: 'blue' as const,
          },
          { label: 'Faculty Mentors', value: 18, icon: <Users size={18} />, color: 'teal' as const },
          { label: 'Industry Collaborations', value: 3, icon: <Handshake size={18} />, color: 'green' as const },
        ].map((k, i) => (
          <motion.div key={i} variants={cardVariants}>
            {loading ? <SkeletonCard lines={1} /> : <StatCard {...k} />}
          </motion.div>
        ))}
      </motion.div>

      {/* SECTION 17: NEW ASSIGNMENTS AWAITING UNIVERSITY RESPONSE */}
      {pendingAssignments.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <h3 className="text-base font-bold text-surface-900">
                New Government Problem Assignments ({pendingAssignments.length})
              </h3>
            </div>
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-medium">
              Action Required: Review & Accept
            </span>
          </div>

          <div className="space-y-4">
            {pendingAssignments.map(prob => (
              <Card
                key={prob.id}
                padding="md"
                className="border-2 border-amber-300 bg-gradient-to-r from-amber-50/40 via-white to-white shadow-card-md"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded border border-primary-200">
                        {prob.id}
                      </span>
                      <h4 className="text-base font-bold text-surface-900">{prob.title}</h4>
                      <Badge variant="warning">Awaiting University Acceptance</Badge>
                    </div>

                    <p className="text-xs text-surface-600 line-clamp-2 mt-1 mb-3">{prob.description}</p>

                    <div className="flex items-center gap-4 text-xs text-surface-500 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-surface-700">
                        <Building2 size={13} className="text-primary-600" /> Assigned by: Government of Jharkhand
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-medium text-surface-700">
                        <MapPin size={13} className="text-surface-400" /> Location: {prob.location || `${prob.district}, Jharkhand`}
                      </span>
                      <span>·</span>
                      <span className="font-bold text-amber-700 uppercase">Priority: {prob.priority}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-surface-400" /> Assigned: {formatDate(prob.allocated_at || new Date().toISOString())}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Eye size={14} />}
                      onClick={() => setSelectedProblem(prob)}
                    >
                      View Problem
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      icon={<X size={14} />}
                      loading={actionLoading}
                      onClick={() => openDeclineModal(prob)}
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Check size={14} />}
                      loading={actionLoading}
                      onClick={() => handleAccept(prob)}
                    >
                      Accept Assignment
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Accepted & Active Assignments Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card padding="none">
          <div className="flex items-center justify-between p-4 border-b border-surface-100">
            <div>
              <h3 className="text-sm font-bold text-surface-900">Accepted Problems & Active R&D</h3>
              <p className="text-2xs text-surface-400">Institutional research & student prototyping</p>
            </div>
            <Link to="/university/projects" className="text-xs text-primary-600 font-semibold hover:underline">
              View All
            </Link>
          </div>

          <div className="p-4 space-y-4">
            {acceptedAssignments.length === 0 ? (
              <div className="p-6 text-center text-surface-400 text-xs">
                No active accepted assignments yet. Accept a problem from the queue above.
              </div>
            ) : (
              acceptedAssignments.map(p => {
                const asgn = projectAssignments.find(a => a.problem_id === p.id);
                const isBothAccepted = asgn && asgn.faculty_status === 'Accepted' && asgn.team_status === 'Accepted';
                const isFacultyPending = asgn && asgn.faculty_status === 'Pending';
                const isFacultyAcceptedTeamPending = asgn && asgn.faculty_status === 'Accepted' && asgn.team_status === 'Pending';
                const isFacultyDeclined = asgn && asgn.faculty_status === 'Declined';
                const isTeamDeclined = asgn && asgn.team_status === 'Declined';

                return (
                  <div key={p.id} className="p-3 bg-surface-50 rounded-xl border border-surface-200 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-2xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                          {p.id}
                        </span>
                        <p className="text-sm font-bold text-surface-900 truncate max-w-xs">{p.title}</p>
                      </div>

                      {/* State Badge */}
                      {isBothAccepted ? (
                        <span className="text-2xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          Project Active
                        </span>
                      ) : isFacultyPending ? (
                        <span className="text-2xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                          <Clock size={10} /> Awaiting Faculty Acceptance
                        </span>
                      ) : isFacultyAcceptedTeamPending ? (
                        <span className="text-2xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded border border-blue-300 flex items-center gap-1">
                          <Clock size={10} /> Awaiting Team Acceptance
                        </span>
                      ) : isFacultyDeclined ? (
                        <span className="text-2xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                          Faculty Declined
                        </span>
                      ) : isTeamDeclined ? (
                        <span className="text-2xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                          Team Declined
                        </span>
                      ) : (
                        <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ University Accepted
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-surface-500 line-clamp-1">{p.description}</p>

                    {/* Mentorship & Team Info */}
                    {asgn && (
                      <div className="flex items-center gap-2 flex-wrap text-2xs text-surface-600 bg-white p-2 rounded-lg border border-surface-100">
                        <span>
                          Faculty: <strong>{asgn.faculty_name}</strong>{' '}
                          {asgn.faculty_status === 'Accepted' ? (
                            <span className="text-emerald-600 font-bold">✓ Accepted</span>
                          ) : asgn.faculty_status === 'Declined' ? (
                            <span className="text-rose-600 font-bold">✗ Declined</span>
                          ) : (
                            <span className="text-amber-600 font-bold">⏳ Pending</span>
                          )}
                        </span>
                        <span>·</span>
                        <span>
                          Team: <strong>{asgn.team_name}</strong>{' '}
                          {asgn.team_status === 'Accepted' ? (
                            <span className="text-emerald-600 font-bold">✓ Accepted</span>
                          ) : asgn.team_status === 'Declined' ? (
                            <span className="text-rose-600 font-bold">✗ Declined</span>
                          ) : (
                            <span className="text-amber-600 font-bold">⏳ Pending</span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Action Footnotes */}
                    <div className="flex items-center justify-between text-2xs text-surface-400 pt-1 border-t border-surface-100">
                      <span>Accepted: {formatDate(p.accepted_at || p.updatedAt)}</span>

                      {isBothAccepted ? (
                        <Link to="/university/projects" className="text-emerald-700 font-bold hover:underline flex items-center gap-1">
                          Open Project Workspace →
                        </Link>
                      ) : isFacultyDeclined || isTeamDeclined ? (
                        <Link to={`/university/matching/${p.id}`} className="text-rose-700 font-bold hover:underline flex items-center gap-1">
                          Reassign Mentor / Team →
                        </Link>
                      ) : asgn ? (
                        <Link to={`/university/matching/${p.id}`} className="text-purple-700 font-bold hover:underline flex items-center gap-1">
                          Manage Assignment ({asgn.overall_match_score}% Match) →
                        </Link>
                      ) : (
                        <Link to={`/university/matching/${p.id}`} className="text-primary-600 font-bold hover:underline flex items-center gap-1">
                          Assign Faculty & Team →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card padding="md">
          <h3 className="text-sm font-bold text-surface-900 mb-3">Institutional Quick Actions</h3>
          <div className="space-y-2">
            {[
              {
                label: 'Browse Problem Marketplace',
                href: '/university/marketplace',
                icon: <Layers size={16} />,
                badge: `${assignedProblems.length} available`,
              },
              { label: 'Assemble Research Teams', href: '/university/teams', icon: <Users size={16} />, badge: null },
              { label: 'Faculty Mentorship Roster', href: '/university/faculty', icon: <Users size={16} />, badge: null },
              { label: 'Industry Technology Collab', href: '/university/industry', icon: <Handshake size={16} />, badge: '3 active' },
            ].map(item => (
              <Link key={item.href} to={item.href}>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors cursor-pointer border border-transparent hover:border-surface-200">
                  <span className="text-surface-500">{item.icon}</span>
                  <span className="text-sm font-medium text-surface-800 flex-1">{item.label}</span>
                  {item.badge && <Badge variant="warning" size="sm">{item.badge}</Badge>}
                  <ArrowRight size={14} className="text-surface-300" />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Problem Details Drawer */}
      <Drawer open={!!selectedProblem} onClose={() => setSelectedProblem(null)} title="Assignment Review" width="lg">
        {selectedProblem && (
          <div className="p-6 space-y-5">
            <div>
              <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                {selectedProblem.id}
              </span>
              <h3 className="text-base font-bold text-surface-900 mt-2">{selectedProblem.title}</h3>
              <p className="text-xs text-surface-500 mt-1">
                Assigned on {formatDateTime(selectedProblem.allocated_at || '')} by {selectedProblem.allocated_by}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-surface-50 rounded-xl">
                <span className="text-surface-400 block mb-0.5">District</span>
                <span className="font-bold text-surface-800">{selectedProblem.district}</span>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl">
                <span className="text-surface-400 block mb-0.5">Category</span>
                <span className="font-bold text-surface-800">{selectedProblem.category || selectedProblem.domain}</span>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl">
                <span className="text-surface-400 block mb-0.5">Affected Population</span>
                <span className="font-bold text-surface-800">{selectedProblem.affectedPopulation?.toLocaleString() || 100}</span>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl">
                <span className="text-surface-400 block mb-0.5">Priority</span>
                <span className="font-bold uppercase text-amber-700">{selectedProblem.priority}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-1">Problem Description</p>
              <div className="p-3.5 bg-surface-50 rounded-xl text-sm text-surface-700 leading-relaxed border border-surface-100">
                {selectedProblem.description}
              </div>
            </div>

            {selectedProblem.override_reason && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <strong>Government Assignment Note:</strong> "{selectedProblem.override_reason}"
              </div>
            )}

            <div className="border-t border-surface-100 pt-4 flex gap-3">
              {selectedProblem.allocation_status === 'Allocated' ? (
                <>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => openDeclineModal(selectedProblem)}
                  >
                    Decline Assignment
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => handleAccept(selectedProblem)}
                  >
                    Accept Assignment
                  </Button>
                </>
              ) : (
                <div className="w-full text-center text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-lg">
                  ✓ Assignment Officially Accepted on {formatDate(selectedProblem.accepted_at || '')}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Decline Reason Modal */}
      <Modal open={declineModalOpen} onClose={() => setDeclineModalOpen(false)} title="Decline Assignment">
        <div className="p-4 space-y-4">
          <p className="text-xs text-surface-600">
            Please indicate why your institution is unable to take up problem <strong>{targetProblemToDecline?.id}</strong>.
            This reason will be recorded and the government officer will be notified to re-allocate.
          </p>
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">Decline Reason (Required)</label>
            <textarea
              className="input w-full text-sm min-h-24"
              placeholder="e.g. Existing faculty capacity fully committed to current semester projects, lack of specialized water testing spectrometer..."
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-surface-100">
            <Button variant="secondary" onClick={() => setDeclineModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={actionLoading} onClick={handleConfirmDecline}>
              Confirm Decline
            </Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
