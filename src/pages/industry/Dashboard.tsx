import React, { useState, useEffect } from 'react';
import { PageTransition } from '../../components/ui/PageTransition';
import { SectionHeader, Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Briefcase,
  Layers,
  Building2,
  DollarSign,
  TrendingUp,
  Cpu,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Users,
} from 'lucide-react';
import { db } from '../../services/db';
import type { CollaborationRequest } from '../../types';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';
import { Link } from 'react-router-dom';

export default function IndustryDashboard() {
  const [collabs, setCollabs] = useState<CollaborationRequest[]>([]);
  const [selectedTraceProblemId, setSelectedTraceProblemId] = useState<string | null>(null);

  useEffect(() => {
    const list = db.getIndustryCollaborations();
    setCollabs(list);
  }, []);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Industry Co-Innovation Hub"
            subtitle="Corporate R&D partnerships, CSR civic technology co-sponsorship, and utility pilots"
          />
          <Link to="/industry/discovery">
            <Button variant="primary" icon={<Layers size={16} />}>
              Discover Problem Missions
            </Button>
          </Link>
        </div>

        {/* Real KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card padding="md" className="border-l-4 border-l-orange-500 border border-surface-200 bg-white shadow-card-sm">
            <span className="text-xs text-surface-500 font-medium uppercase tracking-wider">Active Co-Innovation Pilots</span>
            <div className="text-3xl font-black text-surface-900 mt-1">{collabs.length}</div>
            <span className="text-[11px] text-orange-600 mt-1 block font-medium">University tech transfer initiatives</span>
          </Card>

          <Card padding="md" className="border-l-4 border-l-emerald-500 border border-surface-200 bg-white shadow-card-sm">
            <span className="text-xs text-surface-500 font-medium uppercase tracking-wider">Committed Pilot Grants</span>
            <div className="text-3xl font-black text-emerald-700 mt-1">₹11.8 Lakhs</div>
            <span className="text-[11px] text-surface-500 mt-1 block">R&D and pilot manufacturing co-capital</span>
          </Card>

          <Card padding="md" className="border-l-4 border-l-primary-500 border border-surface-200 bg-white shadow-card-sm">
            <span className="text-xs text-surface-500 font-medium uppercase tracking-wider">Target Beneficiaries</span>
            <div className="text-3xl font-black text-primary-700 mt-1">16,500+</div>
            <span className="text-[11px] text-surface-500 mt-1 block">Citizens impacted across active pilot regions</span>
          </Card>
        </div>

        {/* Active Co-Pilots Grid */}
        <div>
          <h3 className="text-base font-bold text-surface-900 mb-3 flex items-center gap-2">
            <Briefcase size={18} className="text-orange-600" />
            Active University & Civic Problem Engagements
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {collabs.map(collab => {
              const prob = collab.problem_id ? db.getProblemById(collab.problem_id) : null;
              const proto = collab.problem_id ? db.getPrototypeByProblemId(collab.problem_id) : null;

              return (
                <Card key={collab.id} padding="lg" className="border border-surface-200 bg-white shadow-card-sm hover:shadow-card transition-all">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {collab.problem_id && (
                          <button
                            onClick={() => setSelectedTraceProblemId(collab.problem_id!)}
                            className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors"
                            title="Inspect complete Problem Lifecycle Ecosystem"
                          >
                            <Layers size={11} /> {collab.problem_id}
                          </button>
                        )}
                        <Badge variant={collab.status === 'accepted' ? 'success' : 'warning'}>
                          {collab.status.toUpperCase()}
                        </Badge>
                        {proto && (
                          <span className="text-xs font-mono font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                            TRL {proto.readinessScore}%
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-surface-900">{collab.project}</h4>
                        <p className="text-xs text-surface-500 mt-0.5">
                          Partner Entity: <strong className="text-surface-800">{collab.industryPartner}</strong>
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 text-xs text-surface-700 space-y-1">
                        <span className="font-semibold text-surface-900">Joint Execution Blueprint:</span>
                        <p className="leading-relaxed">{collab.message}</p>
                      </div>

                      {collab.response && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                          <span className="font-semibold text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 size={13} className="text-emerald-600" /> Formal Industry Commitment:
                          </span>
                          <p className="leading-relaxed font-medium">{collab.response}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {collab.problem_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTraceProblemId(collab.problem_id!)}
                          className="text-xs flex items-center gap-1"
                        >
                          <Layers size={13} /> View Lifecycle Trace
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
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
