import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'ai' | 'official' | 'civic' | 'gray';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}

const variantClasses = {
  primary:  'bg-primary-50 text-primary-700 border border-primary-200',
  success:  'bg-success-50 text-success-700 border border-success-100',
  warning:  'bg-warning-50 text-warning-700 border border-warning-100',
  danger:   'bg-danger-50  text-danger-700  border border-danger-100',
  ai:       'bg-ai-50 text-ai-700 border border-ai-200 border-dashed',
  official: 'bg-primary-600 text-white',
  civic:    'bg-civic-600  text-white',
  gray:     'bg-surface-100 text-surface-600 border border-surface-200',
};

const dotColors = {
  primary:  'bg-primary-500',
  success:  'bg-success-500',
  warning:  'bg-warning-500',
  danger:   'bg-danger-500',
  ai:       'bg-ai-500',
  official: 'bg-white',
  civic:    'bg-white',
  gray:     'bg-surface-400',
};

const sizes = {
  sm: 'px-1.5 py-0.5 text-2xs',
  md: 'px-2 py-0.5 text-xs',
};

export function Badge({ variant = 'gray', size = 'md', dot, className, children }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-medium',
      variantClasses[variant],
      sizes[size],
      className,
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}

// Status badge specifically for problem/project statuses
const STATUS_VARIANTS: Record<string, BadgeProps['variant']> = {
  submitted:         'gray',
  ai_analysis:       'ai',
  government_review: 'warning',
  verified:          'success',
  rejected:          'danger',
  duplicate:         'gray',
  matching:          'ai',
  allocated:         'primary',
  in_progress:       'primary',
  testing:           'warning',
  pilot:             'civic',
  deployed:          'success',
  // Project phases
  pending:     'gray',
  completed:   'success',
  overdue:     'danger',
  // Funding
  approved:           'success',
  partially_approved: 'warning',
};

interface StatusBadgeProps {
  status: string;
  label: string;
  dot?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, label, dot = true, size = 'md' }: StatusBadgeProps) {
  const variant = STATUS_VARIANTS[status] ?? 'gray';
  return <Badge variant={variant} dot={dot} size={size}>{label}</Badge>;
}
