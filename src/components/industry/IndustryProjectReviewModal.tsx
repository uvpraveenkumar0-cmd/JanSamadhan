import React, { useState } from 'react';
import { 
  X, CheckCircle, XCircle, AlertTriangle, Building, User, Users, FileText, 
  Cpu, Award, Calendar, DollarSign, Target, Shield, Check, ExternalLink, ChevronRight
} from 'lucide-react';
import type { CollaborationRequest, ProblemEcosystem } from '../../types';
import { db } from '../../services/db';

interface IndustryProjectReviewModalProps {
  request: CollaborationRequest;
  ecosystem: ProblemEcosystem | null;
  currentUserId?: string;
  initialTab?: 'dossier' | 'accept' | 'reject';
  onClose: () => void;
  onDecisionComplete: () => void;
}

export const IndustryProjectReviewModal: React.FC<IndustryProjectReviewModalProps> = ({
  request,
  ecosystem,
  currentUserId = 'partner-agritech-01',
  initialTab = 'dossier',
  onClose,
  onDecisionComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'dossier' | 'accept' | 'reject'>(initialTab);
  const isP1029 = (request.problemId || request.problem_id) === 'P-1029';
  
  // Accept form state
  const [mentorName, setMentorName] = useState(
    isP1029 ? 'Er. Saurabh Srivastava' : 'Dr. Rajesh Varma, Lead Agronomist'
  );
  const [mentorEmail, setMentorEmail] = useState(
    isP1029 ? 's.srivastava@juvnl.org.in' : 'r.varma@agritech-jharkhand.com'
  );
  const [mentorDesignation, setMentorDesignation] = useState(
    isP1029 ? 'Executive Engineer (Substations & SCADA)' : 'Chief Technology Director'
  );
  const [fundingAmount, setFundingAmount] = useState<number>(request.requestedFunding || request.fundingRequested || 150000);
  const [fundingTranches, setFundingTranches] = useState<number>(3);
  const [fieldTestingSites, setFieldTestingSites] = useState(
    isP1029
      ? 'Ramgarh 33/11kV Substation & Campus Power Distribution House'
      : 'Ormanjhi & Mandar Agriculture Clusters, Ranchi'
  );
  const [hardwareProvided, setHardwareProvided] = useState(
    isP1029
      ? 'High-Voltage Rogowski Calibration Bench, 24V Auxiliary DC Power Supply, Enclosures'
      : '5x Multi-spectral Edge IoT Gateways, 1x Solar Field Hub'
  );
  const [technicalResources, setTechnicalResources] = useState(
    isP1029
      ? 'JUVNL SCADA IEC-60870-5-104 Telemetry Protocol Gateway Access'
      : 'Enterprise AgriCloud API Access, GPU Inference Cluster'
  );
  const [durationMonths, setDurationMonths] = useState(4);
  const [acceptanceNotes, setAcceptanceNotes] = useState(
    isP1029
      ? 'High technical readiness and direct alignment with JUVNL distribution transformer protection protocol.'
      : 'High technical readiness and direct alignment with our Kharif harvest protection initiatives.'
  );
  
  // Reject form state
  const [rejectionReason, setRejectionReason] = useState<string>('Prototype not deployment-ready');
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const problem = ecosystem?.problem;
  const project = ecosystem?.project;
  const prototype = ecosystem?.prototype;
  const squad = ecosystem?.squad;

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      db.reviewIndustryApplication(
        request.id,
        'accepted',
        {
          industryPartnerName: request.industryPartner || 'AgriTech Jharkhand Solutions',
          industryMentorName: mentorName,
          industryMentorRole: mentorDesignation,
          fundingCommitment: fundingAmount,
          fieldTestingDetails: fieldTestingSites,
          technicalSupportDetails: technicalResources,
          deploymentSupportDetails: hardwareProvided,
          durationMonths: durationMonths,
        }
      );
      onDecisionComplete();
    } catch (err) {
      console.error(err);
      alert('Error updating application decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionFeedback.trim()) {
      alert('Please provide constructive feedback for the university team');
      return;
    }
    setIsSubmitting(true);
    try {
      db.reviewIndustryApplication(
        request.id,
        'rejected',
        {
          industryPartnerName: request.industryPartner || 'AgriTech Jharkhand Solutions',
          rejectionReason: rejectionReason || 'Scope mismatch',
          rejectionFeedback: rejectionFeedback,
          rejectedBy: currentUserId,
        }
      );
      onDecisionComplete();
    } catch (err) {
      console.error(err);
      alert('Error recording decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-surface-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-surface-200 bg-surface-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-100 text-primary-700 rounded-xl">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                  {request.problemId}
                </span>
                <span className="font-mono text-xs text-surface-500">
                  App ID: {request.id}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  request.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                  request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  Status: {request.status.toUpperCase()}
                </span>
              </div>
              <h2 className="text-lg font-bold text-surface-900 mt-0.5">
                {request.projectTitle}
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

        {/* Action Tabs Bar */}
        <div className="px-6 py-2 bg-white border-b border-surface-200 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('dossier')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'dossier' 
                  ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                  : 'text-surface-600 hover:bg-surface-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Complete Project Dossier (8 Sections)
            </button>
            {['submitted_to_industry', 'submitted', 'under_review', 'pending'].includes(request.status) && (
              <>
                <button
                  onClick={() => setActiveTab('accept')}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'accept' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' 
                      : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Accept & Allocate Commitment
                </button>
                <button
                  onClick={() => setActiveTab('reject')}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'reject' 
                      ? 'bg-red-50 text-red-700 border border-red-300' 
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Decline Application
                </button>
              </>
            )}
          </div>

          <div className="text-xs text-surface-500">
            Submitted: {new Date(request.submittedAt || Date.now()).toLocaleDateString()} by {request.facultyName}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dossier' && (
            <div className="space-y-6 text-sm">
              
              {/* Section 1: Problem Origin & Civic Need */}
              <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">1</span>
                  <h3 className="font-semibold text-surface-900 text-base">Originating Citizen Problem & Civic Need</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-50 p-4 rounded-lg border border-surface-200">
                  <div>
                    <span className="text-xs text-surface-500 block">Citizen Grievance ID</span>
                    <span className="font-mono font-bold text-surface-900">{request.problemId}</span>
                  </div>
                  <div>
                    <span className="text-xs text-surface-500 block">Reported Location</span>
                    <span className="font-medium text-surface-800">{problem?.location || 'Ranchi District, Jharkhand'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-surface-500 block">Civic Impact Level</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      <AlertTriangle className="w-3 h-3" /> Critical Civic Urgency
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-surface-700 leading-relaxed text-xs">
                  {problem?.description || 'Extensive agricultural pest infestation (Fall Armyworm & Locust swarms) destroying over 450 hectares of paddy and maize in rural clusters, requiring edge AI vision detection and automated precision warning.'}
                </p>
              </div>

              {/* Section 2: University & Faculty Mentor */}
              <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">2</span>
                  <h3 className="font-semibold text-surface-900 text-base">Institutional Accreditation & Faculty Mentor</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-50 rounded-lg border border-surface-200 flex items-start gap-3">
                    <Building className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-surface-900">{request.universityName}</h4>
                      <p className="text-xs text-surface-500 mt-0.5">Govt Engineering College • Department of Computer Science & Agritech Innovation</p>
                      <div className="mt-2 text-xs text-surface-600">
                        Institutional Approval: <span className="text-emerald-600 font-semibold">Verified ✓</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-surface-50 rounded-lg border border-surface-200 flex items-start gap-3">
                    <User className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-surface-900">{request.facultyName}</h4>
                      <p className="text-xs text-surface-500 mt-0.5">Principal Investigator • Professor of Embedded AI Systems</p>
                      <p className="text-xs text-surface-600 mt-1">Contact: {request.facultyEmail || 'a.sharma@bitsindri.ac.in'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Student Engineering Squad */}
              <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 font-bold text-xs flex items-center justify-center">3</span>
                  <h3 className="font-semibold text-surface-900 text-base">Assigned Student Engineering Squad</h3>
                </div>
                <div className="p-4 bg-surface-50 rounded-lg border border-surface-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-bold text-surface-900">{squad?.team_name || 'Team Innovators-07'}</span>
                      <span className="text-xs text-surface-500 ml-2">({squad?.members?.length || 4} Undergrad/Postgrad Engineers)</span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 bg-cyan-50 text-cyan-700 rounded-full border border-cyan-200">
                      Sprint 4 Complete (92% velocity)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {(squad?.members || ['Pooja Kumari (Lead)', 'Rohan Gupta (ML)', 'Aman Sinha (IoT)', 'Neha Verma (Cloud)']).map((m: any, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded border border-surface-200 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-surface-400" />
                        <span className="font-medium text-surface-800 truncate">
                          {typeof m === 'string' ? m : m?.name || 'Squad Member'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 4: Prototype Specifications & Readiness */}
              <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">4</span>
                  <h3 className="font-semibold text-surface-900 text-base">Working Prototype Specifications & Hardware Metrics</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-xs text-emerald-800 font-semibold block">Prototype Build</span>
                    <span className="font-bold text-emerald-950 text-base">
                      {prototype?.title || prototype?.name || (isP1029 ? 'IoT Transformer Auto-Trip Node' : 'AI Crop Pest Camera Trap')}
                    </span>
                    <span className="text-xs text-emerald-700 block mt-1">
                      Readiness: {prototype?.readinessScore || (isP1029 ? 65 : 86)}% Field-Ready
                    </span>
                  </div>
                  <div className="p-3 bg-surface-50 rounded-lg border border-surface-200">
                    <span className="text-xs text-surface-500 block">Current Stage</span>
                    <span className="font-bold text-surface-900 text-base">{prototype?.status || 'Prototype Testing'}</span>
                    <span className="text-xs text-surface-500 block mt-1">Version {prototype?.version || 'v1.4'}</span>
                  </div>
                  <div className="p-3 bg-surface-50 rounded-lg border border-surface-200">
                    <span className="text-xs text-surface-500 block">Telemetry & Field Status</span>
                    <span className="font-bold text-surface-900 text-base">MQTT / LoRaWAN</span>
                    <span className="text-xs text-emerald-600 block mt-1 font-medium">Lab stress testing verified</span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-surface-600">
                  Tech Stack: <strong className="text-surface-800">{prototype?.techStack.join(', ') || 'Embedded C++, FreeRTOS, MQTT, Telemetry Sensors'}</strong>
                </p>
              </div>

              {/* Section 5: Research Papers & Peer Reviews */}
              <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">5</span>
                  <h3 className="font-semibold text-surface-900 text-base">Research Baseline & Scientific Basis</h3>
                </div>
                <div className="p-3 bg-surface-50 rounded-lg border border-surface-200 text-xs space-y-2">
                  <div className="flex items-center justify-between font-medium text-surface-900">
                    <span className="font-bold">
                      {ecosystem?.research?.[0]?.title || (isP1029 ? 'Non-Invasive IoT Telemetry & Thermal Stress Modeling for Distribution Transformers' : 'Edge AI Vision Models for In-Field Crop Pest Identification')}
                    </span>
                    <span className="text-surface-500">Documented</span>
                  </div>
                  <div className="text-surface-600 leading-relaxed">
                    Findings: {ecosystem?.research?.[0]?.findings || (isP1029 ? 'Thermal imaging logged peak core heating above 94°C. Rogowski telemetry verified 28% neutral imbalance.' : 'YOLOv8 nano edge quantization achieved 92.4% mAP with inference under 180ms.')}
                  </div>
                  <div className="text-[11px] text-surface-500 pt-1">
                    Conducted By: {ecosystem?.research?.[0]?.conductedBy || request.facultyName}
                  </div>
                </div>
              </div>

              {/* Section 6: Specific Industry Support Requested */}
              <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">6</span>
                  <h3 className="font-semibold text-surface-900 text-base">Industry Support Requested</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(request.supportRequirements || request.supportAreas || request.requestType || ['Funding', 'Technical Mentorship', 'Field Testing']).map((area, i) => (
                    <div key={i} className="p-2.5 bg-amber-50 rounded border border-amber-200 text-xs font-semibold text-amber-900 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600" />
                      {area}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-surface-50 rounded border border-surface-200 text-xs">
                  <span className="font-semibold text-surface-900">Requested Co-Pilot Funding: </span>
                  <span className="font-mono font-bold text-primary-700">₹{(request.requestedFunding || request.fundingRequested || 150000).toLocaleString()}</span>
                  <span className="text-surface-500 ml-2">(Allocated for field units enclosure manufacturing, sensor calibration, and telematics scale)</span>
                </div>
              </div>

              {/* Section 7: Proposed Milestones & Timeline */}
              <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center">7</span>
                  <h3 className="font-semibold text-surface-900 text-base">Execution Milestones</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-surface-50 rounded border border-surface-200 flex items-center justify-between">
                    <span className="font-medium text-surface-900">Milestone 1: IP67 Enclosure Hardening & Component Sourcing</span>
                    <span className="font-mono text-surface-500">Weeks 1-3</span>
                  </div>
                  <div className="p-2.5 bg-surface-50 rounded border border-surface-200 flex items-center justify-between">
                    <span className="font-medium text-surface-900">Milestone 2: Joint Lab Rig Testing & Cloud Sync Validation</span>
                    <span className="font-mono text-surface-500">Weeks 4-6</span>
                  </div>
                  <div className="p-2.5 bg-surface-50 rounded border border-surface-200 flex items-center justify-between">
                    <span className="font-medium text-surface-900">Milestone 3: 30-Day Cluster Pilot in Ormanjhi Block</span>
                    <span className="font-mono text-surface-500">Weeks 7-12</span>
                  </div>
                  <div className="p-2.5 bg-surface-50 rounded border border-surface-200 flex items-center justify-between">
                    <span className="font-medium text-surface-900">Milestone 4: Government Pilot Sign-off & Scale Report</span>
                    <span className="font-mono text-surface-500">Weeks 13-16</span>
                  </div>
                </div>
              </div>

              {/* Section 8: Complete Project Timeline */}
              <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">8</span>
                  <h3 className="font-semibold text-surface-900 text-base">Complete Project Timeline & Traceability</h3>
                </div>
                <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-200 text-xs">
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                    <span className="font-bold text-surface-900 block">1. Problem Submitted</span>
                    <span className="text-surface-500">Reported by citizen ({problem?.citizenName || 'Citizen'}) • {problem?.submittedAt?.split('T')[0] || '2026-09-02'}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                    <span className="font-bold text-surface-900 block">2. Government Review</span>
                    <span className="text-surface-500">Verified by {problem?.verifiedBy || 'Rajesh Kumar IAS'} • Priority: High</span>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                    <span className="font-bold text-surface-900 block">3. University Assignment</span>
                    <span className="text-surface-500">Assigned to {request.universityName || 'BIT Sindri'} • Faculty: {request.facultyName}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                    <span className="font-bold text-surface-900 block">4. Research Activity</span>
                    <span className="text-surface-500">{ecosystem?.research?.[0]?.title || 'Field baseline telemetry investigation documented'}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                    <span className="font-bold text-surface-900 block">5. Working Prototype</span>
                    <span className="text-surface-500">{prototype?.title || 'Sensor Node Controller'} ({prototype?.version || 'v1.4'}) • {prototype?.readinessScore || 65}% Readiness</span>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                    <span className="font-bold text-surface-900 block">6. Laboratory Testing</span>
                    <span className="text-surface-500">{prototype?.fieldTestingStatus || 'Bench stress and safety auto-trip calibration verified'}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                    <span className="font-bold text-surface-900 block">7. Industry Support Requested</span>
                    <span className="text-surface-500">Faculty identified needs: {request.supportRequirements?.join(', ') || 'Testing & Hardware'}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                    <span className="font-bold text-surface-900 block">8. University SPOC Review</span>
                    <span className="text-surface-500">Endorsed and verified by University SPOC</span>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white animate-pulse" />
                    <span className="font-bold text-blue-900 block">9. Official Industry Application Dispatched</span>
                    <span className="text-blue-700 font-medium">Application ID: {request.applicationId || 'IND-REQ-1029'} • Awaiting Partner Ratification</span>
                  </div>
                </div>
              </div>

              {/* Section 9: Corporate Alignment Matrix */}
              <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">9</span>
                  <h3 className="font-semibold text-surface-900 text-base">Corporate Alignment Matrix</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-surface-50 rounded border border-surface-200">
                    <span className="text-surface-500 block">Strategic Fit</span>
                    <span className="font-bold text-emerald-600 text-sm">{request.aiMatchScore || 94}% Fit</span>
                    <p className="text-surface-500 mt-1">Directly matches our corporate innovation and deployment mandate.</p>
                  </div>
                  <div className="p-3 bg-surface-50 rounded border border-surface-200">
                    <span className="text-surface-500 block">CSR / R&D Budget</span>
                    <span className="font-bold text-surface-900 text-sm">₹{(request.requestedFunding || 150000).toLocaleString()} Pool</span>
                    <p className="text-surface-500 mt-1">Well within 2026 innovation allocation pool.</p>
                  </div>
                  <div className="p-3 bg-surface-50 rounded border border-surface-200">
                    <span className="text-surface-500 block">Deployment Readiness</span>
                    <span className="font-bold text-primary-700 text-sm">Pilot Field Ready</span>
                    <p className="text-surface-500 mt-1">Ready for on-site supervised installation.</p>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Actions if under review */}
              {['submitted_to_industry', 'submitted', 'under_review', 'pending'].includes(request.status) && (
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('reject')}
                    className="px-5 py-2.5 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors"
                  >
                    Decline with Constructive Feedback
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('accept')}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    Proceed to Accept & Commit Resources <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'accept' && (
            <form onSubmit={handleAccept} className="space-y-6 max-w-3xl mx-auto py-2">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm">Accept Industry Collaboration Request</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    By accepting, your organization formally agrees to provide active technical mentorship, designated funding tranches, and validation resources for this civic solution.
                  </p>
                </div>
              </div>

              {/* Designated Mentor */}
              <div className="bg-white p-5 border border-surface-200 rounded-xl shadow-sm space-y-4">
                <h4 className="font-bold text-surface-900 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-600" />
                  1. Designated Industry Mentor
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-surface-700 mb-1">Mentor Name *</label>
                    <input
                      type="text"
                      required
                      value={mentorName}
                      onChange={e => setMentorName(e.target.value)}
                      className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-700 mb-1">Mentor Email *</label>
                    <input
                      type="email"
                      required
                      value={mentorEmail}
                      onChange={e => setMentorEmail(e.target.value)}
                      className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-700 mb-1">Designation *</label>
                    <input
                      type="text"
                      required
                      value={mentorDesignation}
                      onChange={e => setMentorDesignation(e.target.value)}
                      className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Funding Commitment */}
              <div className="bg-white p-5 border border-surface-200 rounded-xl shadow-sm space-y-4">
                <h4 className="font-bold text-surface-900 text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary-600" />
                  2. Financial Commitment & Tranches
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-surface-700 mb-1">Total Committed Funding (₹) *</label>
                    <input
                      type="number"
                      required
                      min={10000}
                      step={5000}
                      value={fundingAmount}
                      onChange={e => setFundingAmount(Number(e.target.value))}
                      className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono font-bold"
                    />
                    <span className="text-[11px] text-surface-500 mt-1 block">Requested by University: ₹{(request.fundingRequested || 150000).toLocaleString()}</span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-700 mb-1">Milestone Tranches *</label>
                    <select
                      value={fundingTranches}
                      onChange={e => setFundingTranches(Number(e.target.value))}
                      className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                      <option value={2}>2 Tranches (50% upfront, 50% pilot completion)</option>
                      <option value={3}>3 Tranches (35% upfront, 35% lab testing, 30% pilot)</option>
                      <option value={4}>4 Tranches (25% every 4 weeks upon milestone review)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Technical Support & Field Sites */}
              <div className="bg-white p-5 border border-surface-200 rounded-xl shadow-sm space-y-4">
                <h4 className="font-bold text-surface-900 text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary-600" />
                  3. Hardware, Testing & Deployment Support
                </h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium text-surface-700 mb-1">Designated Field Testing Locations *</label>
                    <input
                      type="text"
                      required
                      value={fieldTestingSites}
                      onChange={e => setFieldTestingSites(e.target.value)}
                      className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-surface-700 mb-1">Hardware / Lab Infrastructure Provided</label>
                    <input
                      type="text"
                      value={hardwareProvided}
                      onChange={e => setHardwareProvided(e.target.value)}
                      className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-surface-700 mb-1">Enterprise Software / API Access Provided</label>
                    <input
                      type="text"
                      value={technicalResources}
                      onChange={e => setTechnicalResources(e.target.value)}
                      className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-surface-700 mb-1">Acceptance Notes / Terms</label>
                    <textarea
                      rows={2}
                      value={acceptanceNotes}
                      onChange={e => setAcceptanceNotes(e.target.value)}
                      className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('dossier')}
                  className="px-4 py-2 border border-surface-200 text-surface-700 hover:bg-surface-50 rounded-lg text-xs font-semibold"
                >
                  Back to Dossier
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  {isSubmitting ? 'Confirming Acceptance...' : 'Confirm Acceptance & Establish Workspace'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'reject' && (
            <form onSubmit={handleReject} className="space-y-6 max-w-2xl mx-auto py-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-900 text-sm">Decline Collaboration Application</h4>
                  <p className="text-xs text-red-700 mt-0.5">
                    Decline with structured rationale. The University and Faculty team will receive this constructive feedback to refine their prototype or approach another sector partner. The project itself remains active in the university.
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 border border-surface-200 rounded-xl shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-medium text-surface-700 mb-1">Structured Reason for Rejection *</label>
                  <select
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="scope_mismatch">Scope Mismatch with Current Corporate Mandate</option>
                    <option value="budget_exceeded">Budget / CSR Innovation Capacity Exceeded for this Quarter</option>
                    <option value="technical_readiness">Prototype Requires Further Lab Maturation Before Field Trial</option>
                    <option value="already_partnered">Already Partnered with Similar Regional Initiative</option>
                    <option value="regulatory_constraints">Regulatory / Compliance Constraints</option>
                    <option value="other">Other Domain Constraints</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-surface-700 mb-1">Constructive Technical Feedback *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide specific feedback, e.g. recommend sensor calibration improvements, alternative field trial periods, or suggestions for other suitable industry categories..."
                    value={rejectionFeedback}
                    onChange={e => setRejectionFeedback(e.target.value)}
                    className="w-full text-xs p-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                  <span className="text-[11px] text-surface-500 mt-1 block">This feedback will be notified directly to the Faculty Lead and University Innovation Cell.</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('dossier')}
                  className="px-4 py-2 border border-surface-200 text-surface-700 hover:bg-surface-50 rounded-lg text-xs font-semibold"
                >
                  Back to Dossier
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Rejection & Feedback'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-surface-200 bg-surface-50 flex items-center justify-between text-xs text-surface-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary-600" />
            <span>JanSamadhan Industry-Academia Collaborative Governance Protocol v2.6</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-surface-200 hover:bg-surface-100 rounded-lg text-surface-700 font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
