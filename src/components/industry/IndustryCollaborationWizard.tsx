import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Layers,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Send,
  AlertCircle,
  FileText,
  DollarSign,
  Cpu,
  GraduationCap,
  Users,
  ShieldCheck,
  X,
  Info,
  Check,
  Sparkles,
  RefreshCw,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { db } from '../../services/db';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import type {
  Problem,
  ProjectAssignment,
  Prototype,
  ResearchEntry,
  IndustryPartner,
  CollaborationRequest,
} from '../../types';

interface IndustryCollaborationWizardProps {
  problemId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SUPPORT_OPTIONS = [
  'Funding',
  'Technical Mentorship',
  'Hardware / Equipment',
  'Software / Cloud',
  'Manufacturing',
  'Field Testing',
  'Deployment Support',
  'Scaling',
  'Domain Expertise',
  'Industry Infrastructure',
];

export const IndustryCollaborationWizard: React.FC<IndustryCollaborationWizardProps> = ({
  problemId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useApp();

  // Wizard Steps:
  // 1 = Industry Support Required (Auto-fill Project Details + 10 Support Needs + Explanations)
  // 2 = AI Industry Matching Engine (Explainable Recommendations)
  // 3 = Forward to University SPOC
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Entities loaded from existing records
  const [problem, setProblem] = useState<Problem | null>(null);
  const [assignment, setAssignment] = useState<ProjectAssignment | null>(null);
  const [prototype, setPrototype] = useState<Prototype | null>(null);
  const [researchList, setResearchList] = useState<ResearchEntry[]>([]);

  // Step 1: Support Requirements
  const [supportTypes, setSupportTypes] = useState<string[]>([
    'Funding',
    'Technical Mentorship',
    'Hardware / Equipment',
    'Field Testing',
    'Deployment Support',
  ]);
  const [whyNeeded, setWhyNeeded] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [requestedFunding, setRequestedFunding] = useState('1,50,000');
  const [expectedTimeline, setExpectedTimeline] = useState('4 to 6 months');

  // Step 2: AI Matching
  const [isMatching, setIsMatching] = useState(false);
  const [recommendations, setRecommendations] = useState<
    Array<{ partner: IndustryPartner; matchScore: number; matchReasons: string[]; fitLevel: 'High' | 'Medium' | 'Low' }>
  >([]);
  const [selectedPartner, setSelectedPartner] = useState<IndustryPartner | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (problemId && isOpen) {
      loadData();
    }
  }, [problemId, isOpen]);

  const loadData = () => {
    const p = db.getProblemById(problemId);
    setProblem(p);
    const asgn = db.getProjectAssignmentByProblemId(problemId);
    setAssignment(asgn);
    const proto = db.getPrototypeByProblemId(problemId);
    setPrototype(proto);
    const res = db.getResearchEntries(problemId);
    setResearchList(res);

    // Context-sensitive explanations
    if (problemId === 'P-1029') {
      setWhyNeeded(
        'The non-invasive Rogowski sensor and PT100 telemetry prototype has completed laboratory bench testing with 340ms auto-trip response. We now require utility-grade substation testbed access, high-voltage equipment verification, and technical guidance from grid engineers before field installation on the campus transformer.'
      );
      setExpectedOutcome(
        'Commission a live IoT transformer monitoring node with 24/7 telemetry pushed to the utility maintenance dashboard, preventing thermal overload damage and power blackouts.'
      );
      setRequestedFunding('1,50,000');
    } else if (problemId === 'P-1030') {
      setWhyNeeded(
        'The YOLOv8 nano edge camera trap has demonstrated 92.4% mAP accuracy under laboratory conditions. We require agronomy field testbed plots, sensor enclosure manufacturing, and co-funding to deploy 50 camera nodes across marginal vegetable farms.'
      );
      setExpectedOutcome(
        'Deploy 50 calibrated camera nodes across Ranchi vegetable clusters and deliver localized preventative alerts to over 3,800 marginal farmers.'
      );
      setRequestedFunding('3,50,000');
    } else {
      setWhyNeeded(
        `The prototype has reached ${proto?.readinessScore || 60}% maturity. We require industrial collaboration for pilot testing, hardware calibration, and field deployment infrastructure.`
      );
      setExpectedOutcome(
        'Deploy an operational field pilot, validate system performance under real-world conditions, and prepare for district-scale government handover.'
      );
    }

    setStep(1);
  };

