import { AnimatePresence, m } from 'motion/react';
import { useAnimationsEnabled } from './animation-preferences';

export function AnimatedTabIndicator({ layoutId }) {
  const animationsEnabled = useAnimationsEnabled();
  const className =
    'pointer-events-none absolute inset-0 rounded-md bg-primary shadow-sm';

  if (!animationsEnabled) {
    return <span aria-hidden="true" className={className} />;
  }

  return (
    <m.span
      aria-hidden="true"
      className={className}
      layoutId={layoutId}
      transition={{ type: 'spring', stiffness: 520, damping: 38 }}
    />
  );
}

export function AnimatedTabPanel({ activeId, children, className }) {
  const animationsEnabled = useAnimationsEnabled();

  if (!animationsEnabled) {
    return (
      <div key={activeId} className={className}>
        {children}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={activeId}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className={className}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
