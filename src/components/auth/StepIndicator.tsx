import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  steps: { title: string; subtitle?: string }[];
  currentStep: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0" />
        <div
          className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 -z-0"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={idx} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                  isCompleted
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : isCurrent
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/60 shadow-md shadow-emerald-500/30'
                    : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span
                className={`text-[11px] mt-1.5 font-medium whitespace-nowrap text-center ${
                  isCurrent
                    ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                    : isCompleted
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
