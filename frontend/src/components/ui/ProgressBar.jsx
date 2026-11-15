import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Premium ProgressBar Primitive
 * @param {object} props
 * @param {number} props.progress - Progress percentage 0 to 100
 * @param {boolean} [props.showLabel=true]
 * @param {string} [props.label]
 * @param {string} [props.className]
 */
export const ProgressBar = ({
  progress = 0,
  showLabel = true,
  label,
  className
}) => {
  const bounded = Math.min(100, Math.max(0, progress));

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-mono text-[--text-secondary] uppercase tracking-wide">
          <span>{label || "Processing Triplet Embeddings"}</span>
          <span className="font-semibold text-[--text-primary]">{Math.round(bounded)}%</span>
        </div>
      )}
      <div className="h-2.5 w-full bg-[--bg-elevated-2] rounded-[var(--radius-pill)] overflow-hidden p-0.5 border border-[--border-subtle]">
        <motion.div
          className="h-full rounded-[var(--radius-pill)] bg-gradient-to-r from-[#6366F1] via-[#9B6BFF] to-[#EC4899] shadow-[0_0_12px_rgba(155,107,255,0.6)]"
          initial={{ width: 0 }}
          animate={{ width: `${bounded}%` }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
