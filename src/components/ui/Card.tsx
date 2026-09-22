import React from 'react';
import { cn } from '../../lib/utils';

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = {
  none: '',
  sm:   'p-3',
  md:   'p-4 sm:p-5',
  lg:   'p-5 sm:p-6',
};

export function Card({ hover, padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-surface-200 shadow-card',
        hover && 'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer',
        paddings[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('skeleton rounded-lg', className)} />
  );
}

export function SkeletonCard({ lines = 3 }: SkeletonProps) {
  return (
    <Card>
      <Skeleton className="h-5 w-2/3 mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5 mb-2', i === lines - 1 ? 'w-1/2' : 'w-full')} />
      ))}
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-20" />
      </div>
    </Card>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-surface-200">
        {[3, 2, 1, 1, 1].map((w, i) => (
          <Skeleton key={i} className={`h-3 flex-${w}`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-surface-100">
          {[3, 2, 1, 1, 1].map((w, j) => (
            <Skeleton key={j} className={`h-3.5 flex-${w}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="mb-4 text-surface-300">{icon}</div>}
      <h3 className="text-base font-semibold text-surface-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-surface-500 max-w-sm mb-4">{description}</p>}
      {action && action}
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-danger-50 flex items-center justify-center mb-4">
        <span className="text-danger-500 text-xl">!</span>
      </div>
      <h3 className="text-base font-semibold text-surface-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-surface-500 max-w-sm mb-4">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-primary-600 font-medium hover:text-primary-700 underline underline-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-surface-200', className)} />;
}

// ─── Section Header ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
      <div>
        <h2 className="text-lg font-semibold text-surface-900">{title}</h2>
        {subtitle && <p className="text-sm text-surface-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: number;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'teal';
  suffix?: string;
}

const colorMap = {
  blue:   { bg: 'bg-primary-50', icon: 'text-primary-600', text: 'text-primary-600' },
  green:  { bg: 'bg-success-50', icon: 'text-success-600', text: 'text-success-600' },
  yellow: { bg: 'bg-warning-50', icon: 'text-warning-600', text: 'text-warning-600' },
  red:    { bg: 'bg-danger-50',  icon: 'text-danger-600',  text: 'text-danger-600'  },
  purple: { bg: 'bg-ai-50',      icon: 'text-ai-600',      text: 'text-ai-600'      },
  teal:   { bg: 'bg-civic-50',   icon: 'text-civic-600',   text: 'text-civic-600'   },
};

export function StatCard({ label, value, icon, trend, color = 'blue', suffix }: StatCardProps) {
  const c = colorMap[color];
  return (
    <Card padding="md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-surface-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">
            {value}{suffix && <span className="text-base font-semibold text-surface-500 ml-0.5">{suffix}</span>}
          </p>
          {trend !== undefined && (
            <p className={cn('text-xs mt-1 font-medium', trend >= 0 ? 'text-success-600' : 'text-danger-600')}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('p-2.5 rounded-lg', c.bg)}>
            <span className={c.icon}>{icon}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
