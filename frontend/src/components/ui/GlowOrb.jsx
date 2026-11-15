import React from 'react';
import { cn } from '../../lib/utils';

/**
 * GlowOrb Decorative Atomic Primitive
 * Renders large blurred gradient blobs with organic drifting motion.
 * @param {object} props
 * @param {'indigo' | 'violet' | 'pink' | 'multi'} [props.color='indigo']
 * @param {'sm' | 'md' | 'lg' | 'xl'} [props.size='lg']
 * @param {'normal' | 'slow' | 'fast'} [props.speed='normal']
 * @param {string} [props.className]
 */
export const GlowOrb = ({
  color = 'indigo',
  size = 'lg',
  speed = 'normal',
  className,
  ...props
}) => {
  const colors = {
    indigo: 'bg-[#6366F1]',
    violet: 'bg-[#9B6BFF]',
    pink: 'bg-[#EC4899]',
    multi: 'bg-gradient-to-r from-[#6366F1] via-[#9B6BFF] to-[#EC4899]',
  };

  const sizes = {
    sm: 'w-48 h-48 blur-[70px] opacity-20',
    md: 'w-72 h-72 blur-[90px] opacity-20',
    lg: 'w-96 h-96 blur-[120px] opacity-15',
    xl: 'w-[36rem] h-[36rem] blur-[150px] opacity-15',
  };

  const speeds = {
    normal: 'animate-orb-drift',
    slow: 'animate-orb-drift-slow',
    fast: 'animate-orb-drift-fast',
  };

  return (
    <div
      className={cn(
        "rounded-full pointer-events-none select-none absolute z-0",
        colors[color] || colors.indigo,
        sizes[size] || sizes.lg,
        speeds[speed] || speeds.normal,
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
};

export default GlowOrb;
