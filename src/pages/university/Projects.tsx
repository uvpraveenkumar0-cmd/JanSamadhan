import React, { useState, useEffect } from 'react';
import { PageTransition } from '../../components/ui/PageTransition';
import { SectionHeader, Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Layers,
  Building2,
  GraduationCap,
  Users,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowRight,
  MapPin,
  Calendar,
} from 'lucide-react';
import { db } from '../../services/db';
import type { ProjectAssignment, Problem } from '../../types';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';
import { formatDate } from '../../lib/utils';

export default function UniversityProjects() {
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTraceProblemId, setSelectedTraceProblemId] = useState<string | null>(null);

  useEffect(() => {
    // Load allocations designated to BIT Sindri (univ1)
    const list = db.getProjectAssignments();
    setAssignments(list);
  }, []);

  const filteredAssignments = assignments.filter(a => {
    const prob = db.getProblemById(a.problem_id);
    const searchTarget = `${a.problem_id} ${prob?.title || ''} ${a.faculty_name} ${a.team_name}`.toLowerCase();
    const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && a.project_status === 'PROJECT_ACTIVE') ||
      (statusFilter === 'completed' && a.project_status === 'COMPLETED') ||
      (statusFilter === 'pending' && a.faculty_status === 'Pending');

    return matchesSearch && matchesStatus;
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="University Problem Allocations & Active Missions"
            subtitle="Institutional oversight of citizen grievance solutions across academic departments"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search by problem ID, title, faculty mentor, or student team..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-surface-200 rounded-xl text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-surface-200 rounded-xl text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Project Statuses</option>
            <option value="active">Active Projects</option>
            <option value="completed">Completed Projects</option>
            <option value="pending">Pending Acceptance</option>
          </select>
        </div>

        {/* Assignments Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredAssignments.map(asgn => {
            const prob = db.getProblemById(asgn.problem_id);
            const isCompleted = asgn.project_status === 'COMPLETED';

            return (
              <Card key={asgn.assignment_id} padding="lg" className="border border-surface-200 bg-white shadow-card-sm hover:shadow-card transition-all">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSelectedTraceProblemId(asgn.problem_id)}
                        className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors"
                        title="Click to inspect complete Problem Lifecycle Ecosystem"
                      >
                        <Layers size={11} /> {asgn.problem_id}
                      </button>
                      <Badge variant={isCompleted ? 'success' : 'primary'}>
                        {asgn.project_status}
                      </Badge>
                      {prob && <Badge variant="gray">{prob.category}</Badge>}
                      <span className="text-xs text-surface-500">
                        Allocated: {formatDate(asgn.assigned_at)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-surface-900 tracking-tight">
                        {prob?.title || asgn.problem_id}
                      </h3>
                      {prob?.description && (
                        <p className="text-xs text-surface-600 mt-1 line-clamp-2 leading-relaxed">
                          {prob.description}
                        </p>
                      )}
                    </div>

                    {/* Faculty and Team Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-surface-50 border border-surface-200 text-xs">
                      <div>
                        <span className="text-surface-500 flex items-center gap-1 mb-0.5 font-medium">
                          <GraduationCap size={13} className="text-purple-600" /> Faculty Mentor:
                        </span>
                        <p className="font-semibold text-surface-900">{asgn.faculty_name}</p>
                        <span className="text-[11px] text-surface-500">{asgn.faculty_department}</span>
                      </div>
                      <div>
                        <span className="text-surface-500 flex items-center gap-1 mb-0.5 font-medium">
                          <Users size={13} className="text-emerald-600" /> Student Squad:
                        </span>
                        <p className="font-semibold text-surface-900">{asgn.team_name}</p>
                        <span className="text-[11px] text-surface-500">Lead: {asgn.team_leader_name}</span>
                      </div>
                    </div>

                    {/* Progress Bar & Milestones */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium text-surface-600">Milestone Execution Progress</span>
                        <span className="font-mono font-bold text-emerald-700">{asgn.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden border border-surface-200/60">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${asgn.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between gap-3 self-stretch sm:self-auto">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedTraceProblemId(asgn.problem_id)}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Layers size={13} /> View Ecosystem Trace
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Lifecycle Trace Modal */}
      <ProblemEcosystemModal
        problemId={selectedTraceProblemId}
        isOpen={!!selectedTraceProblemId}
        onClose={() => setSelectedTraceProblemId(null)}
      />
    </PageTransition>
  );
}