  const toggleSupportType = (type: string) => {
    if (supportTypes.includes(type)) {
      setSupportTypes(supportTypes.filter(t => t !== type));
    } else {
      setSupportTypes([...supportTypes, type]);
    }
  };

  const handleRunAiMatching = () => {
    if (supportTypes.length === 0) {
      addToast({
        type: 'error',
        title: 'Support areas required',
        message: 'Please select at least one required support area.',
      });
      return;
    }
    if (!whyNeeded.trim()) {
      addToast({
        type: 'error',
        title: 'Explanation required',
        message: 'Please explain why industry support is required.',
      });
      return;
    }

    setIsMatching(true);
    setTimeout(() => {
      const recs = db.getIndustryRecommendations(problemId, supportTypes);
      setRecommendations(recs);
      if (recs.length > 0) {
        setSelectedPartner(recs[0].partner);
      } else {
        setSelectedPartner(null);
      }
      setIsMatching(false);
      setStep(2);
    }, 450);
  };

  const handleSelectPartner = (partner: IndustryPartner) => {
    setSelectedPartner(partner);
  };

  const handleProceedToSpocReview = () => {
    if (!selectedPartner) {
      addToast({
        type: 'error',
        title: 'Partner selection required',
        message: 'Please select one industry partner recommended by AI.',
      });
      return;
    }
    setStep(3);
  };

