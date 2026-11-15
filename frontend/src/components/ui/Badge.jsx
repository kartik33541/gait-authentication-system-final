import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Premium Status Badge Primitive
 * Follows the "● INFERENCE ENGINE LIVE" pattern from reference screens.
 * @param {object} props
 * @param {'success' | 'warning' | 'danger' | 'info' | 'neutral'} [props.variant='success']
 * @param {boolean} [props.pulsing=false]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export const Badge = ({
  variant = 'success',
  pulsing = false,
  className,
  children,
  ...props
}) => {
  const variantStyles = {
    success: {
      bg: 'bg-[#22D3A5]/10 text-[#22D3A5] border-[#22D3A5]/20',
      dot: 'bg-[#22D3A5] shadow-[0_0_8px_#22D3A5]',
    },
    warning: {
      bg: 'bg-[#F5B942]/10 text-[#F5B942] border-[#F5B942]/20',
      dot: 'bg-[#F5B942] shadow-[0_0_8px_#F5B942]',
    },
    danger: {
      bg: 'bg-[#F43F5E]/10 text-[#F43F5E] border-[#F43F5E]/20',
      dot: 'bg-[#F43F5E] shadow-[0_0_8px_#F43F5E]',
    },
    info: {
      bg: 'bg-[#6366F1]/10 text-[#818CF8] border-[#6366F1]/20',
      dot: 'bg-[#818CF8] shadow-[0_0_8px_#6366F1]',
    },
    neutral: {
      bg: 'bg-white/5 text-[--text-secondary] border-white/10',
      dot: 'bg-[--text-muted]',
    },
  };

  const selected = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-[var(--radius-pill)] border text-micro select-none",
        selected.bg,
        className
      )}
      {...props}
    >
      <span className="relative flex h-2 w-2 items-center justify-center">
        {pulsing && (
          <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping", selected.dot)} />
        )}
        <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", selected.dot)} />
      </span>
      <span>{children}</span>
    </span>
  );
};

export default Badge;
