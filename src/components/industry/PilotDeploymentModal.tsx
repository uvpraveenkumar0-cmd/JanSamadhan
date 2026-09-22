import React, { useState } from 'react';
import { X, Send, ShieldCheck, MapPin, Calendar, Users, Activity, FileText } from 'lucide-react';
import type { ProblemEcosystem } from '../../types';
import { db } from '../../services/db';

interface PilotDeploymentModalProps {
  ecosystem: ProblemEcosystem;
  partnerId: string;
  partnerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const PilotDeploymentModal: React.FC<PilotDeploymentModalProps> = ({
  ecosystem,
  partnerId,
  partnerName,
  onClose,
  onSuccess
}) => {
  const problem = ecosystem.problem;
  const project = ecosystem.project;

  const [targetLocation, setTargetLocation] = useState(problem?.location || 'Ormanjhi Block, Ranchi District, Jharkhand');
  const [durationDays, setDurationDays] = useState(30);
  const [sampleSizeOrCoverage, setSampleSizeOrCoverage] = useState('45 Farmers across 3 panchayats, 120 hectares of paddy & maize');
  const [requiredGovtSupport, setRequiredGovtSupport] = useState('Block Agriculture Officer (BAO) field liaison, local Krishi Vigyan Kendra (KVK) sensor pole clearance, Kisan Sabha awareness access');
  const [successMetrics, setSuccessMetrics] = useState('≥ 92% real-time pest detection accuracy, < 5 min alert dispatch to farmers via SMS, uninterrupted 24/7 edge solar battery operation');
  const [safetyProtocol, setSafetyProtocol] = useState('IP67 weather sealed enclosures, 12V low-voltage isolated power, non-hazardous optical sensors compliant with BIS standards');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      db.requestPilotDeployment({
        id: `pilot-${Date.now()}`,
        problemId: problem.id,
        projectId: project?.assignment_id || `PROJ-${problem.id}`,
        partnerId,
        partnerName,
        facultyName: project?.faculty_name || 'Dr. Anita Sharma',
        universityName: project?.university_name || 'BIT Sindri',
        targetLocation,
        durationDays,
        sampleSizeOrCoverage,
        requiredGovtSupport,
        successMetrics,
        safetyProtocol,
        requestedBy: 'industry',
        status: 'under_govt_review',
        requestedAt: new Date().toISOString()
      });
      alert('Pilot deployment request submitted successfully to Government Department!');
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Error submitting pilot deployment request');
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
            <div className="p-2.5 bg-primary-100 text-primary-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                  {problem.id}
                </span>
                <span className="text-xs text-surface-500 font-medium">Stage 5: Pilot Deployment Authorization</span>
              </div>
              <h2 className="text-base font-bold text-surface-900 mt-0.5">
                Request Field Pilot Deployment Approval
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
            <strong>Government Protocol:</strong> All civic prototype field deployments require formal municipal or district department approval. The request will be submitted directly to the jurisdictional department review queue.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary-600" /> Target Deployment Location *
              </label>
              <input
                type="text"
                required
                value={targetLocation}
                onChange={e => setTargetLocation(e.target.value)}
                className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary-600" /> Pilot Duration (Days) *
              </label>
              <input
                type="number"
                min={7}
                max={180}
                required
                value={durationDays}
                onChange={e => setDurationDays(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary-600" /> Sample Size & Civic Coverage Area *
            </label>
            <input
              type="text"
              required
              value={sampleSizeOrCoverage}
              onChange={e => setSampleSizeOrCoverage(e.target.value)}
              className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-primary-600" /> Target Success Metrics & KPIs *
            </label>
            <textarea
              rows={2}
              required
              value={successMetrics}
              onChange={e => setSuccessMetrics(e.target.value)}
              className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary-600" /> Required Government Department Support *
            </label>
            <textarea
              rows={2}
              required
              value={requiredGovtSupport}
              onChange={e => setRequiredGovtSupport(e.target.value)}
              className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              Safety, Environmental & Regulatory Protocols
            </label>
            <textarea
              rows={2}
              value={safetyProtocol}
              onChange={e => setSafetyProtocol(e.target.value)}
              className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="pt-3 border-t border-surface-200 flex items-center justify-between">
            <div className="text-xs text-surface-500">
              Joint submission by: <span className="font-semibold text-surface-700">{partnerName}</span> & <span className="font-semibold text-surface-700">{project?.university_name || 'BIT Sindri'}</span>
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
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold shadow transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Submitting...' : 'Submit to Government Department'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
