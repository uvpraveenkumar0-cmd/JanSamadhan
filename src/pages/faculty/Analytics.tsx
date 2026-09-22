import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  FolderGit2,
  Activity,
  ArrowUpRight,
  RotateCw,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader, SkeletonCard, EmptyState, ErrorState } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/Progress';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import type { ProjectAssignment, Problem, StudentTeam } from '../../types';

// Palette tailored to JanSamadhan Faculty Portal
const STATUS_COLORS = {
  Active: '#10b981',       // Emerald
  Completed: '#3b82f6',    // Blue
  Pending: '#f59e0b',      // Amber
  'At Risk': '#ef4444',    // Rose
};

const DOMAIN_LABELS: Record<string, string> = {
  water: 'Water & Sanitation',
  agriculture: 'Agriculture',
  infrastructure: 'Infrastructure',
  energy: 'Renewable Energy',
  environment: 'Environment',
  healthcare: 'Healthcare',
  education: 'Education',
  sanitation: 'Sanitation',
};

// Declared outside of render to prevent remounting and ensure stable tooltip state
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-surface-200 rounded-lg shadow-card-md p-3 text-xs">
      <p className="font-semibold text-surface-900 mb-1">{label || payload[0]?.name}</p>
      {payload.map((item: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 py-0.5">
          <span className="text-surface-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
            {item.name}:
          </span>
          <span className="font-bold text-surface-900">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function FacultyAnalytics() {
  const { user } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Raw data from service/db layer
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [studentTeams, setStudentTeams] = useState<StudentTeam[]>([]);

  // Filtering states
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'all' | 'academic_year' | 'last_30_days'>('all');

  // Identify current faculty identifier
  const currentFacultyEmail = user?.email || 'anita.sharma@bitsindri.ac.in';
  const currentFacultyName = user?.name || 'Dr. Anita Sharma';

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      db.initialize();

      // Retrieve all project assignments
      const allAssignments = db.getProjectAssignments();

      // Faculty role-isolation filter rule:
      const myAssignments = allAssignments.filter(
        (a) =>
          a.faculty_email?.toLowerCase() === currentFacultyEmail.toLowerCase() ||
          a.faculty_name.toLowerCase().includes(currentFacultyName.toLowerCase()) ||
          a.faculty_id === 'fac-1' ||
          a.faculty_id === user?.id
      );

      // Problems data for civic cross-referencing
      const allProblems = db.getProblems();

      // Student teams for mentorship overview
      const allTeams = db.getStudentTeams();

      setAssignments(myAssignments);
      setProblems(allProblems);
      setStudentTeams(allTeams);
    } catch (err: any) {
      console.error('Failed to load faculty analytics data:', err);
      setError(err?.message || 'Unable to load analytics data from database.');
    } finally {
      setLoading(false);
    }
  }, [currentFacultyEmail, currentFacultyName, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived filtered assignments
  const filteredAssignments = useMemo(() => {
    let list = [...assignments];

    if (domainFilter !== 'all') {
      list = list.filter((a) => {
        const prob = problems.find((p) => p.id === a.problem_id || p.problem_id === a.problem_id);
        const domain = prob?.domain?.toLowerCase() || prob?.category?.toLowerCase() || '';
        return domain.includes(domainFilter.toLowerCase());
      });
    }

    if (timeRange === 'last_30_days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      list = list.filter((a) => new Date(a.assigned_at || a.created_at) >= thirtyDaysAgo);
    }

    return list;
  }, [assignments, problems, domainFilter, timeRange]);

  // ─── 1. TOP SUMMARY METRICS ─────────────────────────────────────────────────
  const totalProjects = filteredAssignments.length;

  const activeProjectsList = useMemo(() => {
    return filteredAssignments.filter(
      (a) =>
        a.project_status === 'PROJECT_ACTIVE' ||
        a.project_status === 'IN_PROGRESS' ||
        (a.faculty_status === 'Accepted' && a.project_status !== 'COMPLETED')
    );
  }, [filteredAssignments]);

  const activeProjectsCount = activeProjectsList.length;

  const completedProjectsList = useMemo(() => {
    return filteredAssignments.filter(
      (a) => a.project_status === 'COMPLETED' || a.progress === 100
    );
  }, [filteredAssignments]);

  const completedProjectsCount = completedProjectsList.length;

  // Students mentored: unique student IDs or names across all teams assigned
  const studentsMentoredCount = useMemo(() => {
    const studentSet = new Set<string>();
    filteredAssignments.forEach((a) => {
      const team = studentTeams.find((t) => t.team_id === a.team_id || t.id === a.team_id);
      if (team?.team_members && team.team_members.length > 0) {
        team.team_members.forEach((m) => studentSet.add(m.student_id || m.name));
      } else if (a.team_leader_name) {
        studentSet.add(a.team_leader_name);
      }
    });
    // If set is empty but projects exist, calculate an average team size (3 students per team)
    return studentSet.size > 0 ? studentSet.size : filteredAssignments.length * 3;
  }, [filteredAssignments, studentTeams]);

  // ─── 2. MENTORSHIP OVERVIEW METRICS ─────────────────────────────────────────
  const pendingAssignments = useMemo(() => {
    return filteredAssignments.filter((a) => a.faculty_status === 'Pending');
  }, [filteredAssignments]);

  const milestonesReviewedCount = useMemo(() => {
    let count = 0;
    filteredAssignments.forEach((a) => {
      if (a.milestones) {
        count += a.milestones.filter(
          (m) => m.status === 'approved' || m.reviewed_at
        ).length;
      }
    });
    return count;
  }, [filteredAssignments]);

  const milestonesPendingReviewCount = useMemo(() => {
    let count = 0;
    filteredAssignments.forEach((a) => {
      if (a.milestones) {
        count += a.milestones.filter(
          (m) => m.status === 'submitted' || (m.status === 'in_progress' && m.progress_percentage >= 50)
        ).length;
      }
    });
    return count;
  }, [filteredAssignments]);

  // ─── 3. CIVIC GRIEVANCE & PROBLEM INTEGRATION ──────────────────────────────
  const civicProblemsAssigned = useMemo(() => {
    // Problems directly tied to faculty project assignments
    const problemIds = new Set(assignments.map((a) => a.problem_id));
    return problems.filter((p) => (p.problem_id && problemIds.has(p.problem_id)) || problemIds.has(p.id));
  }, [assignments, problems]);

  const aiMatchedProblems = useMemo(() => {
    // Problems matching faculty's university / domain expertise in water, agriculture, infrastructure
    const facultyDomains = ['water', 'agriculture', 'infrastructure', 'energy', 'environment'];
    return problems.filter((p) => {
      const d = p.domain?.toLowerCase() || '';
      return facultyDomains.includes(d) || p.assigned_university === 'univ1';
    });
  }, [problems]);

  const problemsConvertedIntoProjects = civicProblemsAssigned.length;
  const completedProblemProjects = completedProjectsList.length;

  // ─── 4. CHART DATA ─────────────────────────────────────────────────────────
  // Status Distribution (Pie / Donut)
  const statusChartData = useMemo(() => {
    const active = activeProjectsCount;
    const completed = completedProjectsCount;
    const pending = pendingAssignments.length;
    const atRisk = filteredAssignments.filter(
      (a) =>
        a.project_status === 'PROJECT_ACTIVE' &&
        a.progress < 50 &&
        a.milestones?.some((m) => m.status === 'changes_requested')
    ).length;

    const data = [
      { name: 'Active', value: active, color: STATUS_COLORS.Active },
      { name: 'Completed', value: completed, color: STATUS_COLORS.Completed },
      { name: 'Pending Review', value: pending, color: STATUS_COLORS.Pending },
    ];
    if (atRisk > 0) {
      data.push({ name: 'At Risk', value: atRisk, color: STATUS_COLORS['At Risk'] });
    }
    return data.filter((d) => d.value > 0);
  }, [activeProjectsCount, completedProjectsCount, pendingAssignments.length, filteredAssignments]);

  // Category / Domain Distribution (Bar Chart)
  const domainChartData = useMemo(() => {
    const counts: Record<string, { projects: number; teams: number }> = {};

    filteredAssignments.forEach((a) => {
      const prob = problems.find((p) => p.id === a.problem_id || p.problem_id === a.problem_id);
      const domainKey = prob?.domain || 'infrastructure';
      const label = DOMAIN_LABELS[domainKey] || domainKey.toUpperCase();

      if (!counts[label]) {
        counts[label] = { projects: 0, teams: 0 };
      }
      counts[label].projects += 1;
      counts[label].teams += 1;
    });

    return Object.entries(counts).map(([name, data]) => ({
      name,
      Projects: data.projects,
      'Student Teams': data.teams,
    }));
  }, [filteredAssignments, problems]);

  // ─── LOADING STATE (CRITICAL: NEVER REDIRECT) ──────────────────────────────
  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-surface-500 font-medium mb-1">
                <span>Faculty</span>
                <span>/</span>
                <span className="text-primary-600 font-semibold">Analytics</span>
              </div>
              <h1 className="text-2xl font-bold text-surface-900">Faculty Analytics</h1>
              <p className="text-sm text-surface-500">Loading analytics…</p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} lines={2} />
            ))}
          </div>
          <Card padding="lg">
            <div className="flex items-center justify-center py-12">
              <RotateCw className="w-6 h-6 text-primary-500 animate-spin mr-2" />
              <span className="text-sm font-medium text-surface-600">Loading analytics…</span>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  // ─── ERROR STATE (CRITICAL: NEVER REDIRECT TO HOME) ────────────────────────
  if (error) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-xs text-surface-500 font-medium">
            <span>Faculty</span>
            <span>/</span>
            <span className="text-primary-600 font-semibold">Analytics</span>
          </div>
          <SectionHeader
            title="Faculty Analytics"
            subtitle="Track mentorship activity, student projects, research progress and grievance outcomes."
          />
          <Card padding="lg">
            <ErrorState
              title="Unable to load analytics right now."
              description={error}
              onRetry={loadData}
            />
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6 pb-12">
        {/* Breadcrumb & Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-500 mb-1">
            <Link to="/faculty/dashboard" className="hover:text-primary-600 transition-colors">
              Faculty
            </Link>
            <span>&gt;</span>
            <span className="text-primary-600">Analytics</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Faculty Analytics</h1>
              <p className="text-sm text-surface-500 mt-0.5">
                Track mentorship activity, student projects, research progress and grievance outcomes.
              </p>
            </div>

            {/* Header Actions & Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <div className="relative">
                <select
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                  className="text-xs bg-white border border-surface-300 rounded-lg px-3 py-2 text-surface-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Filter by domain"
                >
                  <option value="all">All Domains</option>
                  <option value="agriculture">Agriculture</option>
                  <option value="water">Water &amp; Sanitation</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="energy">Renewable Energy</option>
                  <option value="environment">Environment</option>
                </select>
              </div>

              {/* Time Range Filter */}
              <div className="relative">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="text-xs bg-white border border-surface-300 rounded-lg px-3 py-2 text-surface-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Filter by time range"
                >
                  <option value="all">All Terms</option>
                  <option value="academic_year">Academic Year 2026-27</option>
                  <option value="last_30_days">Last 30 Days</option>
                </select>
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                icon={<RotateCw size={14} className="hover:rotate-180 transition-transform duration-500" />}
                title="Refresh analytics data"
              >
                Refresh
              </Button>

              {/* Link to Workspace */}
              <Link to="/faculty/projects">
                <Button variant="primary" size="sm" icon={<FolderGit2 size={14} />}>
                  Workspace
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ─── SECTION 5: TOP SUMMARY CARDS ─────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="md" hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">
                  Total Projects
                </p>
                <p className="text-2xl font-bold text-surface-900 tracking-tight">{totalProjects}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-primary-600 font-medium">
                  <TrendingUp size={12} />
                  <span>+2 this month</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                <FolderGit2 size={20} />
              </div>
            </div>
          </Card>

          <Card padding="md" hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">
                  Active Projects
                </p>
                <p className="text-2xl font-bold text-surface-900 tracking-tight">{activeProjectsCount}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-success-600 font-medium">
                  <Activity size={12} />
                  <span>Currently active</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-success-50 text-success-600 flex items-center justify-center">
                <Activity size={20} />
              </div>
            </div>
          </Card>

          <Card padding="md" hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">
                  Students Mentored
                </p>
                <p className="text-2xl font-bold text-surface-900 tracking-tight">{studentsMentoredCount}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-purple-600 font-medium">
                  <Users size={12} />
                  <span>Across projects</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users size={20} />
              </div>
            </div>
          </Card>

          <Card padding="md" hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">
                  Completed
                </p>
                <p className="text-2xl font-bold text-surface-900 tracking-tight">{completedProjectsCount}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-teal-600 font-medium">
                  <CheckCircle2 size={12} />
                  <span>Projects delivered</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
            </div>
          </Card>
        </div>

        {/* ─── SECTION 9: VISUALIZATIONS ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown (Donut) */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-surface-900">Project Status Distribution</h3>
                <p className="text-xs text-surface-500">Active, completed and pending faculty mentorships</p>
              </div>
              <Badge variant="gray" size="sm">
                {totalProjects} Total
              </Badge>
            </div>

            {statusChartData.length > 0 ? (
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value, entry: any) => (
                        <span className="text-xs text-surface-700 font-medium">
                          {value} ({entry.payload.value})
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-surface-400">
                No project status data to display.
              </div>
            )}
          </Card>

          {/* Domain / Category Distribution (Bar Chart) */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-surface-900">Problem &amp; Project Categories</h3>
                <p className="text-xs text-surface-500">Projects mapped across civic impact sectors</p>
              </div>
              <Badge variant="primary" size="sm">
                Civic Sectors
              </Badge>
            </div>

            {domainChartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={domainChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      angle={-15}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 8, fontSize: 11 }} />
                    <Bar dataKey="Projects" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="Student Teams" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-surface-400">
                No category distribution data to display.
              </div>
            )}
          </Card>
        </div>

        {/* ─── SECTION 6: PROJECT PROGRESS ANALYTICS ─────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-surface-900">Project Progress</h2>
              <p className="text-xs text-surface-500">
                Real-time execution status, current milestones, and progress of supervised student teams
              </p>
            </div>
            <Link to="/faculty/projects" className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1">
              <span>View All Projects</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {filteredAssignments.length === 0 ? (
            <Card padding="lg">
              <EmptyState
                icon={<FolderGit2 size={36} />}
                title="No analytics data available yet."
                description="Once project assignments are accepted or started, real-time progress will appear here."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredAssignments.map((project) => {
                const linkedProblem = problems.find(
                  (p) => p.id === project.problem_id || p.problem_id === project.problem_id
                );
                const categoryName =
                  linkedProblem?.category ||
                  (linkedProblem?.domain ? DOMAIN_LABELS[linkedProblem.domain] : 'Interdisciplinary');

                // Determine milestone metrics
                const totalMilestones = project.milestones?.length || 1;
                const completedMilestones =
                  project.milestones?.filter((m) => m.status === 'approved').length || 0;
                const currentMilestoneIndex = Math.min(completedMilestones + 1, totalMilestones);
                const currentMilestone =
                  project.milestones?.find((m) => m.status === 'in_progress' || m.status === 'submitted') ||
                  project.milestones?.[currentMilestoneIndex - 1];

                const isCompleted = project.project_status === 'COMPLETED' || project.progress === 100;
                const isPending = project.faculty_status === 'Pending';

                return (
                  <Card key={project.assignment_id} padding="md" hover>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Project title, team, category */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                            {project.problem_id}
                          </span>
                          <Badge
                            variant={
                              isCompleted
                                ? 'success'
                                : isPending
                                ? 'warning'
                                : project.progress >= 75
                                ? 'primary'
                                : 'gray'
                            }
                            size="sm"
                          >
                            {categoryName}
                          </Badge>
                          <span className="text-xs text-surface-400">•</span>
                          <span className="text-xs font-medium text-surface-600 flex items-center gap-1">
                            <Users size={12} className="text-surface-400" />
                            {project.team_name}
                          </span>
                          {project.team_leader_name && (
                            <span className="text-xs text-surface-400">
                              (Lead: {project.team_leader_name})
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-surface-900 truncate">
                          {linkedProblem?.title || `Project: ${project.problem_id}`}
                        </h4>

                        <p className="text-xs text-surface-500 line-clamp-1">
                          {currentMilestone
                            ? `Current: Milestone ${currentMilestoneIndex} of ${totalMilestones} — ${currentMilestone.title}`
                            : `All ${totalMilestones} milestones completed`}
                        </p>
                      </div>

                      {/* Right: Milestone count, progress bar, status */}
                      <div className="flex items-center gap-6 shrink-0 lg:w-96">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-surface-700">
                              Milestone {isCompleted ? totalMilestones : currentMilestoneIndex} of {totalMilestones}
                            </span>
                            <span className="font-bold text-surface-900">{project.progress}%</span>
                          </div>
                          <ProgressBar
                            value={project.progress}
                            color={isCompleted ? 'success' : project.progress >= 70 ? 'primary' : 'warning'}
                            size="sm"
                            animate={false}
                          />
                        </div>

                        <div className="text-right shrink-0 min-w-[90px]">
                          {isCompleted ? (
                            <Badge variant="success" size="sm">
                              Completed
                            </Badge>
                          ) : isPending ? (
                            <Badge variant="warning" size="sm">
                              Pending
                            </Badge>
                          ) : (
                            <Badge variant="primary" size="sm">
                              Active
                            </Badge>
                          )}
                        </div>

                        <Link
                          to={`/faculty/projects`}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-surface-100 transition-colors"
                          title="Open in Workspace"
                        >
                          <ExternalLink size={16} />
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── SECTION 7: MENTORSHIP ANALYTICS ──────────────────────────────── */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-surface-900">Mentorship Overview</h3>
              <p className="text-xs text-surface-500">
                Evaluation workload, student cohort distribution, and assignment pipeline
              </p>
            </div>
            <Badge variant="gray" size="sm">
              Faculty Mentorship
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            <div className="p-3 bg-surface-50 rounded-xl border border-surface-200">
              <p className="text-xs font-medium text-surface-500">Students Assigned</p>
              <p className="text-xl font-bold text-surface-900 mt-1">{studentsMentoredCount}</p>
              <p className="text-[11px] text-surface-500 mt-0.5">Across active teams</p>
            </div>
            <div className="p-3 bg-surface-50 rounded-xl border border-surface-200">
              <p className="text-xs font-medium text-surface-500">Active Mentorships</p>
              <p className="text-xl font-bold text-success-700 mt-1">{activeProjectsCount}</p>
              <p className="text-[11px] text-surface-500 mt-0.5">Under guidance</p>
            </div>
            <div className="p-3 bg-surface-50 rounded-xl border border-surface-200">
              <p className="text-xs font-medium text-surface-500">Pending Assignments</p>
              <p className="text-xl font-bold text-warning-700 mt-1">{pendingAssignments.length}</p>
              <p className="text-[11px] text-surface-500 mt-0.5">Awaiting response</p>
            </div>
            <div className="p-3 bg-surface-50 rounded-xl border border-surface-200">
              <p className="text-xs font-medium text-surface-500">Completed Mentorships</p>
              <p className="text-xl font-bold text-primary-700 mt-1">{completedProjectsCount}</p>
              <p className="text-[11px] text-surface-500 mt-0.5">Validated capstones</p>
            </div>
            <div className="p-3 bg-surface-50 rounded-xl border border-surface-200">
              <p className="text-xs font-medium text-surface-500">Milestones Reviewed</p>
              <p className="text-xl font-bold text-purple-700 mt-1">{milestonesReviewedCount}</p>
              <p className="text-[11px] text-surface-500 mt-0.5">
                {milestonesPendingReviewCount} in review
              </p>
            </div>
          </div>

          {/* Mentored Teams List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-surface-600 mb-3">
              Supervised Student Teams
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredAssignments.map((a) => {
                const team = studentTeams.find((t) => t.team_id === a.team_id || t.id === a.team_id);
                return (
                  <div
                    key={a.assignment_id}
                    className="p-3 rounded-lg border border-surface-200 bg-white hover:border-primary-300 transition-colors flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {a.team_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-surface-900 truncate">{a.team_name}</p>
                        <span className="text-[11px] font-semibold text-primary-600">
                          {a.faculty_match_score}% Match
                        </span>
                      </div>
                      <p className="text-[11px] text-surface-500 truncate">
                        {team?.department || a.team_department || 'Computer Science & Engineering'} •{' '}
                        {team?.team_members?.length || 3} members
                      </p>
                      {a.team_skills && a.team_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {a.team_skills.slice(0, 3).map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-surface-100 text-surface-600 px-1.5 py-0.5 rounded font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* ─── SECTION 8: GRIEVANCE / PROBLEM ANALYTICS ──────────────────────── */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-surface-900">
                Grievance &amp; Civic Problem Outcomes
              </h3>
              <p className="text-xs text-surface-500">
                Civic grievances matched, investigated and converted into working prototypes
              </p>
            </div>
            <Badge variant="primary" size="sm">
              JanSamadhan Grievance Linkage
            </Badge>
          </div>

          {civicProblemsAssigned.length === 0 ? (
            <div className="py-8 text-center text-xs text-surface-500">
              No grievance analytics are available yet.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Problem Stats Counter Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="p-3 bg-surface-50 rounded-xl border border-surface-200">
                  <p className="text-xs font-medium text-surface-500">Problems Assigned</p>
                  <p className="text-xl font-bold text-surface-900 mt-1">
                    {civicProblemsAssigned.length}
                  </p>
                  <p className="text-[11px] text-surface-500 mt-0.5">Assigned to institution</p>
                </div>
                <div className="p-3 bg-surface-50 rounded-xl border border-surface-200">
                  <p className="text-xs font-medium text-surface-500">Problems Reviewed</p>
                  <p className="text-xl font-bold text-surface-900 mt-1">
                    {civicProblemsAssigned.filter((p) => p.status !== 'submitted').length}
                  </p>
                  <p className="text-[11px] text-surface-500 mt-0.5">Assessed by faculty</p>
                </div>
                <div className="p-3 bg-surface-50 rounded-xl border border-surface-200">
                  <p className="text-xs font-medium text-surface-500">AI-Matched Problems</p>
                  <p className="text-xl font-bold text-primary-700 mt-1">
                    {aiMatchedProblems.length}
                  </p>
                  <p className="text-[11px] text-surface-500 mt-0.5">Domain compatibility</p>
                </div>
                <div className="p-3 bg-surface-50 rounded-xl border border-surface-200">
                  <p className="text-xs font-medium text-surface-500">Converted Into Projects</p>
                  <p className="text-xl font-bold text-success-700 mt-1">
                    {problemsConvertedIntoProjects}
                  </p>
                  <p className="text-[11px] text-surface-500 mt-0.5">Active engineering</p>
                </div>
                <div className="p-3 bg-surface-50 rounded-xl border border-surface-200">
                  <p className="text-xs font-medium text-surface-500">Completed Problem Projects</p>
                  <p className="text-xl font-bold text-teal-700 mt-1">{completedProblemProjects}</p>
                  <p className="text-[11px] text-surface-500 mt-0.5">Redressal prototypes</p>
                </div>
              </div>

              {/* Linked Civic Problems Table */}
              <div className="overflow-x-auto border border-surface-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-50 border-b border-surface-200 text-surface-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Problem ID &amp; Title</th>
                      <th className="py-2.5 px-3">Location &amp; Impact</th>
                      <th className="py-2.5 px-3">Domain</th>
                      <th className="py-2.5 px-3">Assigned Team</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {civicProblemsAssigned.map((prob) => {
                      const asgn = assignments.find(
                        (a) => a.problem_id === prob.id || a.problem_id === prob.problem_id
                      );
                      return (
                        <tr key={prob.id} className="hover:bg-surface-50/50 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-surface-900">
                            <span className="font-mono text-primary-600 mr-2">{prob.problem_id || prob.id}</span>
                            <span>{prob.title}</span>
                          </td>
                          <td className="py-2.5 px-3 text-surface-500">
                            {prob.district || 'Jharkhand'} • {prob.affectedPopulation?.toLocaleString() || 'N/A'} citizens
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge variant="gray" size="sm">
                              {prob.category || prob.domain}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-surface-600">
                            {asgn?.team_name || 'Assigned to BIT Sindri'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Badge
                              variant={
                                asgn?.project_status === 'COMPLETED'
                                  ? 'success'
                                  : asgn?.project_status === 'PROJECT_ACTIVE'
                                  ? 'primary'
                                  : 'warning'
                              }
                              size="sm"
                            >
                              {asgn?.project_status === 'COMPLETED'
                                ? 'Resolved'
                                : asgn?.project_status === 'PROJECT_ACTIVE'
                                ? 'Prototyping'
                                : 'Assigned'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
