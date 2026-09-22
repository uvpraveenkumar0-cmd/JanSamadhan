import React from 'react';
import { ShieldCheck, Clock, AlertTriangle, Ban } from 'lucide-react';
import type { UserStatus } from '../../types';

interface VerificationBadgeProps {
  status?: UserStatus | 'pending' | 'approved' | 'rejected' | 'info_requested';
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status,
  isVerified,
  size = 'md',
  showLabel = true,
}) => {
  // Normalize
  const normalizedStatus = status === 'approved' ? 'active' : status || (isVerified ? 'active' : 'pending_verification');

  if (normalizedStatus === 'active' || isVerified) {
    return (
      <span
        title="Verified Institutional / Citizen Identity"
        className={`inline-flex items-center gap-1 font-medium rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 ${
          size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5'
        }`}
      >
        <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        {showLabel && <span>Verified</span>}
      </span>
    );
  }

  if (normalizedStatus === 'pending_verification' || normalizedStatus === 'pending' || normalizedStatus === 'info_requested') {
    return (
      <span
        title="Institutional Verification Under Review"
        className={`inline-flex items-center gap-1 font-medium rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 ${
          size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5'
        }`}
      >
        <Clock className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        {showLabel && <span>Pending Verification</span>}
      </span>
    );
  }

  if (normalizedStatus === 'rejected') {
    return (
      <span
        title="Verification Application Rejected"
        className={`inline-flex items-center gap-1 font-medium rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 ${
          size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5'
        }`}
      >
        <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        {showLabel && <span>Rejected</span>}
      </span>
    );
  }

  if (normalizedStatus === 'suspended') {
    return (
      <span
        title="Account Suspended by Administrator"
        className={`inline-flex items-center gap-1 font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 ${
          size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5'
        }`}
      >
        <Ban className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        {showLabel && <span>Suspended</span>}
      </span>
    );
  }

  return null;
};
