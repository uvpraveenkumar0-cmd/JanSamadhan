import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, LogOut, ArrowRight, Mail, HelpCircle, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const VerificationRejected: React.FC = () => {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/', { replace: true });
  };

  const rejectionReason =
    user?.rejectionReason ||
    user?.statusReason ||
    'The uploaded verification credentials or institutional affiliation could not be authenticated against the authorized database.';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-red-600 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold">Verification Request Declined</h2>
          <p className="text-rose-100 text-xs mt-1">
            Institutional verification could not be completed for your account.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Reason Card */}
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-semibold text-xs mb-1.5">
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Reviewer Feedback / Grounds for Rejection:</span>
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-300/90 leading-relaxed font-mono bg-white/60 dark:bg-black/20 p-2.5 rounded border border-rose-200/60 dark:border-rose-900/40">
              "{rejectionReason}"
            </p>
          </div>

          {/* Account Snapshot */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-xs space-y-1.5 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">Account:</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Role:</span>
              <span className="uppercase font-mono text-slate-700 dark:text-slate-200">{user?.role}</span>
            </div>
            {user?.organizationName && (
              <div className="flex justify-between">
                <span className="text-slate-400">Organization:</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{user.organizationName}</span>
              </div>
            )}
          </div>

          {/* Corrective Next Steps */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Recommended Corrective Actions
            </h4>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-4">
              <li>Ensure the AISHE code and institutional affiliation document match current UGC/AICTE records.</li>
              <li>Provide an official authorizing letter on official letterhead signed by the Vice Chancellor or Registrar.</li>
              <li>For student/faculty accounts, confirm the provided institutional email address is actively provisioned.</li>
            </ul>
          </div>

          {/* Contact help */}
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-500" />
              <span>Nodal Support Desk:</span>
            </div>
            <a href="mailto:support.jih@jharkhand.gov.in" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              support.jih@jharkhand.gov.in
            </a>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSignOut}
              className="w-full py-2.5 px-4 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Return to Portal / Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
