import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'civic';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const variants = {
  primary:   'bg-primary-600 text-white hover:bg-primary-700 shadow-sm',
  secondary: 'bg-surface-100 text-surface-700 hover:bg-surface-200 border border-surface-200',
  outline:   'border border-primary-300 text-primary-700 hover:bg-primary-50',
  ghost:     'text-surface-600 hover:bg-surface-100',
  danger:    'bg-danger-600 text-white hover:bg-danger-700',
  civic:     'bg-civic-600 text-white hover:bg-civic-700 shadow-sm',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, iconPosition = 'left', className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium',
          'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'active:scale-[0.97]',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
        {!loading && icon && iconPosition === 'left' && icon}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    );
  }
);
Button.displayName = 'Button';
