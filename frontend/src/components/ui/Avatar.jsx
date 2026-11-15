import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Premium Avatar Primitive
 * @param {object} props
 * @param {string} [props.src]
 * @param {string} [props.name='User']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.gradientRing=true]
 * @param {string} [props.className]
 */
export const Avatar = ({ src, name = 'User', size = 'md', gradientRing = true, className }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  const initial = name.charAt(0).toUpperCase() || 'U';

  return (
    <div
      className={cn(
        "relative rounded-full inline-flex items-center justify-center select-none overflow-hidden",
        sizes[size],
        gradientRing ? "p-[2px] bg-gradient-to-tr from-[#6366F1] via-[#9B6BFF] to-[#EC4899] shadow-[0_0_12px_rgba(99,102,241,0.3)]" : "bg-[--bg-elevated-2] border border-[--border-subtle]",
        className
      )}
    >
      <div className="w-full h-full rounded-full bg-[--bg-primary] flex items-center justify-center overflow-hidden text-white font-semibold">
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initial}</span>
        )}
      </div>
    </div>
  );
};

export default Avatar;
