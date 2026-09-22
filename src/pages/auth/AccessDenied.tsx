import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AccessDenied: React.FC = () => {
  const { user } = useApp();
  const navigate = useNavigate();

  const getHomePortal = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'citizen':
        return '/citizen';
      case 'government':
      case 'government_admin':
      case 'government_officer':
        return '/government';
      case 'university':
      case 'university_admin':
        return '/university';
      case 'faculty':
        return '/faculty';
      case 'student':
        return '/student';
      case 'industry':
      case 'industry_admin':
      case 'industry_mentor':
        return '/industry';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center space-y-5">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShieldX className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">403 – Access Denied</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            You do not have administrative privileges or portal permissions to view this resource.
          </p>
        </div>

        {user && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg text-xs space-y-1 text-left border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">Authenticated As:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Role:</span>
              <span className="uppercase font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{user.role}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-2.5 px-4 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
          <button
            onClick={() => navigate(getHomePortal(), { replace: true })}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow"
          >
            <Home className="w-3.5 h-3.5" />
            <span>My Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
