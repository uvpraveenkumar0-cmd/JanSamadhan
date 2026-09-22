import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { backdropVariants, modalVariants, drawerVariants } from '../../config/motion';
import { cn } from '../../lib/utils';

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const modalSizes = {
  sm:  'max-w-sm',
  md:  'max-w-lg',
  lg:  'max-w-2xl',
  xl:  'max-w-4xl',
};

export function Modal({ open, onClose, title, description, children, size = 'md', className }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else       document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            variants={backdropVariants}
            initial="initial" animate="animate" exit="exit"
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                variants={modalVariants}
                initial="initial" animate="animate" exit="exit"
                className={cn(
                  'relative w-full bg-white rounded-2xl shadow-card-lg border border-surface-200',
                  modalSizes[size],
                  className,
                )}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
              >
                {(title || description) && (
                  <div className="flex items-start justify-between p-5 sm:p-6 border-b border-surface-100">
                    <div>
                      {title && <h2 id="modal-title" className="text-lg font-semibold text-surface-900">{title}</h2>}
                      {description && <p className="text-sm text-surface-500 mt-0.5">{description}</p>}
                    </div>
                    <button onClick={onClose} className="ml-4 p-1 text-surface-400 hover:text-surface-600 rounded-md hover:bg-surface-100 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                )}
                <div className="p-5 sm:p-6">{children}</div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: 'left' | 'right';
  width?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const drawerWidths = {
  sm:  'w-80',
  md:  'w-[480px]',
  lg:  'w-[640px]',
};

export function Drawer({ open, onClose, title, side = 'right', width = 'md', children }: DrawerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else       document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            variants={backdropVariants}
            initial="initial" animate="animate" exit="exit"
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={drawerVariants(side)}
            initial="initial" animate="animate" exit="exit"
            className={cn(
              'fixed top-0 bottom-0 z-50 bg-white shadow-2xl flex flex-col',
              drawerWidths[width],
              side === 'right' ? 'right-0' : 'left-0',
              'max-w-[100vw]',
            )}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 shrink-0">
                <h2 className="text-base font-semibold text-surface-900">{title}</h2>
                <button onClick={onClose} className="p-1 text-surface-400 hover:text-surface-600 rounded-md hover:bg-surface-100 transition-colors">
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = 'Confirm', confirmVariant = 'primary', loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center">
        <div className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4',
          confirmVariant === 'danger' ? 'bg-danger-50' : 'bg-primary-50',
        )}>
          <span className={cn('text-xl', confirmVariant === 'danger' ? 'text-danger-600' : 'text-primary-600')}>?</span>
        </div>
        <h3 className="text-base font-semibold text-surface-900 mb-2">{title}</h3>
        {description && <p className="text-sm text-surface-500 mb-6">{description}</p>}
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-150 active:scale-[0.97]',
              confirmVariant === 'danger' ? 'bg-danger-600 hover:bg-danger-700' : 'bg-primary-600 hover:bg-primary-700',
              loading && 'opacity-50 cursor-not-allowed',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
