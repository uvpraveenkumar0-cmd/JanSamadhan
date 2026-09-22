import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { toastVariants } from '../../config/motion';
import { cn } from '../../lib/utils';
import type { Toast } from '../../context/AppContext';
import { useApp } from '../../context/AppContext';

const icons = {
  success: <CheckCircle2 size={18} className="text-success-500" />,
  error:   <AlertCircle  size={18} className="text-danger-500"  />,
  warning: <AlertTriangle size={18} className="text-warning-500" />,
  info:    <Info          size={18} className="text-primary-500" />,
};

const borders = {
  success: 'border-l-success-500',
  error:   'border-l-danger-500',
  warning: 'border-l-warning-500',
  info:    'border-l-primary-500',
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const duration = toast.duration ?? 4000;

  return (
    <motion.div
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      className={cn(
        'relative flex items-start gap-3 bg-white rounded-lg shadow-card-lg border border-surface-200 p-4',
        'border-l-4 w-80 max-w-[calc(100vw-2rem)]',
        borders[toast.type],
      )}
    >
      <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-surface-900">{toast.title}</p>
        {toast.message && <p className="text-xs text-surface-500 mt-0.5">{toast.message}</p>}
      </div>
      <button onClick={onRemove} className="shrink-0 text-surface-400 hover:text-surface-600 transition-colors">
        <X size={14} />
      </button>
      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg bg-surface-200 overflow-hidden"
      >
        <div
          className={cn('h-full animate-progress-bar', {
            'bg-success-400': toast.type === 'success',
            'bg-danger-400':  toast.type === 'error',
            'bg-warning-400': toast.type === 'warning',
            'bg-primary-400': toast.type === 'info',
          })}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </motion.div>
  );
}

export function ToastManager() {
  const { toasts, removeToast } = useApp();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
