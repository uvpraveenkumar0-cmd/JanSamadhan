// ─── Citizen AI Experience Component ────────────────────────────────────────
// Warm, transparent, citizen-facing interactive AI assistant experience shown
// after a citizen submits a grievance.
// Replaces technical diagnostic dashboards with a helpful, understandable civic assistant.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Building2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Info,
  HelpCircle,
  Tag,
  Search,
  Droplets,
  Sprout,
  HeartPulse,
  GraduationCap,
  HardHat,
  Trees,
  Zap,
  ShieldAlert,
  Laptop,
  CheckCheck,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import type { AIReport } from '../../types/aiReportTypes';

interface CitizenAIExperienceProps {
  report: AIReport;
  onTrackStatus?: () => void;
  onViewMyProblems?: () => void;
  onViewSimilarProblem?: (problemId: string) => void;
}

// Domain icon helper
function getDomainIcon(domain: string): React.ElementType {
  switch (domain.toLowerCase()) {
    case 'water':
      return Droplets;
    case 'agriculture':
      return Sprout;
    case 'health':
      return HeartPulse;
    case 'education':
      return GraduationCap;
    case 'infrastructure':
      return HardHat;
    case 'environment':
      return Trees;
    case 'energy':
      return Zap;
    case 'safety':
      return ShieldAlert;
    case 'digital':
      return Laptop;
    default:
      return Tag;
  }
}

