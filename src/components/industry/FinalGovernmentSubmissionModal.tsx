import React, { useState } from 'react';
import { X, Send, Award, FileCheck, CheckCircle2, TrendingUp, DollarSign, Clock } from 'lucide-react';
import type { ProblemEcosystem } from '../../types';
import { db } from '../../services/db';

interface FinalGovernmentSubmissionModalProps {
  ecosystem: ProblemEcosystem;
  partnerId: string;
  partnerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const FinalGovernmentSubmissionModal: React.FC<FinalGovernmentSubmissionModalProps> = ({
  ecosystem,
  partnerId,
  partnerName,
  onClose,
  onSuccess
}) => {
  const problem = ecosystem.problem;
  const project = ecosystem.project;

  const [executiveSummary, setExecutiveSummary] = useState(
    'AgriDetect v0.9 edge AI vision hubs successfully completed a 30-day field deployment across 3 panchayats in Ormanjhi Block, identifying 87 early-stage Fall Armyworm infestations before crop threshold damage occurred.'
  );
  const [verifiedOutcomes, setVerifiedOutcomes] = useState(
    '1. 94.2% true-positive pest detection confirmed by Krishi Vigyan Kendra.\n2. Average notification dispatch time to registered farmers: 3.2 minutes.\n3. Estimated crop loss reduction: 38% across participating farming clusters.\n4. Zero hardware failures across continuous monsoon weather exposure.'
  );
  const [costPerBeneficiary, setCostPerBeneficiary] = useState(185);
  const [scalingFeasibility, setScalingFeasibility] = useState<
    'ready_to_scale' | 'needs_minor_refinement' | 'pilot_expansion_recommended'
  >('ready_to_scale');
  const [recommendedRolloutTimeline, setRecommendedRolloutTimeline] = useState(
    'State-wide district rollout across 12 high-vulnerability agricultural blocks within 90 days.'
  );
  const [pilotTelemetryReportUrl, setPilotTelemetryReportUrl] = useState(
    'https://jansamadhan.gov.in/telemetry/reports/pilot-P-1030-final.pdf'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      db.submitFinalProjectToGovernment({
        id: `final-${Date.now()}`,
        problemId: problem.id,
        projectId: project?.assignment_id || `PROJ-${problem.id}`,
        partnerId,
        partnerName,
        universityName: project?.university_name || 'BIT Sindri',
        facultyName: project?.faculty_name || 'Dr. Anita Sharma',
        executiveSummary,
        verifiedOutcomes,
        costPerBeneficiary,
        pilotTelemetryReportUrl,
        scalingFeasibility,
        recommendedRolloutTimeline,
        submittedAt: new Date().toISOString(),
        status: 'submitted'
      });
      alert('Final project package submitted to Government Department for Scaling & Resolution validation!');
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Error submitting final project package');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-surface-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-200 bg-surface-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                  {problem.id}
                </span>
                <span className="text-xs text-surface-500 font-medium">Stage 6: Final Solution Submission</span>
              </div>
              <h2 className="text-base font-bold text-surface-900 mt-0.5">
                Submit Completed Solution Package to Government
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-surface-400 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
            <strong>Civic Resolution Milestone:</strong> Submitting this completed dossier provides the jurisdictional government department with empirical pilot evidence to transition this citizen grievance into the official <strong>Resolved & Scaling</strong> stage.
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-primary-600" /> Executive Field Summary *
            </label>
            <textarea
              rows={3}
              required
              value={executiveSummary}
              onChange={e => setExecutiveSummary(e.target.value)}
              className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Empirical Verified Outcomes & Field Telemetry *
            </label>
            <textarea
              rows={4}
              required
              value={verifiedOutcomes}
              onChange={e => setVerifiedOutcomes(e.target.value)}
              className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-primary-600" /> Est. Cost Per Civic Beneficiary (₹) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={costPerBeneficiary}
                onChange={e => setCostPerBeneficiary(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-primary-600" /> State-wide Scaling Feasibility *
              </label>
              <select
                value={scalingFeasibility}
                onChange={e => setScalingFeasibility(e.target.value as any)}
                className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="ready_to_scale">Ready for Immediate Municipal / District Scaling</option>
                <option value="pilot_expansion_recommended">Expanded Multi-District Pilot Recommended</option>
                <option value="needs_minor_refinement">Needs Minor Operational Refinement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary-600" /> Recommended Rollout Timeline *
            </label>
            <input
              type="text"
              required
              value={recommendedRolloutTimeline}
              onChange={e => setRecommendedRolloutTimeline(e.target.value)}
              className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              Field Telemetry & Audit Documentation URL
            </label>
            <input
              type="text"
              value={pilotTelemetryReportUrl}
              onChange={e => setPilotTelemetryReportUrl(e.target.value)}
              className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-primary-700 font-mono"
            />
          </div>

          <div className="pt-3 border-t border-surface-200 flex items-center justify-between">
            <div className="text-xs text-surface-500">
              Jointly Certified by: <span className="font-semibold text-surface-700">{partnerName}</span> & <span className="font-semibold text-surface-700">{project?.faculty_name || 'Dr. Anita Sharma'}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-surface-600 hover:bg-surface-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Submitting...' : 'Submit to Government for Final Resolution'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
