import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  Check,
  ArrowRight,
  AlertTriangle,
  Building2,
  Users,
  MapPin,
  Calendar,
  Layers,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/Progress';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { matchingService } from '../../services/matchingService';
import type {
  Problem,
  FacultyMatchResult,
  TeamMatchResult,
  FacultyMember,
  StudentTeam,
} from '../../types';

export default function FacultyTeamMatching() {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const { addToast, user } = useApp();

  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [problem, setProblem] = useState<Problem | null>(null);

  // Matching state
  const [facultyMatches, setFacultyMatches] = useState<FacultyMatchResult[]>([]);
  const [teamMatches, setTeamMatches] = useState<TeamMatchResult[]>([]);

  // Selections
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null);
  const [selectedFacultyScore, setSelectedFacultyScore] = useState<number>(0);
  const [selectedTeam, setSelectedTeam] = useState<StudentTeam | null>(null);
  const [selectedTeamScore, setSelectedTeamScore] = useState<number>(0);

  // Active step: 1 = Faculty, 2 = Team, 3 = Review
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Expandable breakdowns
  const [expandedFacultyId, setExpandedFacultyId] = useState<string | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  // Override & Confirmation modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProblemAndMatches();
  }, [problemId]);

  const loadProblemAndMatches = async () => {
    setLoading(true);
    setLoadingStep(0);

    const steps = [
      'Loading verified problem requirements...',
      'Evaluating candidate faculty expertise & workload...',
      'Assessing student team technical capabilities...',
      'Synthesizing multi-factor compatibility rankings...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setLoadingStep(i);
      await new Promise((r) => setTimeout(r, 200));
    }

    const currentId = problemId || 'P-1028';
    let p = db.getProblemById(currentId);

    if (!p) {
      // Fallback to P-1028
      p = db.getProblemById('P-1028');
    }

    if (!p) {
      addToast({
        type: 'error',
        title: 'Problem not found',
        message: `Problem ${currentId} could not be located.`,
      });
      setLoading(false);
      return;
    }

    setProblem(p);

    const univId = p.assigned_university || 'univ1';

    // Load faculty matches
    const fMatches = await matchingService.matchProblemToFaculty(p, univId);
    setFacultyMatches(fMatches);

    if (fMatches.length > 0) {
      // Pre-select top AI recommended faculty
      setSelectedFaculty(fMatches[0].faculty);
      setSelectedFacultyScore(fMatches[0].matchScore);
    }

    // Load team matches
    const tMatches = await matchingService.matchProblemToTeams(p, univId, fMatches[0]?.faculty_id);
    setTeamMatches(tMatches);

    if (tMatches.length > 0) {
      // Pre-select top AI recommended team
      setSelectedTeam(tMatches[0].team);
      setSelectedTeamScore(tMatches[0].matchScore);
    }

    setLoading(false);
  };

  const handleSelectFaculty = (match: FacultyMatchResult) => {
    setSelectedFaculty(match.faculty);
    setSelectedFacultyScore(match.matchScore);
    addToast({
      type: 'info',
      title: 'Faculty Mentor Selected',
      message: `${match.faculty.name} (${match.matchScore}% Match) selected. Now proceed to team matching.`,
    });
    setActiveStep(2);
  };

  const handleSelectTeam = (match: TeamMatchResult) => {
    setSelectedTeam(match.team);
    setSelectedTeamScore(match.matchScore);
    addToast({
      type: 'info',
      title: 'Student Team Selected',
      message: `${match.team.team_name} (${match.matchScore}% Match) selected. Review project readiness.`,
    });
    setActiveStep(3);
  };

  const isOverride =
    facultyMatches[0] &&
    selectedFaculty &&
    facultyMatches[0].faculty_id !== selectedFaculty.faculty_id;

  const handleConfirmAssignment = async () => {
    if (!problem || !selectedFaculty || !selectedTeam) return;

    if (isOverride && !overrideReason.trim()) {
      addToast({
        type: 'warning',
        title: 'Override reason required',
        message: 'Please provide justification for overriding the AI top recommendation.',
      });
      return;
    }

    setSubmitting(true);
    try {
      await matchingService.assignFacultyAndTeam({
        problemId: problem.id,
        universityId: problem.assigned_university || 'univ1',
        facultyId: selectedFaculty.faculty_id,
        teamId: selectedTeam.team_id,
        assignedBy: user?.name || 'Dr. Anita Sharma (University Admin)',
        facultyMatchScore: selectedFacultyScore,
        teamMatchScore: selectedTeamScore,
        assignmentType: isOverride ? 'University Override' : 'AI Recommended',
        overrideReason: isOverride ? overrideReason : undefined,
      });

      addToast({
        type: 'success',
        title: 'Project Assignment Dispatched!',
        message: `Mentorship dispatched to ${selectedFaculty.name} and ${selectedTeam.team_name}. Awaiting acceptance.`,
      });

      setConfirmModalOpen(false);
      navigate('/university/dashboard');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Assignment failed',
        message: err.message || 'Please check candidate availability.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const overallReadiness = Math.round((selectedFacultyScore + selectedTeamScore) / 2);

  if (loading) {
    return (
      <PageTransition>
        <div className="max-w-4xl mx-auto py-16 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-inner animate-pulse">
            <Sparkles size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-900">JanSamadhan AI Capability Engine</h2>
            <p className="text-xs text-surface-500 mt-1">Multi-factor algorithmic matching in progress...</p>
          </div>
          <div className="max-w-md mx-auto bg-surface-100 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-primary-600"
              initial={{ width: '10%' }}
              animate={{ width: `${(loadingStep + 1) * 25}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs font-mono font-medium text-purple-700 animate-pulse">
            {['Analyzing problem requirements...', 'Evaluating faculty expertise & workload...', 'Assessing student team capabilities...', 'Synthesizing rankings...'][loadingStep]}
          </p>
        </div>
      </PageTransition>
    );
  }

  if (!problem) {
    return (
      <PageTransition>
        <div className="p-8 text-center space-y-4">
          <AlertTriangle size={36} className="text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-surface-900">Problem Not Found</h3>
          <p className="text-sm text-surface-500">Problem {problemId} is not ready for faculty and team matching.</p>
          <Link to="/university/dashboard">
            <Button variant="primary">Return to University Dashboard</Button>
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/university/dashboard">
            <button className="p-2 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-600 transition-colors">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-surface-900">Faculty Mentor & Student Team Matching</h2>
              <span className="text-2xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                <Sparkles size={11} /> AI Matching Engine
              </span>
            </div>
            <p className="text-xs text-surface-500">
              Match verified problem <span className="font-mono font-bold text-surface-700">{problem.id}</span> with institutional researchers and student teams
            </p>
          </div>
        </div>

        {/* Stepper buttons */}
        <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveStep(1)}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeStep === 1
                ? 'bg-white shadow text-purple-700 font-bold'
                : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-2xs flex items-center justify-center font-bold">
              1
            </span>
            Faculty Mentor
            {selectedFaculty && <Check size={12} className="text-emerald-600" />}
          </button>

          <button
            onClick={() => setActiveStep(2)}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeStep === 2
                ? 'bg-white shadow text-purple-700 font-bold'
                : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-2xs flex items-center justify-center font-bold">
              2
            </span>
            Student Team
            {selectedTeam && <Check size={12} className="text-emerald-600" />}
          </button>

          <button
            onClick={() => setActiveStep(3)}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeStep === 3
                ? 'bg-white shadow text-purple-700 font-bold'
                : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-2xs flex items-center justify-center font-bold">
              3
            </span>
            Review & Assign
          </button>
        </div>
      </div>

      {/* Problem Context Banner */}
      <Card padding="md" className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/40 via-white to-white mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded border border-primary-200">
                {problem.id}
              </span>
              <h3 className="text-base font-bold text-surface-900">{problem.title}</h3>
              <Badge variant="success">
                <ShieldCheck size={12} className="inline mr-1" /> Government Verified
              </Badge>
              <Badge variant="primary">Ready for Faculty & Team Onboarding</Badge>
            </div>

            <p className="text-xs text-surface-600 line-clamp-2 mt-1 mb-2.5">{problem.description}</p>

            <div className="flex items-center gap-4 text-xs text-surface-500 flex-wrap">
              <span className="font-medium text-surface-700">Category: <strong>{problem.category || problem.domain}</strong></span>
              <span>·</span>
              <span className="font-medium text-surface-700">Subcategory: <strong>{problem.subcategory}</strong></span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-surface-400" /> {problem.location || `${problem.district}, Jharkhand`}
              </span>
              <span>·</span>
              <span className="font-bold text-amber-700 uppercase">Priority: {problem.priority}</span>
              <span>·</span>
              <span className="text-surface-500">Affected: <strong>{(problem.affected_people || problem.affectedPopulation || 0).toLocaleString()} citizens</strong></span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-sm text-right shrink-0">
            <p className="text-2xs text-surface-400 font-medium">Assigned University</p>
            <p className="text-sm font-bold text-surface-900">{problem.assigned_university_name || 'BIT Sindri'}</p>
            <p className="text-2xs text-emerald-700 font-semibold mt-0.5">✓ Accepted by University</p>
          </div>
        </div>
      </Card>

      {/* Advisory Notice */}
      <div className="mb-6 p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 flex items-start gap-3">
        <Sparkles size={18} className="text-purple-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-purple-900">AI Recommendations are Advisory:</span>
          <span className="text-purple-700 ml-1">
            Algorithmic match scores are calculated using 8 weighted competency factors. Final mentor assignment and student squad nomination rests with the University Administration.
          </span>
        </div>
      </div>

      {/* STEP 1: FACULTY MATCHING */}
      {activeStep === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
              <span>Recommended Faculty Mentors ({facultyMatches.length})</span>
              <span className="text-2xs text-surface-400 font-normal">Ranked by domain relevance, research areas, and availability</span>
            </h3>
            {selectedFaculty && (
              <Button size="sm" variant="primary" icon={<ArrowRight size={14} />} onClick={() => setActiveStep(2)}>
                Next: Student Teams
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {facultyMatches.map((match) => {
              const f = match.faculty;
              const isSelected = selectedFaculty?.faculty_id === f.faculty_id;
              const isExpanded = expandedFacultyId === f.faculty_id;

              return (
                <Card
                  key={f.faculty_id}
                  padding="md"
                  className={`transition-all border-2 ${
                    isSelected
                      ? 'border-purple-500 shadow-card-md bg-gradient-to-r from-purple-50/30 via-white to-white'
                      : 'border-surface-200 hover:border-purple-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <img
                          src={f.avatar}
                          alt={f.name}
                          className="w-12 h-12 rounded-xl object-cover border border-surface-200"
                        />
                        <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-primary-600 text-white text-2xs font-bold flex items-center justify-center shadow">
                          #{match.rank}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-surface-900">{f.name}</h4>
                          <span className="text-2xs text-surface-500 font-medium">· {f.designation}</span>
                          <span className="text-2xs text-surface-600 bg-surface-100 px-2 py-0.5 rounded font-mono">
                            {f.department}
                          </span>
                          {match.aiRecommendation && (
                            <Badge variant="ai" size="sm">
                              <Sparkles size={10} className="inline mr-1" /> Top Faculty Match
                            </Badge>
                          )}
                          {isSelected && (
                            <Badge variant="success" size="sm">
                              ✓ Selected Mentor
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-surface-600 mt-1 font-medium">
                          Specialization: <span className="text-surface-800">{f.specialization}</span>
                        </p>

                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          {f.expertise.slice(0, 4).map((exp, i) => (
                            <span
                              key={i}
                              className="text-2xs font-medium bg-surface-50 text-surface-600 px-2 py-0.5 rounded border border-surface-200"
                            >
                              ✓ {exp}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 text-2xs text-surface-500 mt-3 flex-wrap">
                          <span>Experience: <strong>{f.years_of_experience} yrs</strong></span>
                          <span>·</span>
                          <span>
                            Active Workload: <strong>{f.current_active_projects} / {f.maximum_active_projects} projects</strong>
                          </span>
                          <span>·</span>
                          <span className="text-emerald-700 font-semibold">● {f.availability_status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Match Score & Action */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200 text-center min-w-[90px]">
                        <span className="text-xl font-black text-purple-700">{match.matchScore}%</span>
                        <p className="text-2xs text-purple-900 font-bold uppercase tracking-wider mt-0.5">Match Score</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpandedFacultyId(isExpanded ? null : f.faculty_id)}
                          icon={isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        >
                          {isExpanded ? 'Hide Factors' : 'Show Factor Breakdown'}
                        </Button>

                        <Button
                          size="sm"
                          variant={isSelected ? 'secondary' : match.aiRecommendation ? 'primary' : 'outline'}
                          onClick={() => handleSelectFaculty(match)}
                          icon={isSelected ? <Check size={14} /> : undefined}
                        >
                          {isSelected
                            ? 'Selected'
                            : match.aiRecommendation
                            ? 'Select Faculty'
                            : 'Override & Select'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Factor Breakdown */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-surface-100 overflow-hidden"
                      >
                        <h5 className="text-xs font-bold text-surface-800 mb-3 flex items-center gap-1.5">
                          <Sparkles size={13} className="text-purple-600" />
                          Algorithmic Competency Breakdown (8 Weighted Factors)
                        </h5>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                          <div className="p-2.5 bg-surface-50 rounded-lg">
                            <span className="text-2xs text-surface-500">Domain Relevance (25%)</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold text-surface-800">{match.factors.domainRelevance}%</span>
                              <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600" style={{ width: `${match.factors.domainRelevance}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-surface-50 rounded-lg">
                            <span className="text-2xs text-surface-500">Research Expertise (20%)</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold text-surface-800">{match.factors.researchExpertise}%</span>
                              <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600" style={{ width: `${match.factors.researchExpertise}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-surface-50 rounded-lg">
                            <span className="text-2xs text-surface-500">Technical Skills (15%)</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold text-surface-800">{match.factors.technicalSkills}%</span>
                              <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600" style={{ width: `${match.factors.technicalSkills}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-surface-50 rounded-lg">
                            <span className="text-2xs text-surface-500">Department Match (10%)</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold text-surface-800">{match.factors.departmentRelevance}%</span>
                              <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600" style={{ width: `${match.factors.departmentRelevance}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-surface-50 rounded-lg">
                            <span className="text-2xs text-surface-500">Experience (10%)</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold text-surface-800">{match.factors.previousExperience}%</span>
                              <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600" style={{ width: `${match.factors.previousExperience}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-surface-50 rounded-lg">
                            <span className="text-2xs text-surface-500">Availability (10%)</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold text-surface-800">{match.factors.availability}%</span>
                              <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600" style={{ width: `${match.factors.availability}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-surface-50 rounded-lg">
                            <span className="text-2xs text-surface-500">Workload Capacity (5%)</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold text-surface-800">{match.factors.currentWorkload}%</span>
                              <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600" style={{ width: `${match.factors.currentWorkload}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-surface-50 rounded-lg">
                            <span className="text-2xs text-surface-500">Preference Match (5%)</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold text-surface-800">{match.factors.projectPreference}%</span>
                              <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600" style={{ width: `${match.factors.projectPreference}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 text-xs text-purple-900">
                          <strong>AI Contextual Assessment: </strong>
                          {match.explanation}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: STUDENT TEAM MATCHING */}
      {activeStep === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                <span>Recommended Student Teams ({teamMatches.length})</span>
                <span className="text-2xs text-surface-400 font-normal">Ranked by technical skills, branch, and prototype capacity</span>
              </h3>
              {selectedFaculty && (
                <p className="text-xs text-purple-700 mt-0.5">
                  Assigned Faculty Mentor: <strong>{selectedFaculty.name}</strong> ({selectedFaculty.department})
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" icon={<ArrowLeft size={14} />} onClick={() => setActiveStep(1)}>
                Back to Faculty
              </Button>
              {selectedTeam && (
                <Button size="sm" variant="primary" icon={<ArrowRight size={14} />} onClick={() => setActiveStep(3)}>
                  Next: Review & Assign
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {teamMatches.map((match) => {
              const t = match.team;
              const isSelected = selectedTeam?.team_id === t.team_id;
              const isExpanded = expandedTeamId === t.team_id;

              return (
                <Card
                  key={t.team_id}
                  padding="md"
                  className={`transition-all border-2 ${
                    isSelected
                      ? 'border-purple-500 shadow-card-md bg-gradient-to-r from-purple-50/30 via-white to-white'
                      : 'border-surface-200 hover:border-purple-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-2xs font-bold flex items-center justify-center shadow">
                          #{match.rank}
                        </span>
                        <h4 className="text-sm font-bold text-surface-900">{t.team_name}</h4>
                        <span className="text-2xs text-surface-500 font-medium">· {t.department} ({t.year})</span>
                        <span className="text-2xs text-surface-600 bg-surface-100 px-2 py-0.5 rounded font-mono">
                          Lead: {t.team_leader_name}
                        </span>
                        {match.aiRecommendation && (
                          <Badge variant="ai" size="sm">
                            <Sparkles size={10} className="inline mr-1" /> Best Fit Team
                          </Badge>
                        )}
                        {isSelected && (
                          <Badge variant="success" size="sm">
                            ✓ Selected Team
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        {t.skills.map((skill, i) => (
                          <span
                            key={i}
                            className="text-2xs font-medium bg-surface-50 text-surface-600 px-2 py-0.5 rounded border border-surface-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-2xs text-surface-500 mt-3 flex-wrap">
                        <span>Members: <strong>{t.team_members.length} students</strong></span>
                        <span>·</span>
                        <span>Completed Innovations: <strong>{t.projects_completed}</strong></span>
                        <span>·</span>
                        <span>Active Projects: <strong>{t.current_active_projects} / {t.maximum_active_projects}</strong></span>
                        <span>·</span>
                        <span className="text-emerald-700 font-semibold">● {t.availability_status}</span>
                      </div>
                    </div>

                    {/* Match Score & Action */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200 text-center min-w-[90px]">
                        <span className="text-xl font-black text-purple-700">{match.matchScore}%</span>
                        <p className="text-2xs text-purple-900 font-bold uppercase tracking-wider mt-0.5">Team Match</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpandedTeamId(isExpanded ? null : t.team_id)}
                          icon={isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        >
                          {isExpanded ? 'Hide Factors' : 'Show Factor Breakdown'}
                        </Button>

                        <Button
                          size="sm"
                          variant={isSelected ? 'secondary' : match.aiRecommendation ? 'primary' : 'outline'}
                          onClick={() => handleSelectTeam(match)}
                          icon={isSelected ? <Check size={14} /> : undefined}
                        >
                          {isSelected ? 'Selected' : match.aiRecommendation ? 'Select Team' : 'Override & Select'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Factor Breakdown */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-surface-100 overflow-hidden"
                      >
                        <h5 className="text-xs font-bold text-surface-800 mb-3 flex items-center gap-1.5">
                          <Sparkles size={13} className="text-purple-600" />
                          Student Team Competency Breakdown (8 Weighted Factors)
                        </h5>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                          <div className="p-2.5 bg-surface-50 rounded-lg">
                            <span className="text-2xs text-surface-500">Tech Skill Match (25%)</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold text-surface-800">{match.factors.technicalSkillMatch}%</span>
                              <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600" style={{ width: `${match.factors.technicalSkillMatch}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-surface-50 rounded-lg">
                            <span className="text-2xs text-surface-500">Domain Expertise (20%)</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold text-surface-800">{match.factors.domainExpertise}%</span>
                              <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600" style={{ width: `${match.factors.domainExpertise}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-surface-50 rounded-lg">
                            <span className="text-2xs text-surface-500">Complexity Fit (15%)</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold text-surface-800">{match.factors.problemComplexityFit}%</span>
                              <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600" style={{ width: `${match.factors.problemComplexityFit}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-surface-50 rounded-lg">
                            <span className="text-2xs text-surface-500">Experience (10%)</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold text-surface-800">{match.factors.previousExperience}%</span>
                              <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600" style={{ width: `${match.factors.previousExperience}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-surface-50 rounded-lg">
                            <span className="text-2xs text-surface-500">Availability (10%)</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold text-surface-800">{match.factors.availability}%</span>
                              <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600" style={{ width: `${match.factors.availability}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-surface-50 rounded-lg">
                            <span className="text-2xs text-surface-500">Workload (5%)</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold text-surface-800">{match.factors.currentWorkload}%</span>
                              <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600" style={{ width: `${match.factors.currentWorkload}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-surface-50 rounded-lg">
                            <span className="text-2xs text-surface-500">Tech Match (10%)</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold text-surface-800">{match.factors.technologyMatch}%</span>
                              <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600" style={{ width: `${match.factors.technologyMatch}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-surface-50 rounded-lg">
                            <span className="text-2xs text-surface-500">Team Capacity (5%)</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold text-surface-800">{match.factors.teamCapacity}%</span>
                              <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600" style={{ width: `${match.factors.teamCapacity}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 text-xs text-purple-900">
                          <strong>AI Assessment: </strong>
                          {match.explanation}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & ASSIGN */}
      {activeStep === 3 && selectedFaculty && selectedTeam && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <Card padding="lg" className="border-2 border-purple-300 shadow-card-md">
            <h3 className="text-base font-bold text-surface-900 mb-1 flex items-center gap-2">
              <UserCheck size={18} className="text-purple-600" />
              Project Assignment Summary
            </h3>
            <p className="text-xs text-surface-500 mb-6">
              Review combined institutional readiness before officially dispatching mentorship and project assignment
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 text-center">
                <span className="text-2xl font-black text-purple-700">{selectedFacultyScore}%</span>
                <p className="text-xs font-bold text-purple-900 uppercase tracking-wide mt-1">Faculty Mentor Match</p>
                <p className="text-2xs text-surface-500 mt-0.5">{selectedFaculty.name}</p>
              </div>

              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 text-center">
                <span className="text-2xl font-black text-purple-700">{selectedTeamScore}%</span>
                <p className="text-xs font-bold text-purple-900 uppercase tracking-wide mt-1">Student Team Match</p>
                <p className="text-2xs text-surface-500 mt-0.5">{selectedTeam.team_name}</p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <span className="text-2xl font-black text-emerald-700">{overallReadiness}%</span>
                <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide mt-1">Project Readiness</p>
                <p className="text-2xs text-emerald-600 mt-0.5">Highly Compatible</p>
              </div>
            </div>

            <div className="space-y-3 text-xs mb-6 divide-y divide-surface-100">
              <div className="flex items-center justify-between pt-2">
                <span className="text-surface-500">Problem ID & Title:</span>
                <span className="font-bold text-surface-900">{problem.id} — {problem.title}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-surface-500">Faculty Mentor:</span>
                <span className="font-bold text-surface-900">{selectedFaculty.name} ({selectedFaculty.designation})</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-surface-500">Department:</span>
                <span className="font-bold text-surface-900">{selectedFaculty.department}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-surface-500">Student Team:</span>
                <span className="font-bold text-surface-900">{selectedTeam.team_name} (Lead: {selectedTeam.team_leader_name})</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-surface-500">Assignment Classification:</span>
                <span className="font-bold text-purple-700">
                  {isOverride ? 'University Override' : 'AI Recommended'}
                </span>
              </div>
            </div>

            {/* If Override, prompt reason */}
            {isOverride && (
              <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <h5 className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-600" />
                  Override AI Recommendation Justification
                </h5>
                <p className="text-2xs text-amber-700 mb-2">
                  You have chosen a faculty mentor different from the #1 recommendation. Please document the institutional rationale:
                </p>
                <input
                  type="text"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Specialized lab facility alignment / Prior field relationship"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-amber-300 bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-surface-200">
              <Button size="sm" variant="outline" onClick={() => setActiveStep(2)}>
                Back to Selection
              </Button>
              <Button
                size="md"
                variant="primary"
                icon={<CheckCircle2 size={16} />}
                onClick={() => setConfirmModalOpen(true)}
              >
                Assign Faculty & Team
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm Project Assignment"
      >
        <div className="space-y-4">
          <p className="text-xs text-surface-600">
            You are about to officially assign Problem <strong>{problem.id}</strong> to:
          </p>

          <div className="p-3 bg-surface-50 rounded-xl border border-surface-200 text-xs space-y-2">
            <div>
              <span className="text-surface-500">Problem:</span>
              <p className="font-bold text-surface-900">{problem.id} — {problem.title}</p>
            </div>
            <div>
              <span className="text-surface-500">Faculty Mentor:</span>
              <p className="font-bold text-purple-700">{selectedFaculty?.name} ({selectedFacultyScore}% Match)</p>
            </div>
            <div>
              <span className="text-surface-500">Student Team:</span>
              <p className="font-bold text-purple-700">{selectedTeam?.team_name} ({selectedTeamScore}% Match)</p>
            </div>
            <div>
              <span className="text-surface-500">Activation Protocol:</span>
              <p className="text-surface-700">
                Assignment invitations will be sent. The project will become <strong>ACTIVE</strong> once both the faculty mentor and student team confirm acceptance.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setConfirmModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={submitting}
              icon={<Check size={14} />}
              onClick={handleConfirmAssignment}
            >
              Confirm Assignment
            </Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
