import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000)   return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000)     return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatNumber(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString('en-IN');
}

export const DOMAIN_LABELS: Record<string, string> = {
  water:           'Water Management',
  healthcare:      'Healthcare',
  agriculture:     'Agriculture',
  education:       'Education',
  sanitation:      'Sanitation',
  environment:     'Environment',
  energy:          'Energy',
  livelihoods:     'Rural Livelihoods',
  accessibility:   'Accessibility',
  infrastructure:  'Infrastructure',
  public_services: 'Public Services',
};

export const STATUS_LABELS: Record<string, string> = {
  submitted:         'Submitted',
  ai_analysis:       'AI Analysis',
  government_review: 'Under Review',
  verified:          'Verified',
  rejected:          'Rejected',
  duplicate:         'Duplicate',
  matching:          'Matching',
  allocated:         'Allocated',
  in_progress:       'In Progress',
  testing:           'Testing',
  pilot:             'Pilot',
  deployed:          'Deployed',
};

export const PHASE_LABELS: Record<string, string> = {
  problem_understanding: 'Problem Understanding',
  field_research:        'Field Research',
  requirement_analysis:  'Requirement Analysis',
  solution_design:       'Solution Design',
  prototype:             'Prototype',
  testing:               'Testing',
  pilot:                 'Pilot',
  deployment:            'Deployment',
};
