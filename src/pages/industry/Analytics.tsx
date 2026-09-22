import React, { useState } from 'react';
import { PageTransition } from '../../components/ui/PageTransition';
import { SectionHeader, Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  TrendingUp,
  Layers,
  Building2,
  DollarSign,
  Users,
  Award,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { db } from '../../services/db';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';

export default function IndustryAnalytics() {
  const [selectedTraceProblemId, setSelectedTraceProblemId] = useState<string | null>(null);

  const collabs = db.getIndustryCollaborations();
  const prototypes = db.getPrototypes();

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Industry Co-Innovation & ESG Impact Metrics"
            subtitle="Corporate R&D outcomes, CSR civic technology returns, and university intellectual property translation"
          />
        </div>

        {/* Real KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="md" className="border-l-4 border-l-orange-500 border border-surface-200 bg-white shadow-card-sm">
            <span className="text-xs text-surface-500 font-medium uppercase tracking-wider">Active Partnerships</span>
            <div className="text-3xl font-black text-surface-900 mt-1">{collabs.length}</div>
            <span className="text-[11px] text-orange-600 mt-1 block font-medium">University innovation squads supported</span>
          </Card>

          <Card padding="md" className="border-l-4 border-l-emerald-500 border border-surface-200 bg-white shadow-card-sm">
            <span className="text-xs text-surface-500 font-medium uppercase tracking-wider">Committed Grants</span>
            <div className="text-3xl font-black text-emerald-700 mt-1">₹11.8L</div>
            <span className="text-[11px] text-surface-500 mt-1 block">Deployed directly to pilot hardware</span>
          </Card>

          <Card padding="md" className="border-l-4 border-l-cyan-500 border border-surface-200 bg-white shadow-card-sm">
            <span className="text-xs text-surface-500 font-medium uppercase tracking-wider">Hardware Prototypes</span>
            <div className="text-3xl font-black text-primary-700 mt-1">{prototypes.length}</div>
            <span className="text-[11px] text-surface-500 mt-1 block">In field pilot & utility testing</span>
          </Card>

          <Card padding="md" className="border-l-4 border-l-primary-500 border border-surface-200 bg-white shadow-card-sm">
            <span className="text-xs text-surface-500 font-medium uppercase tracking-wider">Civic Beneficiaries</span>
            <div className="text-3xl font-black text-primary-700 mt-1">16,500+</div>
            <span className="text-[11px] text-surface-500 mt-1 block">Farmers & citizens positively impacted</span>
          </Card>
        </div>

        {/* Co-Pilot ROI & Technology Transfer Table */}
        <Card padding="lg" className="border border-surface-200 bg-white shadow-card-sm">
          <h3 className="text-base font-bold text-surface-900 mb-3 flex items-center gap-2">
            <Building2 size={18} className="text-orange-600" />
            University Co-Pilot Portfolio & Technology Transfer
          </h3>

          <div className="space-y-3">
            {collabs.map(collab => {
              const proto = collab.problem_id ? db.getPrototypeByProblemId(collab.problem_id) : null;
              const prob = collab.problem_id ? db.getProblemById(collab.problem_id) : null;

              return (
                <div key={collab.id} className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {collab.problem_id && (
                        <button
                          onClick={() => setSelectedTraceProblemId(collab.problem_id!)}
                          className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors"
                        >
                          {collab.problem_id}
                        </button>
                      )}
                      <span className="font-bold text-surface-900 text-sm">{collab.project}</span>
                    </div>
                    <p className="text-surface-500">
                      Partner: <strong className="text-surface-800">{collab.industryPartner}</strong> • Region: <strong className="text-surface-800">{prob?.location || 'Jharkhand'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {proto && (
                      <div className="text-right">
                        <span className="text-[11px] text-surface-500 block">TRL Score</span>
                        <span className="font-mono font-bold text-primary-700">{proto.readinessScore}%</span>
                      </div>
                    )}
                    <Badge variant={collab.status === 'accepted' ? 'success' : 'warning'}>
                      {collab.status.toUpperCase()}
                    </Badge>
                    {collab.problem_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTraceProblemId(collab.problem_id!)}
                        className="text-xs flex items-center gap-1"
                      >
                        <Layers size={12} /> Trace
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
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
