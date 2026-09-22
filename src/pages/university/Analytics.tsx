import React, { useState, useEffect } from 'react';
import { PageTransition } from '../../components/ui/PageTransition';
import { SectionHeader, Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  TrendingUp,
  Layers,
  GraduationCap,
  Users,
  Building2,
  CheckCircle2,
  FileText,
  Cpu,
  MapPin,
} from 'lucide-react';
import { db } from '../../services/db';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';

export default function UniversityAnalytics() {
  const [selectedTraceProblemId, setSelectedTraceProblemId] = useState<string | null>(null);

  const assignments = db.getProjectAssignments();
  const research = db.getResearchEntries();
  const prototypes = db.getPrototypes();
  const faculty = db.getFaculty();
  const teams = db.getStudentTeams();

  const totalBeneficiaries = assignments.reduce((acc, a) => {
    const p = db.getProblemById(a.problem_id);
    return acc + (p?.affectedPopulation || p?.affected_people || 0);
  }, 0);

  const avgProgress = assignments.length > 0
    ? Math.round(assignments.reduce((acc, a) => acc + (a.progress || 0), 0) / assignments.length)
    : 0;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Institutional Civic Impact & R&D Analytics"
            subtitle="BIT Sindri academic impact, citizen beneficiary outcomes, and technological readiness across Jharkhand"
          />
        </div>

        {/* Real KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="md" className="border-l-4 border-l-primary-500 border border-surface-200 bg-white shadow-card-sm">
            <span className="text-xs text-surface-500 font-medium uppercase tracking-wider">Allocated Missions</span>
            <div className="text-3xl font-black text-surface-900 mt-1">{assignments.length}</div>
            <span className="text-[11px] text-primary-700 mt-1 block font-medium">Government-assigned grievances</span>
          </Card>

          <Card padding="md" className="border-l-4 border-l-emerald-500 border border-surface-200 bg-white shadow-card-sm">
            <span className="text-xs text-surface-500 font-medium uppercase tracking-wider">Citizen Beneficiaries</span>
            <div className="text-3xl font-black text-emerald-700 mt-1">{totalBeneficiaries.toLocaleString()}+</div>
            <span className="text-[11px] text-surface-500 mt-1 block">Direct rural and urban population impacted</span>
          </Card>

          <Card padding="md" className="border-l-4 border-l-purple-500 border border-surface-200 bg-white shadow-card-sm">
            <span className="text-xs text-surface-500 font-medium uppercase tracking-wider">Research Publications</span>
            <div className="text-3xl font-black text-purple-700 mt-1">{research.length}</div>
            <span className="text-[11px] text-surface-500 mt-1 block">Empirical field papers & datasets</span>
          </Card>

          <Card padding="md" className="border-l-4 border-l-cyan-500 border border-surface-200 bg-white shadow-card-sm">
            <span className="text-xs text-surface-500 font-medium uppercase tracking-wider">Average Milestone Progress</span>
            <div className="text-3xl font-black text-primary-700 mt-1">{avgProgress}%</div>
            <span className="text-[11px] text-surface-500 mt-1 block">Across all active engineering departments</span>
          </Card>
        </div>

        {/* Breakdown Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Active Missions Progress Breakdown */}
          <Card padding="lg" className="border border-surface-200 bg-white shadow-card-sm">
            <h3 className="text-base font-bold text-surface-900 mb-3 flex items-center gap-2">
              <Layers size={18} className="text-primary-600" />
              Civic Mission Completion Status
            </h3>
            <div className="space-y-3">
              {assignments.map(asgn => {
                const prob = db.getProblemById(asgn.problem_id);
                return (
                  <div key={asgn.assignment_id} className="p-3 rounded-xl bg-surface-50 border border-surface-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedTraceProblemId(asgn.problem_id)}
                          className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors"
                        >
                          {asgn.problem_id}
                        </button>
                        <span className="text-xs font-semibold text-surface-900 line-clamp-1">{prob?.title || asgn.problem_id}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700">{asgn.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${asgn.progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-surface-500">
                      <span>Lead: <strong className="text-surface-700">{asgn.faculty_name}</strong></span>
                      <span>Squad: <strong className="text-surface-700">{asgn.team_name}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Technology Readiness Level (TRL) Hardware Prototypes */}
          <Card padding="lg" className="border border-surface-200 bg-white shadow-card-sm">
            <h3 className="text-base font-bold text-surface-900 mb-3 flex items-center gap-2">
              <Cpu size={18} className="text-primary-600" />
              Hardware Telemetry & Prototype Readiness
            </h3>
            <div className="space-y-3">
              {prototypes.map(proto => (
                <div key={proto.id} className="p-3 rounded-xl bg-surface-50 border border-surface-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {proto.problem_id && (
                        <button
                          onClick={() => setSelectedTraceProblemId(proto.problem_id!)}
                          className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors"
                        >
                          {proto.problem_id}
                        </button>
                      )}
                      <span className="text-xs font-semibold text-surface-900 line-clamp-1">{proto.title}</span>
                    </div>
                    <Badge variant={proto.status === 'field_pilot' ? 'success' : 'primary'}>
                      {proto.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-surface-500 font-mono">{proto.version}</span>
                    <span className="font-mono font-bold text-primary-700">TRL Score: {proto.readinessScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
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