export const CitizenAIExperience: React.FC<CitizenAIExperienceProps> = ({
  report,
  onTrackStatus,
  onViewMyProblems,
  onViewSimilarProblem,
}) => {
  const {
    summary,
    classification,
    verification,
    completeness,
    priority,
    duplicateDetection,
    aiExplanation,
    problemId,
  } = report;

  // Interactive UI states
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showFullSummary, setShowFullSummary] = useState(false);
  const [selectedProcessStep, setSelectedProcessStep] = useState<number>(0);
  const [showConfidenceWhy, setShowConfidenceWhy] = useState(false);
  const [showTransparencyHow, setShowTransparencyHow] = useState(false);
  const [showPriorityWhy, setShowPriorityWhy] = useState(false);

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const DomainIcon = getDomainIcon(classification.domain);

  // Friendly confidence label helper
  const getConfidenceInfo = () => {
    const score = verification.confidence || 85;
    if (score >= 80) {
      return {
        label: 'High confidence',
        color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
        text: 'The complaint contains a clear description, location and supporting details, allowing the AI to interpret the issue with high confidence.',
      };
    } else if (score >= 60) {
      return {
        label: 'Good confidence',
        color: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
        text: 'The AI identified the primary civic domain and requirements, though additional field verification by officials will confirm the specifics.',
      };
    }
    return {
      label: 'Preliminary understanding',
      color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      text: 'Basic issue patterns were recognized; government officials will review the details to ensure proper departmental dispatch.',
    };
  };

  const confInfo = getConfidenceInfo();

  // Priority visual styling helper
  const getPriorityDisplay = () => {
    switch (priority.level) {
      case 'CRITICAL':
        return {
          label: 'Critical Priority',
          color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800',
          dot: 'bg-rose-500',
          subtext: 'Potential high impact on community safety or health',
        };
      case 'HIGH':
        return {
          label: 'High Priority',
          color: 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800',
          dot: 'bg-orange-500',
          subtext: 'Time-sensitive issue affecting multiple community members',
        };
      case 'MEDIUM':
        return {
          label: 'Medium Priority',
          color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
          dot: 'bg-blue-500',
          subtext: 'Community infrastructure or routine civic maintenance',
        };
      case 'LOW':
      default:
        return {
          label: 'Standard Priority',
          color: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          dot: 'bg-slate-500',
          subtext: 'General civic request or localized inquiry',
        };
    }
  };

  const priDisplay = getPriorityDisplay();

  // Process timeline steps
  const processSteps = [
    {
      title: 'Understood',
      summary: 'Interpreted your complaint description and location context.',
      detail: `The AI processed your report regarding "${classification.subcategory}". Core civic signals were extracted without requiring manual categorization.`,
    },
    {
      title: 'Categorized',
      summary: `${classification.domainLabel} → ${classification.subcategory}`,
      detail: `Key civic terms extracted (${classification.keywords.slice(0, 4).join(', ')}) matched the ${classification.domainLabel} domain.`,
    },
    {
      title: 'Prioritized',
      summary: `${priDisplay.label} based on urgency and community impact.`,
      detail: priority.reason || 'Calculated from reported severity, affected population, and time-sensitivity factors.',
    },
    {
      title: 'Checked Similar Reports',
      summary: duplicateDetection.similarProblems.length > 0
        ? `${duplicateDetection.similarProblems.length} related complaints found nearby`
        : 'No similar complaints found in your area.',
      detail: duplicateDetection.explanation || 'Compared against existing municipal grievance records in this district.',
    },
    {
      title: 'Summarized',
      summary: 'Created a short executive briefing for administrative officers.',
      detail: 'Generated a concise 2-sentence summary so government reviewers can quickly understand and triage the issue.',
    },
    {
      title: 'Suggested Department',
      summary: classification.suggestedDepartment || `${classification.domainLabel} Department`,
      detail: 'Suggested the appropriate government department to expedite review and resolution.',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 text-slate-800 dark:text-slate-100 font-sans pb-10">

      {/* ── 1. Top Citizen Status Banner ───────────────────────────────────── */}
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <CheckCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  🎉 Complaint successfully submitted
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/50">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  AI analysis completed
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl">
                Your complaint has been successfully recorded and is now ready for government review.
              </p>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-emerald-200 dark:border-emerald-800">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              Tracking ID
            </span>
            <span className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-700 shadow-xs">
              {problemId}
            </span>
          </div>
        </div>

        {/* Action button in header */}
        <div className="mt-5 pt-4 border-t border-emerald-100 dark:border-emerald-900/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Analyzed automatically in seconds</span>
          </div>
          <div className="flex items-center gap-2">
            {onViewMyProblems && (
              <button
                type="button"
                onClick={onViewMyProblems}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Go to Dashboard
              </button>
            )}
            {onTrackStatus && (
              <button
                type="button"
                onClick={onTrackStatus}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <span>Track Complaint</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. "AI understood your complaint" Overview Card ─────────────────── */}
      <div className="rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 p-6 shadow-sm">
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              ✨ AI understood your complaint
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              Here’s how our AI understood and organized your grievance to help the right department review it.
            </p>
          </div>
        </div>

        {/* 4 Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-900/60 shadow-2xs">
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Problem understood
            </span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-900/60 shadow-2xs">
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Category identified
            </span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-900/60 shadow-2xs">
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Priority assessed
            </span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-900/60 shadow-2xs">
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Similar complaints checked
            </span>
          </div>
        </div>

        {/* Natural Confidence Sub-pill */}
        <div className="mt-4 pt-3 border-t border-indigo-100/80 dark:border-indigo-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">AI understanding:</span>
            <span className={`px-2.5 py-0.5 rounded-full font-semibold border ${confInfo.color}`}>
              {confInfo.label}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowConfidenceWhy(!showConfidenceWhy)}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Why?</span>
            {showConfidenceWhy ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expandable "Why confidence?" */}
        <AnimatePresence>
          {showConfidenceWhy && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-indigo-100 dark:border-indigo-900 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>{confInfo.text}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Confidence indicates how clearly the submitted details match known civic issue criteria. Final decisions rest with government officers.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 3. "What did the AI find?" Interactive Cards ─────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              What did the AI find?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click on any card to see how the AI interpreted your grievance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Card 1: Category */}
          <div
            onClick={() => toggleCard('category')}
            className={`cursor-pointer rounded-2xl border transition-all p-5 shadow-2xs ${
              expandedCard === 'category'
                ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <DomainIcon className="w-5 h-5" />
              </div>
              <div className="text-slate-400">
                {expandedCard === 'category' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            <div className="mt-3">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                Category
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {classification.domainLabel}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {classification.subcategory}
              </p>
            </div>

            <AnimatePresence>
              {expandedCard === 'category' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    <p>
                      Your complaint is mainly related to{' '}
                      <strong>{classification.domainLabel}</strong> — specifically{' '}
                      <strong>{classification.subcategory}</strong>.
                    </p>
                    {classification.keywords.length > 0 && (
                      <div>
                        <span className="text-[11px] text-slate-400 font-semibold block mb-1">
                          Key signals identified:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {classification.keywords.map((kw, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Card 2: Priority */}
          <div
            onClick={() => toggleCard('priority')}
            className={`cursor-pointer rounded-2xl border transition-all p-5 shadow-2xs ${
              expandedCard === 'priority'
                ? 'border-orange-300 dark:border-orange-700 bg-orange-50/40 dark:bg-orange-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-slate-400">
                {expandedCard === 'priority' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            <div className="mt-3">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                Priority
              </span>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {priDisplay.label}
                </h4>
                <span className={`w-2.5 h-2.5 rounded-full ${priDisplay.dot}`} />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1">
                {priDisplay.subtext}
              </p>
            </div>

            <AnimatePresence>
              {expandedCard === 'priority' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    <p>
                      AI marked this as <strong>{priority.level} priority</strong> because the problem may affect multiple residents and prompt action prevents further community hardship.
                    </p>
                    <p className="text-[11px] text-slate-400 italic">
                      Priority helps administrative officials address emergency and life-safety issues before general inquiries.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Card 3: Similar Complaints */}
          <div
            onClick={() => toggleCard('similar')}
            className={`cursor-pointer rounded-2xl border transition-all p-5 shadow-2xs ${
              expandedCard === 'similar'
                ? 'border-purple-300 dark:border-purple-700 bg-purple-50/40 dark:bg-purple-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="text-slate-400">
                {expandedCard === 'similar' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            <div className="mt-3">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                Similar complaints
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {duplicateDetection.similarProblems.length > 0
                  ? `${duplicateDetection.similarProblems.length} similar reports found`
                  : 'No similar complaints found'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {duplicateDetection.similarProblems.length > 0
                  ? 'Nearby community complaints in this area'
                  : 'Your submission appears unique'}
              </p>
            </div>

            <AnimatePresence>
              {expandedCard === 'similar' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    {duplicateDetection.similarProblems.length > 0 ? (
                      <div>
                        <p className="mb-2">
                          The system found related reports in your area. These may stem from the same underlying civic challenge:
                        </p>
                        <div className="space-y-1.5">
                          {duplicateDetection.similarProblems.map((sim) => (
                            <div
                              key={sim.id}
                              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                            >
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                                {sim.title}
                              </span>
                              {onViewSimilarProblem && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewSimilarProblem(sim.id);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                >
                                  <span>View</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p>
                        The system checked existing registered complaints in your district. No identical issue was found, so your report is processed as a distinct new grievance.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Card 4: Information Check */}
          <div
            onClick={() => toggleCard('info')}
            className={`cursor-pointer rounded-2xl border transition-all p-5 shadow-2xs ${
              expandedCard === 'info'
                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="text-slate-400">
                {expandedCard === 'info' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            <div className="mt-3">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                Information check
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {completeness.score >= 70 ? 'Ready for review' : 'Adequate for triage'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Your complaint contains the required details.
              </p>
            </div>

            <AnimatePresence>
              {expandedCard === 'info' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                      Information successfully provided:
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      {completeness.providedFields.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                          <Check className="w-3 h-3 flex-shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Card 5: Responsible Department (Full width card) */}
        <div
          onClick={() => toggleCard('dept')}
          className={`cursor-pointer rounded-2xl border transition-all p-5 shadow-2xs ${
            expandedCard === 'dept'
              ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50/40 dark:bg-cyan-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block">
                  Suggested department
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {classification.suggestedDepartment || `${classification.domainLabel} Department`}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Suggested by AI based on your complaint.
                </p>
              </div>
            </div>

            <div className="text-slate-400 mt-1">
              {expandedCard === 'dept' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          <AnimatePresence>
            {expandedCard === 'dept' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <p>
                    The AI matched this grievance to the{' '}
                    <strong>{classification.suggestedDepartment || classification.domainLabel}</strong>{' '}
                    because it falls under the civic scope of {classification.subcategory}.
                  </p>
                  <p className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                    🏛 AI suggestions are reviewed and confirmed by authorized government officers before departmental assignment.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── 4. "In simple words" AI Summary ─────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🤖</span>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            In simple words
          </h3>
        </div>

        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
          {summary}
        </p>

        {aiExplanation && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowFullSummary(!showFullSummary)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>{showFullSummary ? 'Show less' : 'Show detailed explanation'}</span>
              {showFullSummary ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <AnimatePresence>
              {showFullSummary && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
                    <p>{aiExplanation}</p>
                    {report.recommendedAction && (
                      <p className="font-medium text-indigo-900 dark:text-indigo-200">
                        Recommended next step: {report.recommendedAction}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── 5. "Why this priority?" Interaction ─────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Why was this marked {priority.level} Priority?
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowPriorityWhy(!showPriorityWhy)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>{showPriorityWhy ? 'Hide factors' : 'See explanation'}</span>
            {showPriorityWhy ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300">
          {priority.reason}
        </p>

        {/* Priority factors breakdown */}
        <AnimatePresence>
          {showPriorityWhy && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Contributing Civic Factors:
                </span>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300">Potential community impact</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">Significant</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: priority.level === 'CRITICAL' ? '95%' : priority.level === 'HIGH' ? '80%' : '55%' }} />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-600 dark:text-slate-300">Urgency & time sensitivity</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {priority.level === 'CRITICAL' ? 'Immediate' : 'High'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: priority.level === 'CRITICAL' ? '90%' : '75%' }} />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-600 dark:text-slate-300">Affected community members</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">Multiple households</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: '70%' }} />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 pt-2 italic">
                  AI assessment — subject to government review and physical ground verification.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 6. "How AI processed your complaint" Interactive Timeline ───────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🧠</span>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            How AI analyzed your complaint
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Click any step to see the transparent rationale behind the automated analysis.
        </p>

        {/* Steps buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {processSteps.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedProcessStep(idx)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedProcessStep === idx
                  ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">
                  0{idx + 1}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                {s.title}
              </div>
            </button>
          ))}
        </div>

        {/* Selected Step Detail Box */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1">
            <span className="text-indigo-600 dark:text-indigo-400">Step {selectedProcessStep + 1}:</span>
            <span>{processSteps[selectedProcessStep].title}</span>
          </div>
          <p className="leading-relaxed">
            {processSteps[selectedProcessStep].detail}
          </p>
        </div>
      </div>

      {/* ── 7. "What happens next?" Roadmap ─────────────────────────────────── */}
      <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/30 via-white to-white dark:from-slate-900 dark:to-slate-900 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">📍</span>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            What happens next?
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Follow the step-by-step progress of your complaint as it moves through official channels.
        </p>

        {/* Progress Timeline */}
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Complaint submitted
              </div>
              <p className="text-[11px] text-slate-500">
                Your grievance was recorded into the official state database.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                AI analysis completed
              </div>
              <p className="text-[11px] text-slate-500">
                Issue categorized, prioritized, and summarized for officials.
              </p>
            </div>
          </div>

          {/* Step 3 (CURRENT) */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-sm animate-pulse">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Government review
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                  CURRENT STAGE
                </span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5 font-medium">
                Your complaint is ready for government review and departmental triage.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-3 opacity-60">
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center flex-shrink-0 text-xs text-slate-400">
              4
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Department assignment
              </div>
              <p className="text-[11px] text-slate-500">
                Official dispatch to {classification.suggestedDepartment || 'responsible department'}.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex items-start gap-3 opacity-60">
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center flex-shrink-0 text-xs text-slate-400">
              5
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Action / Ground response
              </div>
              <p className="text-[11px] text-slate-500">
                Executive engineers and field officers deploy mitigation measures.
              </p>
            </div>
          </div>

          {/* Step 6 */}
          <div className="flex items-start gap-3 opacity-60">
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center flex-shrink-0 text-xs text-slate-400">
              6
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Citizen update & closure
              </div>
              <p className="text-[11px] text-slate-500">
                You will receive status updates and resolution confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 8. "How was this analysis generated?" Transparency FAQ ──────────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <button
          type="button"
          onClick={() => setShowTransparencyHow(!showTransparencyHow)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
              🔍 How was this analysis generated?
            </h4>
          </div>
          <div className="text-slate-400">
            {showTransparencyHow ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        <AnimatePresence>
          {showTransparencyHow && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
                <p>
                  The AI analyzed the information you submitted, including the problem description, location, affected population and supporting evidence. It uses these details to categorize, prioritize, summarize and identify potentially similar complaints.
                </p>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-200">
                  ⚠️ <strong>Important:</strong> AI does not make the final government decision. Authorized officials review the complaint and determine the appropriate action.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 9. Bottom Navigation Actions ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        {onViewMyProblems && (
          <button
            type="button"
            onClick={onViewMyProblems}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition-colors shadow-xs"
          >
            Go to My Problems
          </button>
        )}
        {onTrackStatus && (
          <button
            type="button"
            onClick={onTrackStatus}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <span>Track Complaint Status</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  );
};
export default CitizenAIExperience;
