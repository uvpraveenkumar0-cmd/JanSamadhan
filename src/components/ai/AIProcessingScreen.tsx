// ─── AI Processing Screen Component ──────────────────────────────────────────
// Displays an automated, real-time animated processing sequence while the AI
// analysis engine analyzes citizen problem data.

import React from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Sparkles,
  CheckCircle2,
  Loader2,
  Clock,
  ShieldAlert,
  Search,
  Sliders,
  FileText,
  Tag,
  Layers,
} from 'lucide-react';
import {
  AI_PROCESSING_STAGES,
  type AIProcessingStage,
} from '../../types/aiReportTypes';

interface AIProcessingScreenProps {
  currentStage: AIProcessingStage;
  problemTitle: string;
  problemId?: string;
}

const STAGE_ICONS: Record<AIProcessingStage, React.ElementType> = {
  received: Clock,
  understanding: Brain,
  categorizing: Tag,
  summarizing: FileText,
  checking_duplicates: Search,
  assessing_priority: Sliders,
  verification: ShieldAlert,
};

const STAGE_SUBTEXTS: Record<AIProcessingStage, string> = {
  received: 'Problem record saved and queued for analysis...',
  understanding: 'Extracting key civic issue patterns and semantic context...',
  categorizing: 'Classifying domain, subcategories, and required technical expertise...',
  summarizing: 'Synthesizing concise, executive summary for authorities...',
  checking_duplicates: 'Scanning municipal database for duplicate grievances in the area...',
  assessing_priority: 'Calculating community impact score, affected population & urgency...',
  verification: 'Evaluating evidence quality, location precision & submission completeness...',
};

export const AIProcessingScreen: React.FC<AIProcessingScreenProps> = ({
  currentStage,
  problemTitle,
  problemId,
}) => {
  const currentStageIndex = AI_PROCESSING_STAGES.findIndex((s) => s.key === currentStage);
  const activeIndex = currentStageIndex === -1 ? 0 : currentStageIndex;
  const progressPercent = Math.round(((activeIndex + 1) / AI_PROCESSING_STAGES.length) * 100);

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4 sm:px-6 animate-fade-in">
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-2xl p-6 sm:p-8 mb-8 text-white">
        {/* Decorative background glows */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Animated AI Brain Emblem */}
          <div className="relative mb-6">
            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full blur-md opacity-60 animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-slate-950 border border-indigo-400/50 flex items-center justify-center shadow-inner">
              <Brain className="w-10 h-10 text-cyan-300 animate-bounce" style={{ animationDuration: '2.5s' }} />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/40"
              />
            </div>
            <span className="absolute bottom-0 right-0 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500" />
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold tracking-wide uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            JanSamadhan AI Engine Active
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Analyzing Your Submission
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mb-4">
            Our AI model is performing automated verification, priority scoring, duplicate detection, and domain routing.
          </p>

          {problemId && (
            <div className="text-xs font-mono text-cyan-300/80 bg-slate-900/60 border border-cyan-500/20 px-3 py-1 rounded-md mb-2">
              Reference ID: {problemId}
            </div>
          )}

          <p className="text-sm font-medium text-slate-200 line-clamp-1 italic max-w-lg">
            "{problemTitle}"
          </p>

          {/* Progress bar */}
          <div className="w-full mt-6">
            <div className="flex justify-between items-center text-xs font-medium text-slate-300 mb-1.5">
              <span>Overall Analysis Progress</span>
              <span className="text-cyan-300 font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stage Checklist Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              Automated Analysis Pipeline
            </h3>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Step {activeIndex + 1} of {AI_PROCESSING_STAGES.length}
          </span>
        </div>

        <div className="space-y-3.5">
          {AI_PROCESSING_STAGES.map((stage, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const isPending = idx > activeIndex;
            const Icon = STAGE_ICONS[stage.key] || Sparkles;

            return (
              <motion.div
                key={stage.key}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className={`flex items-start gap-3.5 p-3 rounded-xl transition-colors ${
                  isCurrent
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60'
                    : isCompleted
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/10'
                    : 'opacity-50'
                }`}
              >
                {/* State Indicator */}
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400">
                      <span className="text-xs font-semibold">{idx + 1}</span>
                    </div>
                  )}
                </div>

                {/* Stage Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`w-4 h-4 ${
                        isCompleted
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isCurrent
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        isCurrent
                          ? 'text-indigo-950 dark:text-indigo-200'
                          : isCompleted
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>

                  <p
                    className={`text-xs mt-0.5 ${
                      isCurrent
                        ? 'text-indigo-700 dark:text-indigo-300 font-medium'
                        : isCompleted
                        ? 'text-slate-500 dark:text-slate-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {STAGE_SUBTEXTS[stage.key]}
                  </p>
                </div>

                {/* Status tag */}
                <div className="flex-shrink-0 self-center">
                  {isCompleted && (
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      Done
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                      Processing
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Please wait while the AI model completes the assessment...
          </p>
        </div>
      </div>
    </div>
  );
};
export default AIProcessingScreen;
