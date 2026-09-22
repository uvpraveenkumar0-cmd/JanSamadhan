import React, { useState, useEffect } from 'react';
import { PageTransition } from '../../components/ui/PageTransition';
import { SectionHeader, Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Briefcase,
  Layers,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  MapPin,
  Calendar,
} from 'lucide-react';
import { db } from '../../services/db';
import type { CollaborationRequest } from '../../types';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';

export default function StudentIndustryRequests() {
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [selectedTraceProblemId, setSelectedTraceProblemId] = useState<string | null>(null);

  useEffect(() => {
    // Load student team collaborations (P-1030 AgriTech, etc.)
    const list = db.getIndustryCollaborations();
    setRequests(list);
  }, []);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Industry Co-Pilot Engagements & Mentorship"
            subtitle="Corporate partners co-funding, providing sensor testbeds, and reviewing team hardware prototypes"
          />
        </div>

        <div className="grid grid-cols-1 gap-5">
          {requests.map(req => (
            <Card key={req.id} padding="lg" className="border border-surface-200 bg-white shadow-card-sm hover:shadow-card transition-all">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {req.problem_id && (
                      <button
                        onClick={() => setSelectedTraceProblemId(req.problem_id!)}
                        className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors"
                      >
                        <Layers size={11} /> {req.problem_id}
                      </button>
                    )}
                    <Badge variant={req.status === 'accepted' ? 'success' : 'warning'}>
                      {req.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-surface-500">
                      Partner Request ID: {req.id}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-surface-900 tracking-tight flex items-center gap-2">
                      <Building2 size={18} className="text-orange-600" />
                      {req.industryPartner}
                    </h3>
                    <p className="text-xs text-surface-500 mt-0.5">
                      Mission Target: <strong className="text-surface-800">{req.project}</strong>
                    </p>
                  </div>

                  {/* Partnership Message */}
                  <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 text-xs text-surface-700 space-y-1">
                    <span className="font-semibold text-surface-900">Joint Scope & Equipment Provision:</span>
                    <p className="leading-relaxed">{req.message}</p>
                  </div>

                  {/* Partner Commitment */}
                  {req.response && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <span className="font-semibold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 size={13} className="text-emerald-600" /> Partner Executive Ratification:
                      </span>
                      <p className="leading-relaxed font-medium">{req.response}</p>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {req.requestType.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-surface-100 text-surface-700 border border-surface-200 font-medium">
                        {t.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>

                {req.problem_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTraceProblemId(req.problem_id!)}
                    className="self-start text-xs flex items-center gap-1"
                  >
                    <Layers size={13} /> View Lifecycle Trace
                  </Button>
                )}
              </div>
            </Card>
          ))}
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
