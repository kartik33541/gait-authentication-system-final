import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Premium Atomic Card Primitive
 * @param {object} props
 * @param {string} [props.className]
 * @param {boolean} [props.hoverEffect=true]
 * @param {function} [props.onClick]
 * @param {React.ReactNode} props.children
 */
export const Card = React.forwardRef(({
  className,
  hoverEffect = true,
  onClick,
  children,
  ...props
}, ref) => {
  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      className={cn(
        "bg-[--bg-elevated] border border-[--border-subtle] rounded-[var(--radius-lg)] p-6 text-[--text-primary] transition-colors relative overflow-hidden",
        onClick && "cursor-pointer",
        className
      )}
      whileHover={hoverEffect ? { 
        y: -3, 
        borderColor: 'rgba(255,255,255,0.16)',
        boxShadow: '0 20px 60px -15px rgba(99,102,241,0.25)' 
      } : undefined}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

Card.displayName = 'Card';
export default Card;
