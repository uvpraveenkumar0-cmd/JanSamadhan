import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, ArrowRight, RefreshCw, LogOut, ShieldAlert, Building2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { authBackend } from '../../services/authBackend';

export const VerificationPending: React.FC = () => {
  const { user, setUser, logout, addToast } = useApp();
  const navigate = useNavigate();

  const handleRefresh = () => {
    const updated = authBackend.getCurrentUser();
    if (updated) {
      setUser(updated);
      if (updated.status === 'active') {
        addToast({
          type: 'success',
          title: 'Account Verified!',
          message: 'Your registration has been approved. Welcome to the portal.',
        });
        const targetRoute =
          updated.role === 'citizen'
            ? '/citizen'
            : updated.role === 'government' || updated.role === 'government_admin' || updated.role === 'government_officer'
            ? '/government'
            : updated.role === 'university' || updated.role === 'university_admin'
            ? '/university'
            : updated.role === 'faculty'
            ? '/faculty'
            : updated.role === 'student'
            ? '/student'
            : '/industry';
        navigate(targetRoute, { replace: true });
        return;
      }
      addToast({
        type: 'info',
        title: 'Status: Pending',
        message: 'Your documents are still being reviewed by the nodal authority.',
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white text-center relative">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Clock className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-bold">Institutional Verification In Progress</h2>
          <p className="text-amber-100 text-xs mt-1 max-w-md mx-auto">
            Your registration request has been received and is queued for verification by the State Innovation Council.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Account Summary Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Applicant Name</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{user?.name || 'Authorized Official'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Official Email</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{user?.email}</span>
            </div>
            {user?.organizationName && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Institution / Entity</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {user.organizationName}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Portal Role</span>
              <span className="uppercase font-mono font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                {user?.role}
              </span>
            </div>
          </div>

          {/* Timeline steps */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Verification Lifecycle
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-3 p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-lg border border-emerald-200/80 dark:border-emerald-900/40">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-900 dark:text-emerald-300">1. Registration & Documents Submitted</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Affiliation credentials, AISHE code, or institutional ID received.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-lg border border-amber-200/80 dark:border-amber-900/40">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0 animate-spin" />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-300">2. Institutional Record Validation</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">Cross-checking against state department registry & authorized signatory databases.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 opacity-60">
                <div className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center text-[10px] text-slate-500 mt-0.5 flex-shrink-0">3</div>
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">3. Officer Clearance & RBAC Role Assignment</p>
                  <p className="text-[11px] text-slate-500">Official authorization issued by nodal directorate.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 opacity-60">
                <div className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center text-[10px] text-slate-500 mt-0.5 flex-shrink-0">4</div>
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">4. Full Portal Dashboard Activated</p>
                  <p className="text-[11px] text-slate-500">Access to problem matchmaking, projects, funding, and collaboration tools.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Help box */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200">
            <ShieldAlert className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p>
              Standard verification turnaround is <strong>24 to 48 working hours</strong>. If you are presenting a live demonstration, the administrator can approve your account instantly from the Admin Verification Center.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleRefresh}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium text-xs rounded-lg shadow transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check Verification Status</span>
            </button>
            <button
              onClick={handleLogout}
              className="py-2.5 px-4 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
