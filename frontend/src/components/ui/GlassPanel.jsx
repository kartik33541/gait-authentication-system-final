import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * GlassPanel Atomic Primitive
 * Renders a translucent glassmorphism pane over AnimatedBg or Hero elements.
 * @param {object} props
 * @param {string} [props.className]
 * @param {boolean} [props.hoverEffect=false]
 * @param {function} [props.onClick]
 * @param {React.ReactNode} props.children
 */
export const GlassPanel = React.forwardRef(({
  className,
  hoverEffect = false,
  onClick,
  children,
  ...props
}, ref) => {
  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      className={cn(
        "bg-[--glass-fill] backdrop-blur-[20px] border border-[--border-subtle] rounded-[var(--radius-lg)] p-6 text-[--text-primary] transition-colors relative overflow-hidden shadow-[0_15px_50px_-15px_rgba(7,7,12,0.9)]",
        onClick && "cursor-pointer",
        className
      )}
      whileHover={hoverEffect ? {
        y: -4,
        borderColor: 'rgba(255,255,255,0.16)',
        boxShadow: '0 20px 60px -15px rgba(155,107,255,0.3)'
      } : undefined}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

GlassPanel.displayName = 'GlassPanel';
export default GlassPanel;
