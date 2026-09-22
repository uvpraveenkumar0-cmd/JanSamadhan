import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '../../lib/utils';

// ─── Animated Progress Bar ────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number; // 0–100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'ai' | 'civic';
  showLabel?: boolean;
  label?: string;
  animate?: boolean;
  className?: string;
}

const colorClasses = {
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger:  'bg-danger-500',
  ai:      'bg-ai-500',
  civic:   'bg-civic-500',
};

const trackColors = {
  primary: 'bg-primary-100',
  success: 'bg-success-100',
  warning: 'bg-warning-100',
  danger:  'bg-danger-100',
  ai:      'bg-ai-100',
  civic:   'bg-civic-100',
};

const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' };

export function ProgressBar({
  value, max = 100, size = 'md', color = 'primary',
  showLabel, label, animate = true, className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div className={cn('w-full', className)} ref={ref}>
      {(showLabel || label) && (
        <div className="flex justify-between text-xs text-surface-600 mb-1.5">
          <span>{label}</span>
          <span className="font-medium">{Math.round(pct)}%</span>
        </div>
      )}
      <div className={cn('w-full rounded-full overflow-hidden', trackColors[color], heights[size])}>
        <motion.div
          className={cn('h-full rounded-full', colorClasses[color])}
          initial={{ width: 0 }}
          animate={{ width: animate && inView ? `${pct}%` : animate ? 0 : `${pct}%` }}
          transition={{ duration: 0.8, ease: [0, 0, 0.2, 1], delay: 0.1 }}
        />
      </div>
    </div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  triggerOnce?: boolean;
}

export function AnimatedCounter({
  value, suffix = '', prefix = '', decimals = 0,
  duration = 1.5, className, triggerOnce = true,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: triggerOnce });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', v => {
      setDisplay(v.toFixed(decimals));
    });
    return unsubscribe;
  }, [springValue, decimals]);

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  );
}

// ─── Progress Ring (donut) ────────────────────────────────────────────────────

interface ProgressRingProps {
  value: number; // 0–100
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  value, size = 80, strokeWidth = 8, color = '#3b82f6', className, children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ref = useRef<SVGCircleElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true });

  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <motion.circle
          ref={ref}
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: inView ? strokeDashoffset : circumference }}
          transition={{ duration: 1, ease: [0, 0, 0.2, 1] }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