  const handleSendToUniversitySpoc = async () => {
    if (!selectedPartner) return;
    setSubmitting(true);
    try {
      const cleanFunding = parseInt(requestedFunding.replace(/[^0-9]/g, ''), 10) || 150000;

      db.submitFacultyIndustryRequest(problemId, {
        selectedPartnerId: selectedPartner.id,
        supportRequirements: supportTypes,
        whyNeeded,
        expectedOutcome,
        requestedFunding: cleanFunding,
        expectedTimeline,
        currentStage: prototype?.status || 'Prototype Testing',
      });

      addToast({
        type: 'success',
        title: 'Forwarded to University SPOC',
        message: `Request for ${selectedPartner.name} sent to University SPOC for official review. Status: PENDING UNIVERSITY SPOC.`,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Submission failed',
        message: err.message || 'Could not forward to University SPOC.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 15 }}
          className="relative w-full max-w-4xl my-8 bg-white border border-surface-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 bg-surface-50/90">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-50 border border-primary-200 text-primary-700">
                <Briefcase size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                    {problemId}
                  </span>
                  <span className="text-xs text-surface-500 font-medium">
                    Faculty Industry Collaboration Workflow
                  </span>
                </div>
                <h3 className="text-base font-bold text-surface-900 mt-0.5 line-clamp-1">
                  {problem?.title || 'Civic Technology Project'}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-surface-400 hover:text-surface-700 rounded-lg hover:bg-surface-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper Bar */}
          <div className="grid grid-cols-3 border-b border-surface-200 bg-white text-xs font-medium">
            <button
              onClick={() => setStep(1)}
              className={`py-3 px-4 flex items-center justify-center gap-2 border-r border-surface-100 transition-colors ${
                step === 1
                  ? 'text-primary-700 border-b-2 border-b-primary-600 bg-primary-50/20 font-bold'
                  : 'text-surface-500 hover:bg-surface-50'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 1 ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600'
              }`}>
                1
              </span>
              <span>1. Industry Support Required</span>
            </button>

            <button
              onClick={() => {
                if (step > 1) setStep(2);
              }}
              disabled={step < 2}
              className={`py-3 px-4 flex items-center justify-center gap-2 border-r border-surface-100 transition-colors ${
                step === 2
                  ? 'text-primary-700 border-b-2 border-b-primary-600 bg-primary-50/20 font-bold'
                  : step > 2
                  ? 'text-surface-700 hover:bg-surface-50'
                  : 'text-surface-400 cursor-not-allowed'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 2 ? 'bg-primary-600 text-white' : step > 2 ? 'bg-emerald-600 text-white' : 'bg-surface-100 text-surface-400'
              }`}>
                {step > 2 ? '✓' : '2'}
              </span>
              <span>2. AI Industry Matching</span>
            </button>

            <button
              onClick={() => {
                if (step === 3) setStep(3);
              }}
              disabled={step < 3}
              className={`py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
                step === 3
                  ? 'text-primary-700 border-b-2 border-b-primary-600 bg-primary-50/20 font-bold'
                  : 'text-surface-400 cursor-not-allowed'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 3 ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-400'
              }`}>
                3
              </span>
              <span>3. Forward to University SPOC</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* STEP 1: Industry Support Required */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-surface-900">
                    Project R&D State & Support Requirements
                  </h4>
                  <p className="text-xs text-surface-600 mt-0.5">
                    Existing project records are populated automatically. Specify what industry assistance this project requires for field deployment.
                  </p>
                </div>

                {/* Auto-filled Existing Project Dossier Info */}
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-surface-200 pb-2">
                    <span className="font-bold text-surface-800 flex items-center gap-1.5">
                      <FileText size={14} className="text-primary-600" /> Auto-Retrieved Project Dossier
                    </span>
                    <span className="text-[11px] text-surface-500">
                      Synchronized from JanSamadhan Database
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-surface-500 block">Problem ID & Title:</span>
                      <strong className="text-surface-800">{problemId} — {problem?.title}</strong>
                    </div>
                    <div>
                      <span className="text-surface-500 block">University & Faculty PI:</span>
                      <strong className="text-surface-800">{assignment?.university_name || 'BIT Sindri'} • {assignment?.faculty_name || 'Dr. Anita Sharma'}</strong>
                    </div>
                    <div>
                      <span className="text-surface-500 block">Student Engineering Squad:</span>
                      <span className="text-surface-700 font-medium">
                        {assignment?.team_name || 'Smart Infrastructure Team'} ({assignment?.team_skills?.join(', ') || 'IoT, Embedded Systems'})
                      </span>
                    </div>
                    <div>
                      <span className="text-surface-500 block">Government Requirement:</span>
                      <span className="text-surface-700 font-medium">
                        {problem?.verificationNotes || 'Field-validated municipal redressal solution with telemetry monitoring.'}
                      </span>
                    </div>
                    <div>
                      <span className="text-surface-500 block">Prototype Name & Version:</span>
                      <span className="text-surface-800 font-bold">
                        {prototype?.title || 'IoT Monitoring Controller'} ({prototype?.version || 'v1.4'})
                      </span>
                    </div>
                    <div>
                      <span className="text-surface-500 block">Current Stage & Prototype Progress:</span>
                      <span className="text-surface-800 font-bold">
                        {prototype?.status || 'Prototype Testing'} • {prototype?.readinessScore || 65}% Readiness
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-surface-200/80 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-surface-500 block">Completed Work:</span>
                      <p className="text-surface-700 leading-relaxed text-[11px]">
                        {assignment?.milestones?.filter(m => m.status === 'approved').map(m => m.title).join('; ') ||
                          'Bench sensor calibration, thermal modeling, and circuit simulation completed.'}
                      </p>
                    </div>
                    <div>
                      <span className="text-surface-500 block">Remaining Work:</span>
                      <p className="text-surface-700 leading-relaxed text-[11px]">
                        {assignment?.milestones?.filter(m => m.status !== 'approved').map(m => m.title).join('; ') ||
                          'Field sensor endurance validation, enclosure manufacturing, and edge telematics scale.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Support Checklist */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-surface-900">
                    What support does this project currently require? <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[11px] text-surface-500">
                    Select all industry assistance areas needed for transitioning from lab bench to real-world pilot deployment.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {SUPPORT_OPTIONS.map(opt => {
                      const checked = supportTypes.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleSupportType(opt)}
                          className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 text-left transition-all ${
                            checked
                              ? 'bg-primary-50/80 border-primary-400 text-primary-900 font-bold shadow-xs'
                              : 'bg-surface-50/60 border-surface-200 text-surface-700 hover:bg-surface-100/60'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                              checked
                                ? 'bg-primary-600 border-primary-600 text-white'
                                : 'bg-white border-surface-300'
                            }`}
                          >
                            {checked && <Check size={11} strokeWidth={3} />}
                          </div>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Explanations */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-surface-900 mb-1">
                      Why is this support required? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={whyNeeded}
                      onChange={e => setWhyNeeded(e.target.value)}
                      placeholder="Explain the technical gap or resource need that industry partnership will fulfill..."
                      className="w-full text-xs p-3 rounded-xl border border-surface-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-surface-900 mb-1">
                      Expected Outcome <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={expectedOutcome}
                      onChange={e => setExpectedOutcome(e.target.value)}
                      placeholder="Detail the measurable deliverable from this collaboration..."
                      className="w-full text-xs p-3 rounded-xl border border-surface-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-surface-900 mb-1">
                        Requested Co-Pilot Funding (INR)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-surface-400 font-bold">₹</span>
                        <input
                          type="text"
                          value={requestedFunding}
                          onChange={e => setRequestedFunding(e.target.value)}
                          className="w-full text-xs pl-7 pr-3 py-2 rounded-xl border border-surface-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-surface-900 mb-1">
                        Expected Duration
                      </label>
                      <input
                        type="text"
                        value={expectedTimeline}
                        onChange={e => setExpectedTimeline(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-surface-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center justify-end pt-4 border-t border-surface-200">
                  <Button
                    variant="primary"
                    onClick={handleRunAiMatching}
                    disabled={isMatching}
                    icon={isMatching ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  >
                    {isMatching ? 'Analyzing Project Context...' : 'Run AI Industry Matching'}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: AI Industry Matching Engine */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                      <Sparkles size={16} className="text-primary-600" />
                      AI INDUSTRY MATCHING
                    </h4>
                    <p className="text-xs text-surface-600 mt-0.5">
                      Based on your project's domain, tech stack, and required support, these verified industries appear relevant:
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRunAiMatching}
                    icon={<RefreshCw size={13} className={isMatching ? 'animate-spin' : ''} />}
                  >
                    Re-run AI Matching
                  </Button>
                </div>

                {/* Recommendations list */}
                {recommendations.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-surface-50 border border-surface-200">
                    <AlertCircle size={32} className="mx-auto text-surface-400 mb-2" />
                    <p className="text-sm font-bold text-surface-700">
                      No suitable Industry partner was found for the current project requirements.
                    </p>
                    <p className="text-xs text-surface-500 mt-1 max-w-md mx-auto">
                      JanSamadhan does not fabricate partner accounts. Try adjusting your support requirements or re-run matching as the prototype progresses.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map(rec => {
                      const isSelected = selectedPartner?.id === rec.partner.id;
                      return (
                        <div
                          key={rec.partner.id}
                          className={`p-5 rounded-2xl border transition-all ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50/20 shadow-md ring-2 ring-primary-500/20'
                              : 'border-surface-200 bg-white hover:border-surface-300 shadow-card-sm'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                    rec.fitLevel === 'High'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {rec.fitLevel} RELEVANCE
                                </span>
                                <span className="text-xs text-surface-500 font-medium">
                                  {rec.partner.city}, Jharkhand
                                </span>
                              </div>

                              <div>
                                <h3 className="text-base font-bold text-surface-900 flex items-center gap-2">
                                  <Building2 size={18} className="text-primary-700" />
                                  {rec.partner.name}
                                </h3>
                                <p className="text-xs text-surface-600 mt-0.5">
                                  Sector: <strong className="text-surface-800">{rec.partner.sector}</strong>
                                </p>
                              </div>

                              {/* Explainable Why Matched */}
                              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 text-xs space-y-1.5">
                                <span className="font-bold text-surface-800 block text-[11px] uppercase tracking-wider">
                                  Why Matched:
                                </span>
                                <ul className="space-y-1">
                                  {rec.matchReasons.map((reason, idx) => (
                                    <li key={idx} className="text-surface-700 flex items-start gap-1.5 leading-relaxed">
                                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                      <span>{reason.replace(/^✓\s*/, '')}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Support matched */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[11px] text-surface-500 font-medium">Requested Support Covered:</span>
                                {supportTypes.map((type, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-100 text-surface-700 border border-surface-200"
                                  >
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Select Button */}
                            <div className="sm:self-center shrink-0">
                              <Button
                                variant={isSelected ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => handleSelectPartner(rec.partner)}
                                icon={isSelected ? <Check size={14} /> : undefined}
                              >
                                {isSelected ? 'Selected Industry' : 'Select Industry'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-surface-200">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back to Requirements
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleProceedToSpocReview}
                    disabled={!selectedPartner}
                    icon={<ArrowRight size={15} />}
                  >
                    Proceed to SPOC Submission
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Forward to University SPOC */}
            {step === 3 && selectedPartner && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-surface-900">
                    Forward Collaboration Request to University SPOC
                  </h4>
                  <p className="text-xs text-surface-600 mt-0.5">
                    Your selected Industry will be forwarded to your University SPOC for official collaboration request processing.
                  </p>
                </div>

                {/* Important JanSamadhan Governance Note */}
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <ShieldCheck size={16} className="text-amber-600" /> JanSamadhan Institutional Protocol
                  </div>
                  <p className="leading-relaxed">
                    Faculty members do NOT submit official applications directly to external industries. Your University SPOC will inspect the complete project dossier and issue the official institutional Industry Collaboration Application.
                  </p>
                </div>

                {/* Review Card */}
                <div className="p-5 rounded-xl border border-surface-200 bg-white shadow-card-sm space-y-4 text-xs">
                  <div className="border-b border-surface-200 pb-3">
                    <span className="text-[11px] text-surface-500 uppercase tracking-wider font-bold">
                      Selected Industry Partner
                    </span>
                    <h3 className="text-base font-bold text-surface-900 mt-0.5 flex items-center gap-2">
                      <Building2 size={18} className="text-primary-600" />
                      {selectedPartner.name}
                    </h3>
                    <span className="text-surface-600 font-medium">{selectedPartner.sector} • {selectedPartner.city}, Jharkhand</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-surface-500 block">Requested By Faculty:</span>
                      <strong className="text-surface-800">{assignment?.faculty_name || 'Dr. Anita Sharma'} ({assignment?.university_name || 'BIT Sindri'})</strong>
                    </div>
                    <div>
                      <span className="text-surface-500 block">Project:</span>
                      <strong className="text-surface-800">{problemId} — {problem?.title}</strong>
                    </div>
                    <div>
                      <span className="text-surface-500 block">Support Needed:</span>
                      <span className="text-surface-800 font-medium">{supportTypes.join(' + ')}</span>
                    </div>
                    <div>
                      <span className="text-surface-500 block">Requested Co-Pilot Funding:</span>
                      <strong className="text-surface-800">₹{requestedFunding}</strong>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-surface-50 border border-surface-200 space-y-1">
                    <span className="font-bold text-surface-700 block">Faculty Project Statement:</span>
                    <p className="text-surface-600 leading-relaxed">{whyNeeded}</p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-surface-50 border border-surface-200 space-y-1">
                    <span className="font-bold text-surface-700 block">Expected Outcome:</span>
                    <p className="text-surface-600 leading-relaxed">{expectedOutcome}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-surface-500 font-medium">Status after submission:</span>
                    <Badge variant="warning">🟡 Pending University SPOC Review</Badge>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-4 border-t border-surface-200">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back to AI Recommendations
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSendToUniversitySpoc}
                    disabled={submitting}
                    icon={submitting ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                  >
                    {submitting ? 'Forwarding to SPOC...' : 'Send Request to University SPOC'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
