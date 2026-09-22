// Shared motion configuration — single source of truth for all animations
// Import this in every component that uses Framer Motion

export const MOTION = {
  // Durations (seconds)
  duration: {
    instant: 0.1,
    fast:    0.15,
    normal:  0.2,
    medium:  0.3,
    slow:    0.4,
    reveal:  0.6,
  },

  // Easing curves
  ease: {
    standard:   [0.4, 0, 0.2, 1]  as const,
    decelerate: [0, 0, 0.2, 1]    as const,
    accelerate: [0.4, 0, 1, 1]    as const,
    sharp:      [0.4, 0, 0.6, 1]  as const,
    spring:     { type: 'spring', stiffness: 400, damping: 30 },
    springFast: { type: 'spring', stiffness: 600, damping: 35 },
  },

  // Stagger
  stagger: {
    xs:   0.04,
    sm:   0.06,
    md:   0.08,
    lg:   0.12,
  },

  // Slide offset
  slide: {
    sm:  8,
    md:  12,
    lg:  20,
  },
} as const;

// Page transition variant (used by PageTransition wrapper)
export const pageVariants = {
  initial: { opacity: 0, y: MOTION.slide.md },
  animate: { opacity: 1, y: 0,
    transition: { duration: MOTION.duration.normal, ease: MOTION.ease.decelerate }
  },
  exit: { opacity: 0, y: -MOTION.slide.sm,
    transition: { duration: MOTION.duration.fast, ease: MOTION.ease.accelerate }
  },
};

// Card/list item variants (use with staggerChildren)
export const cardVariants = {
  initial: { opacity: 0, y: MOTION.slide.sm },
  animate: { opacity: 1, y: 0,
    transition: { duration: MOTION.duration.normal, ease: MOTION.ease.decelerate }
  },
};

export const containerVariants = (stagger: number = MOTION.stagger.md) => ({
  initial: {},
  animate: { transition: { staggerChildren: stagger } },
});

// Modal/dialog variant
export const modalVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1,
    transition: { duration: MOTION.duration.normal, ease: MOTION.ease.decelerate }
  },
  exit: { opacity: 0, scale: 0.95,
    transition: { duration: MOTION.duration.fast, ease: MOTION.ease.accelerate }
  },
};

// Drawer variants
export const drawerVariants = (side: 'left' | 'right' | 'bottom' = 'right') => {
  const map = {
    right:  { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } },
    left:   { initial: { x: '-100%'}, animate: { x: 0 }, exit: { x: '-100%'} },
    bottom: { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } },
  };
  const v = map[side];
  return {
    initial: { ...v.initial, opacity: 0 },
    animate: { ...v.animate, opacity: 1,
      transition: { duration: MOTION.duration.medium, ease: MOTION.ease.decelerate }
    },
    exit: { ...v.exit, opacity: 0,
      transition: { duration: MOTION.duration.fast, ease: MOTION.ease.accelerate }
    },
  };
};

// Toast variant
export const toastVariants = {
  initial: { opacity: 0, x: 60, scale: 0.9 },
  animate: { opacity: 1, x: 0,  scale: 1,
    transition: { duration: MOTION.duration.normal, ease: MOTION.ease.decelerate }
  },
  exit: { opacity: 0, x: 60, scale: 0.9,
    transition: { duration: MOTION.duration.fast, ease: MOTION.ease.accelerate }
  },
};

// Fade in from nothing
export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: MOTION.duration.normal } },
  exit:    { opacity: 0, transition: { duration: MOTION.duration.fast   } },
};

// Backdrop
export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: MOTION.duration.normal } },
  exit:    { opacity: 0, transition: { duration: MOTION.duration.fast   } },
};
