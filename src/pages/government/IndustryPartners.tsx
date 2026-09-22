import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, DollarSign, Handshake, ShieldCheck, PlayCircle, Award, 
  CheckCircle2, AlertCircle, Clock, MapPin, Layers, ChevronRight, FileText
} from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { containerVariants, cardVariants } from '../../config/motion';
import { formatCurrency } from '../../lib/utils';
import { db } from '../../services/db';
import type { IndustryPartner, PilotDeploymentRequest, FinalGovernmentSubmission } from '../../types';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';
import { useApp } from '../../context/AppContext';

export default function GovernmentIndustryPartners() {
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'partners' | 'pilots' | 'scaling'>('pilots');
  const [partners, setPartners] = useState<IndustryPartner[]>([]);
  const [selectedTraceProblemId, setSelectedTraceProblemId] = useState<string | null>(null);

  // Pilot deployment for P-1030
  const [pilot, setPilot] = useState<PilotDeploymentRequest | null>(null);
  const [finalSub, setFinalSub] = useState<FinalGovernmentSubmission | null>(null);

  const loadData = () => {
    setPartners(db.getIndustryPartners());
    setPilot(db.getPilotDeployment('P-1030'));
    setFinalSub(db.getFinalGovernmentSubmission('P-1030'));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprovePilot = (problemId: string) => {
    db.updatePilotDeployment(problemId, {
      status: 'approved',
      resultsSummary: 'Authorized by Directorate of Agriculture for 45-day operational trial across 3 panchayats with BAO liaison.',
    });
    addToast({
      type: 'success',
      title: 'Pilot Deployment Authorized!',
      message: `Official clearance permit issued for Problem ${problemId}. Industry and University teams notified.`,
    });
    loadData();
  };

  const handleValidateFinalScale = (problemId: string) => {
    db.evaluateFinalProject(
      problemId,
      'validated_for_scale',
      'Solution verified through empirical field telemetry and 30-day pilot validation. State-wide scaling approved across 12 high-priority agricultural blocks.',
      ['Ranchi', 'Ramgarh', 'Hazaribagh']
    );
    addToast({
      type: 'success',
      title: 'Civic Grievance Resolved & Scale Sanctioned!',
      message: `Citizen grievance ${problemId} is now officially RESOLVED. Sponsoring Department allocated scaling budget.`,
    });
    loadData();
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Industry Co-Innovation & Pilot Scaling Authority"
            subtitle="Government oversight for Corporate CSR testbeds, Pilot Trial Authorizations, and State-wide Scaling Validation"
          />

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 bg-surface-100 p-1 rounded-xl border border-surface-200">
            <button
              onClick={() => setActiveTab('pilots')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'pilots'
                  ? 'bg-white text-primary-700 shadow-card-sm border border-surface-200/60 font-bold'
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              <PlayCircle size={14} /> Field Pilot Clearances
            </button>
            <button
              onClick={() => setActiveTab('scaling')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'scaling'
                  ? 'bg-white text-primary-700 shadow-card-sm border border-surface-200/60 font-bold'
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              <Award size={14} /> Final Scale Validation
            </button>
            <button
              onClick={() => setActiveTab('partners')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'partners'
                  ? 'bg-white text-primary-700 shadow-card-sm border border-surface-200/60 font-bold'
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              <Building2 size={14} /> Registered Partners ({partners.length})
            </button>
          </div>
        </div>

        {/* Informational Governance Notice */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>State Co-Innovation Protocol:</strong> Government officers validate joint University-Industry prototype trials before public infrastructure deployment. Once pilot empirical metrics are confirmed, the grievance is officially marked as <strong>Resolved</strong> and elevated for municipal or district procurement.
          </div>
        </div>

        {/* Tab 1: Field Pilot Clearances */}
        {activeTab === 'pilots' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-primary-600" />
              Incoming Field Pilot Deployment Applications
            </h3>

            {pilot ? (
              <Card padding="lg" className="border border-surface-200 bg-white shadow-card-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-surface-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <button
                        onClick={() => setSelectedTraceProblemId(pilot.problemId)}
                        className="font-mono text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 px-2.5 py-0.5 rounded border border-primary-200 inline-flex items-center gap-1"
                      >
                        <Layers size={11} /> {pilot.problemId}
                      </button>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        pilot.status === 'approved' || pilot.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {pilot.status.toUpperCase().replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-surface-500">
                        Requested: {new Date(pilot.requestedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-surface-900">
                      Edge AI Pest Detection Solar Mesh — Multi-Village Trial
                    </h4>
                    <p className="text-xs text-surface-500 mt-0.5">
                      Submitted by: <strong className="text-surface-800">{pilot.responsibleTeams || 'BIT Sindri & AgriTech Jharkhand Solutions'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {pilot.status !== 'approved' && pilot.status !== 'active' && pilot.status !== 'completed' ? (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<CheckCircle2 size={14} />}
                        onClick={() => handleApprovePilot(pilot.problemId)}
                      >
                        Authorize & Grant Clearance
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Clearance Granted ✓
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTraceProblemId(pilot.problemId)}
                        >
                          Trace Ecosystem
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-surface-50 p-3.5 rounded-xl border border-surface-200">
                  <div>
                    <span className="text-surface-500 block">Target Location</span>
                    <span className="font-bold text-surface-800 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} className="text-primary-600" /> {pilot.location}
                    </span>
                  </div>
                  <div>
                    <span className="text-surface-500 block">Civic Target Beneficiaries</span>
                    <span className="font-bold text-surface-800 mt-0.5 block">{pilot.targetBeneficiaries}</span>
                  </div>
                  <div>
                    <span className="text-surface-500 block">Hardware & Telemetry Deployment</span>
                    <span className="font-bold text-surface-800 mt-0.5 block">{pilot.hardwareRequirements}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-blue-900 leading-relaxed">
                    <strong>Target Testing Metrics & KPIs: </strong> {pilot.testingMetrics}
                  </div>
                  {pilot.resultsSummary && (
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 leading-relaxed">
                      <strong>Field Operations Progress & Telemetry: </strong> {pilot.resultsSummary}
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card padding="lg" className="text-center py-10 text-surface-500 text-xs">
                No pending pilot deployment requests in jurisdiction.
              </Card>
            )}
          </div>
        )}

        {/* Tab 2: Final Scale Validation */}
        {activeTab === 'scaling' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              Completed Civic Solutions Awaiting State Scaling Validation
            </h3>

            {finalSub ? (
              <Card padding="lg" className="border border-surface-200 bg-white shadow-card-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-surface-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <button
                        onClick={() => setSelectedTraceProblemId(finalSub.problemId)}
                        className="font-mono text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 px-2.5 py-0.5 rounded border border-primary-200 inline-flex items-center gap-1"
                      >
                        <Layers size={11} /> {finalSub.problemId}
                      </button>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        finalSub.status === 'validated_for_scale' || (finalSub.status as any) === 'resolved' || (finalSub.status as any) === 'scaling_approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {finalSub.status.toUpperCase().replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-surface-500">
                        Submitted: {new Date(finalSub.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-surface-900">
                      AgriDetect v0.9 IoT Solar Camera Traps — Completed Innovation Package
                    </h4>
                    <p className="text-xs text-surface-500 mt-0.5">
                      Co-Submitted by: <strong className="text-surface-800">{finalSub.partnerName || 'AgriTech Jharkhand Solutions'}</strong> & <strong className="text-surface-800">{finalSub.universityName || 'BIT Sindri'} ({finalSub.facultyName || 'Dr. Anita Sharma'})</strong>
                    </p>
                  </div>

                  <div>
                    {finalSub.status !== 'validated_for_scale' && (finalSub.status as any) !== 'resolved' && (finalSub.status as any) !== 'scaling_approved' ? (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Award size={14} />}
                        onClick={() => handleValidateFinalScale(finalSub.problemId)}
                      >
                        Validate & Sanction State Scaling
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Officially Resolved & Scaling Sanctioned ✓
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTraceProblemId(finalSub.problemId)}
                        >
                          View Outcome Trace
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-surface-50 p-3.5 rounded-xl border border-surface-200">
                  <div>
                    <span className="text-surface-500 block">Cost Per Beneficiary</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm mt-0.5 block">
                      ₹{finalSub.costPerBeneficiary || 185} / Farmer
                    </span>
                  </div>
                  <div>
                    <span className="text-surface-500 block">Scaling Readiness Assessment</span>
                    <span className="font-bold text-surface-800 mt-0.5 block">
                      {(finalSub.scalingFeasibility || 'Ready to Scale').replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-surface-500 block">Recommended Rollout Timeline</span>
                    <span className="font-bold text-surface-800 mt-0.5 block">
                      {finalSub.recommendedRolloutTimeline || '90-Day District Scale'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-surface-50 rounded-lg border border-surface-200 text-surface-700 leading-relaxed">
                    <strong className="text-surface-900 block mb-1">Executive Summary:</strong>
                    {finalSub.executiveSummary || finalSub.impactSummary || 'Comprehensive empirical pilot testing completed across participating blocks.'}
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 leading-relaxed font-mono text-2xs whitespace-pre-line">
                    <strong className="font-sans text-xs block mb-1">Empirical Verified Field Outcomes:</strong>
                    {finalSub.verifiedOutcomes || finalSub.pilotResults || '94.2% pest identification accuracy on Spodoptera frugiperda and zero edge failures.'}
                  </div>
                </div>
              </Card>
            ) : (
              <Card padding="lg" className="text-center py-10 text-surface-500 text-xs">
                No completed final solution packages submitted for scaling review yet.
              </Card>
            )}
          </div>
        )}

        {/* Tab 3: Registered Partners */}
        {activeTab === 'partners' && (
          <motion.div variants={containerVariants()} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {partners.map(p => (
              <motion.div key={p.id} variants={cardVariants} whileHover={{ scale: 1.01 }}>
                <Card padding="md" className="border border-surface-200 bg-white shadow-card-sm hover:shadow-card transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary-50 text-primary-700 rounded-xl flex items-center justify-center shrink-0 border border-primary-100">
                      <Handshake size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-surface-900">{p.name}</h3>
                      <p className="text-xs text-surface-500">{p.sector} · {p.city}</p>
                    </div>
                    <Badge variant="gray" size="sm">{p.type.toUpperCase()}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-surface-600 bg-surface-50 p-2.5 rounded-lg border border-surface-100">
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <DollarSign size={13} /> {formatCurrency(p.totalFunding)} committed
                    </span>
                    <span>· {p.activeCollaborations} active innovations</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {p.collaborationTypes.map(t => (
                      <Badge key={t} variant="gray" size="sm">{t}</Badge>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Problem Ecosystem Trace Modal */}
        <ProblemEcosystemModal
          problemId={selectedTraceProblemId}
          isOpen={!!selectedTraceProblemId}
          onClose={() => setSelectedTraceProblemId(null)}
        />

      </div>
    </PageTransition>
  );
}
