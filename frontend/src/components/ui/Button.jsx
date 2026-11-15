import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Premium Atomic Button Primitive
 * @param {object} props
 * @param {'primary' | 'secondary' | 'ghost' | 'danger' | 'link'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {React.ReactNode} [props.icon]
 * @param {string} [props.className]
 * @param {boolean} [props.disabled]
 * @param {function} [props.onClick]
 * @param {React.ReactNode} props.children
 * @param {string} [props.type='button']
 */
export const Button = React.forwardRef(({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className,
  disabled = false,
  onClick,
  children,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = "relative inline-flex items-center justify-center font-medium transition-colors rounded-[var(--radius-pill)] select-none disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[--accent-indigo] focus-visible:ring-offset-[--bg-primary]";

  const variants = {
    primary: "bg-white text-[#07070C] hover:bg-[#F5F6FA]/90 active:bg-white/80 shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:shadow-[0_6px_25px_rgba(255,255,255,0.25)]",
    secondary: "bg-[--bg-elevated-2] text-[--text-primary] border border-[--border-subtle] hover:border-[--border-strong] hover:bg-[--bg-elevated-2]/80 active:bg-[--bg-primary] shadow-[0_10px_30px_-10px_rgba(7,7,12,0.8)]",
    ghost: "bg-transparent text-[--text-secondary] hover:text-[--text-primary] hover:bg-white/[0.05] active:bg-white/[0.08]",
    danger: "bg-[--accent-danger]/10 text-[--accent-danger] border border-[--accent-danger]/20 hover:bg-[--accent-danger]/20 active:bg-[--accent-danger]/30",
    link: "bg-transparent text-[--accent-indigo] hover:text-[--accent-violet] underline-offset-4 hover:underline p-0 h-auto",
  };

  const sizes = {
    sm: "text-xs px-3.5 py-1.5 gap-1.5",
    md: "text-sm px-5 py-2.5 gap-2",
    lg: "text-base px-7 py-3.5 gap-2.5",
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(baseStyles, variants[variant], variant !== 'link' && sizes[size], className)}
      whileHover={{ scale: disabled || variant === 'link' ? 1 : 1.015 }}
      whileTap={{ scale: disabled || variant === 'link' ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...props}
    >
      {Icon && (React.isValidElement(Icon) ? Icon : <Icon className={cn(size === 'sm' ? "w-3.5 h-3.5" : "w-4 h-4")} />)}
      <span>{children}</span>
    </motion.button>
  );
});

Button.displayName = 'Button';
export default Button;
