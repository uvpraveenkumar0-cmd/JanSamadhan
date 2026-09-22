import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const score = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  let label = 'Weak';
  let color = 'bg-rose-500';
  let textColor = 'text-rose-600 dark:text-rose-400';

  if (score >= 4) {
    label = 'Strong';
    color = 'bg-emerald-500';
    textColor = 'text-emerald-600 dark:text-emerald-400';
  } else if (score >= 3) {
    label = 'Good';
    color = 'bg-teal-500';
    textColor = 'text-teal-600 dark:text-teal-400';
  } else if (score >= 2) {
    label = 'Fair';
    color = 'bg-amber-500';
    textColor = 'text-amber-600 dark:text-amber-400';
  }

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">Password strength:</span>
        <span className={`font-medium ${textColor}`}>{label}</span>
      </div>

      {/* Strength Bar */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        <div className={`h-full rounded-full transition-all ${score >= 1 ? color : 'bg-slate-200 dark:bg-slate-700'}`} />
        <div className={`h-full rounded-full transition-all ${score >= 2 ? color : 'bg-slate-200 dark:bg-slate-700'}`} />
        <div className={`h-full rounded-full transition-all ${score >= 3 ? color : 'bg-slate-200 dark:bg-slate-700'}`} />
        <div className={`h-full rounded-full transition-all ${score >= 4 ? color : 'bg-slate-200 dark:bg-slate-700'}`} />
      </div>

      {/* Rules list */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-1">
        <div className={`flex items-center gap-1 ${hasLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
          {hasLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          <span>At least 8 characters</span>
        </div>
        <div className={`flex items-center gap-1 ${hasUpper && hasLower ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
          {hasUpper && hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          <span>Upper & lowercase</span>
        </div>
        <div className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
          {hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          <span>At least 1 number</span>
        </div>
        <div className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
          {hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          <span>Special character</span>
        </div>
      </div>
    </div>
  );
};
