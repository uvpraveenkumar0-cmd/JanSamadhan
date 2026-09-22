import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, MapPin, FileText, Users, Camera, Eye } from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { fadeVariants } from '../../config/motion';
import { problemService } from '../../services/problemService';
import { evidenceService, revokeEvidencePreview, formatFileSize } from '../../services/evidenceService';
import { useApp } from '../../context/AppContext';
import { cn, DOMAIN_LABELS } from '../../lib/utils';
import { EvidenceStep } from '../../components/evidence/EvidenceStep';
import { UploadProgress } from '../../components/evidence/UploadProgress';
import type { EvidenceFile } from '../../types/evidenceTypes';
import { FILE_TYPE_LABELS } from '../../types/evidenceTypes';
import { AIProcessingScreen } from '../../components/ai/AIProcessingScreen';
import { CitizenAIExperience } from '../../components/ai/CitizenAIExperience';
import { aiAnalysisService } from '../../services/aiAnalysisService';
import { aiReportStorage } from '../../services/aiReportStorage';
import type { AIReport, AIProcessingStage } from '../../types/aiReportTypes';
import type { Problem } from '../../types';

// ─── Schemas per step ─────────────────────────────────────────────────────────

const step1Schema = z.object({
  title:       z.string().min(10, 'Title must be at least 10 characters'),
  domain:      z.string().min(1, 'Please select a domain'),
  subcategory: z.string().min(3, 'Subcategory required'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
});

const step2Schema = z.object({
  district: z.string().min(1, 'Please select a district'),
  block:    z.string().optional(),
  village:  z.string().optional(),
});

const step3Schema = z.object({
  affectedPopulation: z.number().min(1, 'Must be at least 1'),
  impactDescription:  z.string().min(20, 'Please describe the impact'),
  severity:           z.enum(['low','medium','high','critical']),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
type Step3 = z.infer<typeof step3Schema>;

const STEPS = [
  { label: 'Problem Details', icon: <FileText size={16} /> },
  { label: 'Location',        icon: <MapPin size={16} /> },
  { label: 'Impact',          icon: <Users size={16} /> },
  { label: 'Evidence',        icon: <Camera size={16} /> },
  { label: 'Review',          icon: <Eye size={16} /> },
];

const DISTRICTS = ['Ranchi','Dhanbad','Jamshedpur','Bokaro','Hazaribagh','Giridih','Deoghar','Palamu','Gumla','Dumka','Godda','Latehar','Khunti','Ramgarh','Simdega','West Singhbhum','Sahebganj','Pakur','Jamtara','Koderma','Chatra','Lohardaga','Seraikela-Kharsawan'];

export default function ProblemSubmit() {
  const { user, addToast } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [submittedProblem, setSubmittedProblem] = useState<Problem | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<AIProcessingStage>('received');
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [uploadIndex, setUploadIndex] = useState(0);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      evidenceFiles.forEach(f => revokeEvidencePreview(f));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { register: r1, handleSubmit: h1, formState: { errors: e1 } } = useForm<Step1>({ resolver: zodResolver(step1Schema), defaultValues: formData });
  const { register: r2, handleSubmit: h2, formState: { errors: e2 } } = useForm<Step2>({ resolver: zodResolver(step2Schema), defaultValues: formData });
  const { register: r3, handleSubmit: h3, formState: { errors: e3 } } = useForm<Step3>({ resolver: zodResolver(step3Schema), defaultValues: { affectedPopulation: 100, severity: 'medium', ...formData } });

  const onStep1 = h1(data => { setFormData(f => ({ ...f, ...data })); setStep(1); });
  const onStep2 = h2(data => { setFormData(f => ({ ...f, ...data })); setStep(2); });
  const onStep3 = h3(data => { setFormData(f => ({ ...f, ...data })); setStep(3); });

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      // 1. Create the problem record first
      const problem = await problemService.submit({
        title: formData.title,
        description: formData.description,
        domain: formData.domain,
        category: DOMAIN_LABELS[formData.domain] || formData.domain,
        subcategory: formData.subcategory,
        districtId: formData.district?.toLowerCase().replace(/\s/g, '_'),
        district: formData.district,
        state: 'Jharkhand',
        location: `${formData.village ? formData.village + ', ' : ''}${formData.district}, Jharkhand`,
        block: formData.block,
        village: formData.village,
        citizenId: user.id || user.profileId,
        citizenName: user.name,
        affectedPopulation: Number(formData.affectedPopulation) || 100,
        severity: formData.severity,
        priority: 'high',
        tags: [formData.domain, formData.subcategory],
        evidence: evidenceFiles.map(f => f.originalFileName),
      });

      setSubmittedProblem(problem);

      // 2. Upload evidence if any files are selected
      if (evidenceFiles.length > 0) {
        setUploadingEvidence(true);
        const userId = user.id || user.profileId;

        // Update each file status as we go
        for (let i = 0; i < evidenceFiles.length; i++) {
          setUploadIndex(i);
          setEvidenceFiles(prev =>
            prev.map((f, idx) => idx === i ? { ...f, uploadStatus: 'uploading' } : f)
          );

          try {
            await evidenceService.uploadEvidence([evidenceFiles[i]], userId, problem.id);
            setEvidenceFiles(prev =>
              prev.map((f, idx) => idx === i ? { ...f, uploadStatus: 'uploaded' } : f)
            );
          } catch {
            setEvidenceFiles(prev =>
              prev.map((f, idx) => idx === i ? { ...f, uploadStatus: 'failed' } : f)
            );
            // Don't fail the whole submission if one file fails
            addToast({
              type: 'warning',
              title: 'Evidence upload issue',
              message: `Could not save "${evidenceFiles[i].originalFileName}". Your problem was still submitted.`,
            });
          }
        }
        setUploadingEvidence(false);
      }

      // 3. Cleanup preview URLs
      evidenceFiles.forEach(f => revokeEvidencePreview(f));

      // 4. Automated Real AI Analysis Pipeline
      setIsAnalyzing(true);
      setAnalysisStage('received');

      try {
        const allProblems = await problemService.getAll();

        const report = await aiAnalysisService.analyzeProblem(
          problem,
          allProblems,
          (stage) => {
            setAnalysisStage(stage);
          }
        );

        // Save AI report to storage & synchronize with problem record
        aiReportStorage.saveAIReport(report);
        setAiReport(report);

        addToast({
          type: 'success',
          title: 'Problem Submitted & AI Verified!',
          message: `Analysis report generated for Tracking ID: ${problem.id}`,
        });
      } catch (aiErr) {
        console.error('AI Analysis failed:', aiErr);
        addToast({
          type: 'warning',
          title: 'AI Verification queued',
          message: 'Problem was recorded successfully. Detailed AI report will be available in Track Status.',
        });
      } finally {
        setIsAnalyzing(false);
      }

      setSubmitted(problem.id);
    } catch {
      addToast({ type: 'error', title: 'Submission failed', message: 'Please try again.' });
    } finally {
      setSubmitting(false);
      setUploadingEvidence(false);
    }
  };

  // State A: AI Analysis is running
  if (isAnalyzing && submittedProblem) {
    return (
      <PageTransition>
        <AIProcessingScreen
          currentStage={analysisStage}
          problemTitle={submittedProblem.title}
          problemId={submittedProblem.id}
        />
      </PageTransition>
    );
  }

  // State B: Problem submitted and AI Analysis ready
  if (submitted && submittedProblem) {
    return (
      <PageTransition>
        <div className="max-w-4xl mx-auto py-6 px-2 sm:px-4">
          {aiReport ? (
            <CitizenAIExperience
              report={aiReport}
              onTrackStatus={() => navigate(`/citizen/track?problemId=${submitted}`)}
              onViewMyProblems={() => navigate('/citizen/dashboard')}
            />
          ) : (
            <div className="max-w-lg mx-auto text-center py-8">
              <h3 className="text-lg font-bold text-surface-900 mb-2">Problem Submitted!</h3>
              <p className="text-surface-500 mb-6">
                Your problem has been registered in the government database and is queued for verification.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={() => navigate(`/citizen/track?problemId=${submitted}`)}>
                  Track Progress
                </Button>
                <Button variant="primary" onClick={() => navigate('/citizen/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-surface-900 mb-1">Submit a Problem</h1>
          <p className="text-sm text-surface-500">Help your community — report a challenge and connect it to innovation</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  animate={{
                    backgroundColor: i < step ? '#16a34a' : i === step ? '#2563eb' : '#f1f5f9',
                    color: i <= step ? '#fff' : '#94a3b8',
                    scale: i === step ? 1.1 : 1,
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                >
                  {i < step ? <Check size={16} /> : s.icon}
                </motion.div>
                <span className={cn('text-2xs font-medium hidden sm:block', i === step ? 'text-primary-700' : 'text-surface-400')}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-2 h-0.5 bg-surface-200 relative top-[-8px]">
                  <motion.div
                    className="h-full bg-success-500"
                    animate={{ scaleX: i < step ? 1 : 0, originX: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Forms */}
        <AnimatePresence mode="wait">
          {/* Step 0 — Problem Details */}
          {step === 0 && (
            <motion.div key="step0" {...fadeVariants} initial="initial" animate="animate" exit="exit">
              <Card padding="lg">
                <h2 className="text-base font-semibold text-surface-900 mb-5">Problem Details</h2>
                <form onSubmit={onStep1} className="space-y-4" autoComplete="off">
                  <div>
                    <label className="label">Problem Title *</label>
                    <input
                      type="text"
                      className={cn('input', e1.title && 'border-danger-400')}
                      placeholder="Briefly describe the problem (min. 10 chars)"
                      {...r1('title')}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      data-lpignore="true"
                    />
                    {e1.title && <p className="text-xs text-danger-600 mt-1">{e1.title.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Domain *</label>
                      <select className={cn('input', e1.domain && 'border-danger-400')} {...r1('domain')}>
                        <option value="">Select domain...</option>
                        {Object.entries(DOMAIN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      {e1.domain && <p className="text-xs text-danger-600 mt-1">{e1.domain.message}</p>}
                    </div>
                    <div>
                      <label className="label">Subcategory *</label>
                      <input
                        type="text"
                        className={cn('input', e1.subcategory && 'border-danger-400')}
                        placeholder="e.g. Water Quality"
                        {...r1('subcategory')}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        data-lpignore="true"
                        data-form-type="other"
                        aria-autocomplete="none"
                      />
                      {e1.subcategory && <p className="text-xs text-danger-600 mt-1">{e1.subcategory.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="label">Detailed Description * (min. 50 characters)</label>
                    <textarea className={cn('input h-32 resize-none', e1.description && 'border-danger-400')} placeholder="Describe the problem in detail — what happens, how long it's been happening, who is affected, what you've tried..." {...r1('description')} />
                    {e1.description && <p className="text-xs text-danger-600 mt-1">{e1.description.message}</p>}
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" icon={<ChevronRight size={16} />} iconPosition="right">Next: Location</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}

          {/* Step 1 — Location */}
          {step === 1 && (
            <motion.div key="step1" {...fadeVariants} initial="initial" animate="animate" exit="exit">
              <Card padding="lg">
                <h2 className="text-base font-semibold text-surface-900 mb-5">Location</h2>
                <form onSubmit={onStep2} className="space-y-4" autoComplete="off">
                  <div>
                    <label className="label">District *</label>
                    <select className={cn('input', e2.district && 'border-danger-400')} {...r2('district')}>
                      <option value="">Select district...</option>
                      {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {e2.district && <p className="text-xs text-danger-600 mt-1">{e2.district.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Block / Taluka</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. Kanke"
                        {...r2('block')}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        data-lpignore="true"
                      />
                    </div>
                    <div>
                      <label className="label">Village / Area</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. Hesag Panchayat"
                        {...r2('village')}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        data-lpignore="true"
                        data-form-type="other"
                        aria-autocomplete="none"
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-surface-50 rounded-lg text-xs text-surface-500">
                    📍 Precise location helps match the problem to the right university and district officer.
                  </div>
                  <div className="flex justify-between">
                    <Button type="button" variant="secondary" onClick={() => setStep(0)} icon={<ChevronLeft size={16} />}>Back</Button>
                    <Button type="submit" variant="primary" icon={<ChevronRight size={16} />} iconPosition="right">Next: Impact</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}

          {/* Step 2 — Impact */}
          {step === 2 && (
            <motion.div key="step2" {...fadeVariants} initial="initial" animate="animate" exit="exit">
              <Card padding="lg">
                <h2 className="text-base font-semibold text-surface-900 mb-5">Impact Assessment</h2>
                <form onSubmit={onStep3} className="space-y-4" autoComplete="off">
                  <div>
                    <label className="label">Estimated Affected Population *</label>
                    <input
                      type="number"
                      className={cn('input', e3.affectedPopulation && 'border-danger-400')}
                      placeholder="e.g. 1247"
                      {...r3('affectedPopulation', { valueAsNumber: true })}
                      autoComplete="off"
                    />
                    {e3.affectedPopulation && <p className="text-xs text-danger-600 mt-1">{e3.affectedPopulation.message}</p>}
                  </div>
                  <div>
                    <label className="label">Severity *</label>
                    <select className="input" {...r3('severity')}>
                      <option value="low">Low — Minor inconvenience</option>
                      <option value="medium">Medium — Significant problem</option>
                      <option value="high">High — Serious health/safety concern</option>
                      <option value="critical">Critical — Immediate danger / Life-threatening</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Describe the Impact *</label>
                    <textarea className={cn('input h-28 resize-none', e3.impactDescription && 'border-danger-400')} placeholder="How does this problem affect daily life? What will happen if it's not solved?" {...r3('impactDescription')} />
                    {e3.impactDescription && <p className="text-xs text-danger-600 mt-1">{e3.impactDescription.message}</p>}
                  </div>
                  <div className="flex justify-between">
                    <Button type="button" variant="secondary" onClick={() => setStep(1)} icon={<ChevronLeft size={16} />}>Back</Button>
                    <Button type="submit" variant="primary" icon={<ChevronRight size={16} />} iconPosition="right">Next: Evidence</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}

          {/* Step 3 — Evidence */}
          {step === 3 && (
            <motion.div key="step3" {...fadeVariants} initial="initial" animate="animate" exit="exit">
              <Card padding="lg">
                <h2 className="text-base font-semibold text-surface-900 mb-5">Upload Evidence (Optional)</h2>
                <EvidenceStep files={evidenceFiles} onChange={setEvidenceFiles} />
                <div className="flex justify-between mt-5">
                  <Button type="button" variant="secondary" onClick={() => setStep(2)} icon={<ChevronLeft size={16} />}>Back</Button>
                  <Button type="button" variant="primary" onClick={() => setStep(4)} icon={<ChevronRight size={16} />} iconPosition="right">Review & Submit</Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 4 — Review */}
          {step === 4 && (
            <motion.div key="step4" {...fadeVariants} initial="initial" animate="animate" exit="exit">
              <Card padding="lg">
                <h2 className="text-base font-semibold text-surface-900 mb-5">Review Your Submission</h2>
                <div className="space-y-4 mb-6">
                  {[
                    { label: 'Title',           value: formData.title },
                    { label: 'Domain',          value: DOMAIN_LABELS[formData.domain] ?? formData.domain },
                    { label: 'Subcategory',     value: formData.subcategory },
                    { label: 'District',        value: `${formData.district}${formData.block ? ` › ${formData.block}` : ''}${formData.village ? ` › ${formData.village}` : ''}` },
                    { label: 'Affected People', value: formData.affectedPopulation?.toLocaleString() },
                    { label: 'Severity',        value: formData.severity },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-4">
                      <span className="text-xs font-medium text-surface-500 w-32 shrink-0">{label}</span>
                      <span className="text-sm text-surface-800">{value ?? '—'}</span>
                    </div>
                  ))}
                  <div className="pt-2">
                    <span className="text-xs font-medium text-surface-500">Description</span>
                    <p className="text-sm text-surface-800 mt-1 leading-relaxed">{formData.description}</p>
                  </div>

                  {/* Real Evidence Review */}
                  <div className="pt-2">
                    <span className="text-xs font-medium text-surface-500 mb-2 block">Evidence</span>
                    {evidenceFiles.length === 0 ? (
                      <p className="text-sm text-surface-400">No evidence attached</p>
                    ) : (
                      <div className="space-y-2">
                        {evidenceFiles.map(f => (
                          <div key={f.id} className="flex items-center gap-3 p-2.5 bg-surface-50 rounded-lg border border-surface-100">
                            {f.type === 'image' && (
                              <img src={f.previewUrl} alt={f.originalFileName} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                            )}
                            {f.type === 'video' && (
                              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                                <Camera size={18} className="text-purple-500" />
                              </div>
                            )}
                            {f.type === 'document' && (
                              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                                <FileText size={18} className="text-orange-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-surface-800 truncate">{f.originalFileName}</p>
                              <p className="text-xs text-surface-500">{FILE_TYPE_LABELS[f.type]} • {formatFileSize(f.size)}</p>
                            </div>
                          </div>
                        ))}
                        <p className="text-xs text-surface-400">{evidenceFiles.length} file{evidenceFiles.length !== 1 ? 's' : ''} attached</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload progress during submission */}
                {uploadingEvidence && (
                  <div className="mb-5">
                    <UploadProgress files={evidenceFiles} currentIndex={uploadIndex} />
                  </div>
                )}

                <div className="p-3 bg-primary-50 border border-primary-100 rounded-lg text-xs text-primary-700 mb-5">
                  ℹ Upon submission, an AI system will analyze and categorize this problem before it reaches the government officer queue.
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="secondary" onClick={() => setStep(3)} icon={<ChevronLeft size={16} />}>Back</Button>
                  <Button type="button" variant="primary" loading={submitting} onClick={handleSubmit}>
                    {submitting ? 'Submitting...' : 'Submit Problem'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
