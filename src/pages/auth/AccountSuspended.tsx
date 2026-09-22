import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban, LogOut, Mail, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AccountSuspended: React.FC = () => {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/', { replace: true });
  };

  const reason = user?.statusReason || 'Administrative suspension imposed following a compliance review.';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3">
            <Ban className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-xl font-bold">Account Access Suspended</h2>
          <p className="text-slate-300 text-xs mt-1">
            Access to the platform for this identity has been temporarily disabled.
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
              <span>Suspension Reason:</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 italic font-mono bg-white dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700">
              "{reason}"
            </p>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            If you believe this administrative restriction was placed in error, you may file an appeal through the Grievance Redressal Cell by providing your registered email and submission details.
          </div>

          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Mail className="w-4 h-4 text-slate-500" />
              <span>Appeals Desk:</span>
            </div>
            <a href="mailto:grievance.jih@jharkhand.gov.in" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              grievance.jih@jharkhand.gov.in
            </a>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full py-2.5 px-4 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
