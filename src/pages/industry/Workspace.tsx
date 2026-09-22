import React, { useState, useEffect } from 'react';
import { 
  Layers, Cpu, CheckCircle2, Clock, MessageSquare, FileText, 
  Building2, Users, DollarSign, Send, ArrowRight, ShieldCheck, 
  PlayCircle, Award, AlertCircle, Plus, Check, RefreshCw, MapPin
} from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/Progress';
import { Modal } from '../../components/ui/Modal';
import { db } from '../../services/db';
import type { 
  ProjectAssignment, Prototype, ProblemEcosystem, 
  WorkspaceTask, IndustryCommitment, ProjectActivityEvent 
} from '../../types';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';
import { PilotDeploymentModal } from '../../components/industry/PilotDeploymentModal';
import { FinalGovernmentSubmissionModal } from '../../components/industry/FinalGovernmentSubmissionModal';
import { useApp } from '../../context/AppContext';

export default function IndustryWorkspace() {
  const { addToast } = useApp();
  const [activeProblemId, setActiveProblemId] = useState('P-1030');
  const [selectedTraceProblemId, setSelectedTraceProblemId] = useState<string | null>(null);

  // Modals
  const [pilotModalOpen, setPilotModalOpen] = useState(false);
  const [finalSubmissionModalOpen, setFinalSubmissionModalOpen] = useState(false);
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<WorkspaceTask['category']>('hardware');
  const [newTaskAssigneeRole, setNewTaskAssigneeRole] = useState<'student' | 'faculty' | 'industry'>('student');
  const [newTaskAssigneeName, setNewTaskAssigneeName] = useState('Pooja Kumari (Squad Lead)');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // Advisory message state
  const [remarkInput, setRemarkInput] = useState('');

  // Task filter
  const [taskFilter, setTaskFilter] = useState<'all' | 'todo' | 'in_progress' | 'review' | 'completed'>('all');

  // Load active ecosystem data
  const [ecosystem, setEcosystem] = useState<ProblemEcosystem | null>(null);
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [commitment, setCommitment] = useState<IndustryCommitment | null>(null);
  const [timeline, setTimeline] = useState<ProjectActivityEvent[]>([]);

  const loadWorkspaceData = () => {
    const eco = db.getProblemEcosystem(activeProblemId);
    setEcosystem(eco);

    const taskList = db.getWorkspaceTasks(activeProblemId);
    setTasks(taskList);

    const commit = db.getIndustryCommitment(activeProblemId);
    setCommitment(commit);

    const events = db.getProjectTimeline(activeProblemId);
    setTimeline(events);
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [activeProblemId]);

  const prob = ecosystem?.problem;
  const asgn = ecosystem?.project;
  const proto = ecosystem?.prototype;
  const squad = ecosystem?.squad;
  const research = db.getResearchEntries(activeProblemId);

  // Release tranche handler
  const handleReleaseTranche = () => {
    if (!commitment) return;
    const remaining = (commitment.fundingApproved || commitment.fundingCommitted || 0) - (commitment.fundingReleased || 0);
    const amountToRelease = Math.min(50000, remaining);

    if (amountToRelease <= 0) {
      addToast({
        type: 'info',
        title: 'All Tranches Released',
        message: 'The full committed funding amount has already been disbursed to the university research cell.',
      });
      return;
    }

    db.releaseFundingTranche(activeProblemId, amountToRelease, 'Milestone review completed and approved by Industry Mentor');
    addToast({
      type: 'success',
      title: 'Funding Tranche Released!',
      message: `₹${amountToRelease.toLocaleString()} disbursed to ${asgn?.university_name || 'BIT Sindri'} Innovation Account.`,
    });
    loadWorkspaceData();
  };

  // Add Task handler
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    db.addWorkspaceTask(activeProblemId, {
      problemId: activeProblemId,
      projectId: asgn?.id || `PROJ-${activeProblemId}`,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      category: newTaskCategory,
      status: 'todo',
      assignedTo: newTaskAssigneeName,
      assignedRole: newTaskAssigneeRole,
      assignedBy: commitment?.industryMentorName || 'Industry Mentor',
      dueDate: newTaskDueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    });

    addToast({
      type: 'success',
      title: 'Sprint Task Added',
      message: `Task assigned to ${newTaskAssigneeName}.`,
    });

    setNewTaskTitle('');
    setNewTaskDesc('');
    setCreateTaskModalOpen(false);
    loadWorkspaceData();
  };

  // Update task status handler
  const handleTaskStatus = (taskId: string, newStatus: WorkspaceTask['status']) => {
    db.updateWorkspaceTask(activeProblemId, taskId, { status: newStatus });
    loadWorkspaceData();
    addToast({
      type: 'info',
      title: 'Task Status Updated',
      message: `Task transitioned to ${newStatus.toUpperCase()}`,
    });
  };

  // Post advisory message
  const handlePostRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkInput.trim() || !asgn) return;

    db.logProjectActivity({
      problemId: activeProblemId,
      actorRole: 'industry',
      actorName: commitment?.industryMentorName || 'Dr. Rajesh Varma (Industry Mentor)',
      action: 'Posted Technical Advisory Directive',
      description: remarkInput.trim(),
      category: 'update',
    });

    db.createNotification({
      userId: 'student',
      role: 'student',
      problemId: activeProblemId,
      type: 'collaboration',
      title: 'New Industry Advisory Directive',
      message: `${commitment?.industryMentorName || 'Industry Mentor'}: "${remarkInput.trim()}"`,
    });

    addToast({ 
      type: 'success', 
      title: 'Advisory Dispatched', 
      message: 'Guidance directive notified to university squad sprint!' 
    });
    setRemarkInput('');
    loadWorkspaceData();
  };

  const filteredTasks = tasks.filter(t => taskFilter === 'all' ? true : t.status === taskFilter);

  const totalFunding = commitment?.fundingApproved || commitment?.fundingCommitted || 350000;
  const releasedFunding = commitment?.fundingReleased || 0;
  const remainingFunding = totalFunding - releasedFunding;
  const fundingPercent = totalFunding > 0 ? Math.round((releasedFunding / totalFunding) * 100) : 0;

  return (
    <PageTransition>
      <div className="space-y-6">
        
        {/* Top Header & Problem Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Shared Co-Pilot Industry & Research Workspace"
            subtitle="Real-time collaborative hub uniting Corporate Mentors, Faculty Leads, and Student Innovation Squads"
          />

          {/* Problem Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-surface-100 p-1 rounded-xl border border-surface-200">
            <button
              onClick={() => setActiveProblemId('P-1030')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeProblemId === 'P-1030'
                  ? 'bg-white text-primary-700 shadow-card-sm border border-surface-200/60 font-bold'
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              P-1030 (Agri Pest Detection)
            </button>
            <button
              onClick={() => setActiveProblemId('P-1029')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeProblemId === 'P-1029'
                  ? 'bg-white text-primary-700 shadow-card-sm border border-surface-200/60 font-bold'
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              P-1029 (JUVNL Transformer)
            </button>
          </div>
        </div>

        {/* Mission Banner Card */}
        {prob && (
          <Card padding="lg" className="border-l-4 border-l-primary-600 border border-surface-200 bg-white shadow-card-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <button
                    onClick={() => setSelectedTraceProblemId(prob.id)}
                    className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors inline-flex items-center gap-1"
                  >
                    <Layers size={12} /> {prob.id}
                  </button>
                  <Badge variant="primary">{prob.category}</Badge>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                    <CheckCircle2 size={12} /> Co-Pilot Sprint Active
                  </span>
                  <span className="text-xs font-mono font-medium text-surface-500 bg-surface-50 px-2 py-0.5 rounded border border-surface-200">
                    Stage: {ecosystem?.lifecycleStage?.toUpperCase() || 'PROTOTYPING'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-surface-900 tracking-tight">{prob.title}</h3>
                <p className="text-xs text-surface-500">
                  Origin: <strong>{prob.location}</strong> • University: <strong>{asgn?.university_name || 'BIT Sindri'}</strong> • Squad: <strong>{squad?.team_name || asgn?.team_name || 'Team Innovators-07'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTraceProblemId(prob.id)}
                  className="text-xs flex items-center gap-1.5"
                >
                  <Layers size={13} /> Full Lifecycle Trace
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCreateTaskModalOpen(true)}
                  className="text-xs flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Sprint Task
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Phase 3 & 4 Action Row: Funding Tracker & Deployment Gateways */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Active Industry Commitment Card */}
          <Card padding="lg" className="border border-surface-200 bg-white shadow-card-sm space-y-4">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-600" />
                <h4 className="text-sm font-bold text-surface-900">Industry Sponsorship</h4>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                Active Partner
              </span>
            </div>

            <div>
              <span className="text-xs text-surface-500 block">Sponsoring Corporation</span>
              <p className="font-bold text-surface-900 text-sm">{commitment?.industryPartnerName || 'AgriTech Jharkhand Solutions'}</p>
              <p className="text-xs text-surface-600 mt-1">
                Designated Mentor: <strong>{commitment?.industryMentorName || 'Dr. Rajesh Varma'}</strong> ({commitment?.industryMentorRole || 'Chief Agronomist'})
              </p>
            </div>

            {/* Funding Tranche Tracker */}
            <div className="p-3 bg-surface-50 rounded-xl border border-surface-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-surface-700">Financial Tranches Released:</span>
                <span className="font-mono font-bold text-emerald-700">{fundingPercent}% ({releasedFunding.toLocaleString()} / ₹{totalFunding.toLocaleString()})</span>
              </div>
              <ProgressBar value={fundingPercent} className="h-2" />
              <div className="flex items-center justify-between text-2xs text-surface-500 pt-1">
                <span>Remaining in Escrow: ₹{remainingFunding.toLocaleString()}</span>
                <span>Tranche Size: ₹50,000</span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              disabled={remainingFunding <= 0}
              onClick={handleReleaseTranche}
              className="w-full text-xs font-bold justify-center"
            >
              <DollarSign className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              {remainingFunding > 0 ? 'Release Next Tranche (₹50,000)' : 'All Funding Fully Released ✓'}
            </Button>
          </Card>

          {/* Field Pilot Deployment Gateway Card (Stage 5) */}
          <Card padding="lg" className="border border-surface-200 bg-white shadow-card-sm space-y-4">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-bold text-surface-900">Stage 5: Field Pilot Trial</h4>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${
                ecosystem?.pilotDeployment?.status === 'approved' || ecosystem?.pilotDeployment?.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : ecosystem?.pilotDeployment?.status === 'requested' || ecosystem?.pilotDeployment?.status === 'under_govt_review'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-surface-100 text-surface-600 border-surface-200'
              }`}>
                {ecosystem?.pilotDeployment?.status ? ecosystem.pilotDeployment.status.toUpperCase().replace(/_/g, ' ') : 'NOT REQUESTED'}
              </span>
            </div>

            <p className="text-xs text-surface-600 leading-relaxed">
              Before district-wide scaling, deploy the verified prototype in designated target panchayats/wards with government oversight.
            </p>

            {ecosystem?.pilotDeployment ? (
              <div className="p-3 bg-surface-50 rounded-xl border border-surface-200 text-xs space-y-1">
                <div className="flex items-center justify-between font-semibold text-surface-800">
                  <span>Location:</span>
                  <span className="font-normal text-surface-600">{ecosystem.pilotDeployment.targetLocation}</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-surface-800">
                  <span>Duration:</span>
                  <span className="font-normal text-surface-600">{ecosystem.pilotDeployment.durationDays} Days</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-surface-800">
                  <span>Coverage:</span>
                  <span className="font-normal text-surface-600">{ecosystem.pilotDeployment.sampleSizeOrCoverage}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-surface-50 rounded-xl border border-surface-200 text-xs text-surface-500">
                No active pilot request submitted yet. Once prototype lab testing passes 80% readiness, initiate the authorization request.
              </div>
            )}

            <Button
              size="sm"
              variant="primary"
              onClick={() => setPilotModalOpen(true)}
              className="w-full text-xs font-bold justify-center"
            >
              <PlayCircle className="w-3.5 h-3.5 mr-1" />
              {ecosystem?.pilotDeployment ? 'Update / Re-request Pilot Deployment' : 'Request Field Pilot Approval'}
            </Button>
          </Card>

          {/* Final Government Submission Gateway (Stage 6) */}
          <Card padding="lg" className="border border-surface-200 bg-white shadow-card-sm space-y-4">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-bold text-surface-900">Stage 6: Govt Final Resolution</h4>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${
                ecosystem?.finalSubmission?.status === 'validated_for_scale' || (ecosystem?.finalSubmission?.status as any) === 'resolved' || (ecosystem?.finalSubmission?.status as any) === 'scaling_approved'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : ecosystem?.finalSubmission?.status === 'submitted'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-surface-100 text-surface-600 border-surface-200'
              }`}>
                {ecosystem?.finalSubmission?.status ? ecosystem.finalSubmission.status.toUpperCase().replace(/_/g, ' ') : 'PENDING PILOT'}
              </span>
            </div>

            <p className="text-xs text-surface-600 leading-relaxed">
              Compile verified pilot metrics, field telemetry, and cost-per-beneficiary to formally transition citizen grievance into Resolved status.
            </p>

            {ecosystem?.finalSubmission ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1 text-emerald-900">
                <div className="font-bold">Final Package Submitted to Government:</div>
                <p className="text-2xs text-emerald-800 line-clamp-2">{ecosystem.finalSubmission.executiveSummary}</p>
                <div className="text-2xs pt-1 border-t border-emerald-200/60 font-semibold">
                  Feasibility: {(ecosystem.finalSubmission.scalingFeasibility || 'ready_to_scale').replace(/_/g, ' ').toUpperCase()}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-surface-50 rounded-xl border border-surface-200 text-xs text-surface-500">
                Awaiting final telemetry validation from Ormanjhi agricultural cluster pilot before state-wide package submission.
              </div>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setFinalSubmissionModalOpen(true)}
              className="w-full text-xs font-bold justify-center"
            >
              <Award className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              {ecosystem?.finalSubmission ? 'Update Government Submission' : 'Submit Final Solution Package'}
            </Button>
          </Card>

        </div>

        {/* Main Workspace Body: Real-Time Task Management & Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Left Column (2 Cols): Real-time Tasks */}
          <div className="lg:col-span-2 space-y-4">
            
            <Card padding="lg" className="border border-surface-200 bg-white shadow-card-sm space-y-4">
              
              {/* Task Header & Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-primary-600" />
                    Sprint Execution & Verification Tasks ({tasks.length})
                  </h4>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Co-managed between Industry Mentors, Faculty, and Student Squad Engineers
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  {(['all', 'todo', 'in_progress', 'review', 'completed'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setTaskFilter(tab)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        taskFilter === tab
                          ? 'bg-primary-50 text-primary-700 font-bold border border-primary-200'
                          : 'text-surface-600 hover:bg-surface-50'
                      }`}
                    >
                      {tab.toUpperCase().replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-surface-400">
                    No tasks found in this filter category. Click "Add Sprint Task" to create one.
                  </div>
                ) : (
                  filteredTasks.map(task => {
                    const isCompleted = task.status === 'completed';
                    const isInProgress = task.status === 'in_progress';
                    const isReview = task.status === 'review';

                    return (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-xl border border-surface-200 bg-surface-50 hover:bg-white hover:border-surface-300 transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded bg-white border border-surface-200 text-surface-700 uppercase">
                                {task.category}
                              </span>
                              <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                                isCompleted ? 'bg-emerald-100 text-emerald-800' :
                                isInProgress ? 'bg-blue-100 text-blue-800' :
                                isReview ? 'bg-amber-100 text-amber-800' :
                                'bg-surface-200 text-surface-700'
                              }`}>
                                {task.status.toUpperCase().replace('_', ' ')}
                              </span>
                              {task.dueDate && (
                                <span className="text-2xs text-surface-500">
                                  Due: {task.dueDate}
                                </span>
                              )}
                            </div>
                            <h5 className="text-xs font-bold text-surface-900 mt-1">{task.title}</h5>
                          </div>

                          {/* Quick transition action buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {task.status === 'todo' && (
                              <button
                                onClick={() => handleTaskStatus(task.id, 'in_progress')}
                                className="px-2.5 py-1 text-2xs font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                              >
                                Start Work
                              </button>
                            )}
                            {task.status === 'in_progress' && (
                              <button
                                onClick={() => handleTaskStatus(task.id, 'review')}
                                className="px-2.5 py-1 text-2xs font-semibold rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                              >
                                Submit to Review
                              </button>
                            )}
                            {task.status === 'review' && (
                              <button
                                onClick={() => handleTaskStatus(task.id, 'completed')}
                                className="px-2.5 py-1 text-2xs font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                              >
                                <Check size={11} /> Approve & Sign-off
                              </button>
                            )}
                            {task.status === 'completed' && (
                              <span className="text-2xs font-bold text-emerald-700 inline-flex items-center gap-1">
                                <Check size={12} /> Verified
                              </span>
                            )}
                          </div>
                        </div>

                        {task.description && (
                          <p className="text-xs text-surface-600 leading-relaxed pl-1">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-2xs text-surface-500 pt-1 border-t border-surface-200/60">
                          <span>Assigned to: <strong className="text-surface-800">{task.assignedTo}</strong> ({task.assignedRole})</span>
                          <span>Assigned by: {task.assignedBy}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </Card>

            {/* Corporate Engineer Technical Advisory Input */}
            <Card padding="lg" className="border border-surface-200 bg-white shadow-card-sm space-y-3">
              <h4 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                <MessageSquare size={16} className="text-primary-600" />
                Dispatched Corporate Mentor Advisory Directive
              </h4>
              <p className="text-xs text-surface-500">
                Directly transmit technical advice, testbed guidance, or enclosure specifications to the student squad workspace.
              </p>
              <form onSubmit={handlePostRemark} className="space-y-3">
                <textarea
                  rows={2}
                  placeholder="Share telemetry validation feedback, component supply lead times, or testing protocol advice..."
                  value={remarkInput}
                  onChange={e => setRemarkInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-xs text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex justify-end">
                  <Button variant="primary" size="sm" type="submit" className="text-xs">
                    <Send className="w-3.5 h-3.5 mr-1" /> Post Directive to Student Squad
                  </Button>
                </div>
              </form>
            </Card>

          </div>

          {/* Right Column: Prototype Specs & Activity Timeline */}
          <div className="space-y-4">
            
            {/* Prototype Telemetry Specs */}
            {proto && (
              <Card padding="lg" className="border border-surface-200 bg-white shadow-card-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                    <Cpu size={16} className="text-primary-600" /> Prototype Build & Specs
                  </h4>
                  <span className="text-xs font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                    {proto.version}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <p className="text-surface-600 leading-relaxed">{proto.description}</p>
                  {proto.architecture && (
                    <div className="p-2.5 rounded bg-surface-50 border border-surface-200 text-[11px] font-mono text-surface-800">
                      {proto.architecture}
                    </div>
                  )}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-surface-500 border-t border-surface-100">
                    <span>Field Readiness: <strong className="text-primary-700">{proto.readinessScore}%</strong></span>
                    <span className="text-emerald-700 font-medium">Lab Bench Tested ✓</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Real Project Chronological Activity Timeline */}
            <Card padding="lg" className="border border-surface-200 bg-white shadow-card-sm space-y-3">
              <div className="flex items-center justify-between border-b border-surface-100 pb-2">
                <h4 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                  <Clock size={16} className="text-teal-600" />
                  Real Project Event Log
                </h4>
                <button
                  onClick={loadWorkspaceData}
                  className="text-surface-400 hover:text-surface-700 transition-colors"
                  title="Refresh Timeline"
                >
                  <RefreshCw size={13} />
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {timeline.length === 0 ? (
                  <p className="text-xs text-surface-400 py-4 text-center">No timeline events recorded yet.</p>
                ) : (
                  timeline.map(event => (
                    <div key={event.id} className="text-xs border-l-2 border-primary-300 pl-3 py-1 space-y-0.5 relative">
                      <div className="flex items-center justify-between text-2xs text-surface-500">
                        <span className="font-semibold text-surface-800">{event.actorName} ({event.actorRole})</span>
                        <span>{new Date(event.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="font-bold text-surface-900">{event.action}</div>
                      {event.description && (
                        <p className="text-surface-600 text-2xs leading-relaxed">{event.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Empirical Research & Scientific Basis */}
            <Card padding="lg" className="border border-surface-200 bg-white shadow-card-sm space-y-3">
              <h4 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                <FileText size={16} className="text-teal-600" /> Scientific Basis & Papers
              </h4>
              <div className="space-y-2 text-xs">
                {research.map(r => (
                  <div key={r.id} className="p-2.5 rounded-lg bg-surface-50 border border-surface-200">
                    <span className="font-semibold text-surface-900 block mb-0.5">{r.title}</span>
                    <p className="text-surface-500 text-[11px] line-clamp-2">{r.findings}</p>
                  </div>
                ))}
              </div>
            </Card>

          </div>

        </div>

        {/* Modals */}
        {ecosystem && (
          <>
            {pilotModalOpen && (
              <PilotDeploymentModal
                ecosystem={ecosystem}
                partnerId={commitment?.industryPartnerId || 'partner-agritech-01'}
                partnerName={commitment?.industryPartnerName || 'AgriTech Jharkhand Solutions'}
                onClose={() => setPilotModalOpen(false)}
                onSuccess={() => {
                  setPilotModalOpen(false);
                  loadWorkspaceData();
                }}
              />
            )}

            {finalSubmissionModalOpen && (
              <FinalGovernmentSubmissionModal
                ecosystem={ecosystem}
                partnerId={commitment?.industryPartnerId || 'partner-agritech-01'}
                partnerName={commitment?.industryPartnerName || 'AgriTech Jharkhand Solutions'}
                onClose={() => setFinalSubmissionModalOpen(false)}
                onSuccess={() => {
                  setFinalSubmissionModalOpen(false);
                  loadWorkspaceData();
                }}
              />
            )}
          </>
        )}

        {/* Add Task Modal */}
        <Modal
          open={createTaskModalOpen}
          onClose={() => setCreateTaskModalOpen(false)}
          title="Add Collaborative Sprint Task"
        >
          <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-surface-700 block mb-1">Task Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Fabricate IP67 Enclosure with Rubber Gasket Seals"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-surface-200 bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="font-bold text-surface-700 block mb-1">Task Description</label>
              <textarea
                rows={2}
                placeholder="Specify requirements, tolerances, test benchmarks, or component deliverables..."
                value={newTaskDesc}
                onChange={e => setNewTaskDesc(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-surface-200 bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-surface-700 block mb-1">Task Category</label>
                <select
                  value={newTaskCategory}
                  onChange={e => setNewTaskCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-surface-200 bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="hardware">Hardware & Enclosure</option>
                  <option value="software">Edge AI & Firmware</option>
                  <option value="testing">Lab & Bench Testing</option>
                  <option value="field_trial">Field Trial Deployment</option>
                  <option value="compliance">Government Compliance</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-surface-700 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={e => setNewTaskDueDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-surface-200 bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-surface-700 block mb-1">Assignee Role</label>
                <select
                  value={newTaskAssigneeRole}
                  onChange={e => setNewTaskAssigneeRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-surface-200 bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="student">Student Squad Engineer</option>
                  <option value="faculty">Faculty Lead</option>
                  <option value="industry">Industry Specialist</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-surface-700 block mb-1">Assignee Name</label>
                <input
                  type="text"
                  value={newTaskAssigneeName}
                  onChange={e => setNewTaskAssigneeName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-surface-200 bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setCreateTaskModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Create & Assign Task
              </Button>
            </div>
          </form>
        </Modal>

        {/* Lifecycle Trace Modal */}
        <ProblemEcosystemModal
          problemId={selectedTraceProblemId}
          isOpen={!!selectedTraceProblemId}
          onClose={() => setSelectedTraceProblemId(null)}
        />

      </div>
    </PageTransition>
  );
}
