import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Premium Tabs Primitive
 * @param {object} props
 * @param {Array<{ id: string | number, label: string, badge?: string | number }>} props.tabs
 * @param {string | number} props.activeId
 * @param {function} props.onChange
 * @param {string} [props.className]
 */
export const Tabs = ({ tabs = [], activeId, onChange, className }) => {
  return (
    <div className={cn("flex flex-wrap items-center gap-1 bg-[--bg-elevated-2] p-1.5 rounded-[var(--radius-pill)] border border-[--border-subtle] select-none", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-5 py-2 text-sm font-medium transition-colors rounded-[var(--radius-pill)] flex items-center gap-2",
              isActive ? "text-white" : "text-[--text-secondary] hover:text-[--text-primary] hover:bg-white/5"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 bg-[#6366F1] rounded-[var(--radius-pill)] shadow-[0_2px_12px_rgba(99,102,241,0.4)]"
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={cn(
                "relative z-10 text-xs px-2 py-0.5 rounded-full font-mono font-semibold",
                isActive ? "bg-black/25 text-white" : "bg-white/10 text-[--text-muted]"
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
