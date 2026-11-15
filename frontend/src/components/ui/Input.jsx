import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Premium Atomic Input Primitive with error shaking and micro-labels.
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} [props.error]
 * @param {string} [props.type='text']
 * @param {string} [props.className]
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} [props.rightElement]
 */
export const Input = React.forwardRef(({
  label,
  error,
  type = 'text',
  className,
  icon: Icon,
  rightElement,
  ...props
}, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-medium text-[--text-secondary] uppercase tracking-wider select-none">
          {label}
        </label>
      )}
      <motion.div
        animate={error ? "shake" : "default"}
        variants={{
          shake: { x: [-5, 5, -5, 5, 0], transition: { duration: 0.3 } },
          default: { x: 0 }
        }}
        className="relative flex items-center w-full"
      >
        {Icon && (
          <div className="absolute left-3.5 text-[--text-muted] pointer-events-none flex items-center justify-center">
            {React.isValidElement(Icon) ? Icon : <Icon className="w-4 h-4" />}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            "w-full bg-[--bg-elevated-2] border rounded-[var(--radius-md)] text-[--text-primary] placeholder-[--text-muted] text-sm px-4 py-3 transition-all duration-200 outline-none",
            "focus:border-[--accent-indigo] focus:ring-1 focus:ring-[--accent-indigo]/40 focus:bg-[--bg-elevated-2]/90",
            Icon && "pl-10",
            rightElement && "pr-10",
            error ? "border-[--accent-danger] text-[--accent-danger] placeholder-[--accent-danger]/60 focus:border-[--accent-danger]" : "border-[--border-subtle] hover:border-[--border-strong]",
            className
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3.5 flex items-center justify-center text-[--text-secondary]">
            {rightElement}
          </div>
        )}
      </motion.div>
      {error && (
        <p className="text-xs text-[--accent-danger] mt-0.5 animate-fade-in font-medium">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
