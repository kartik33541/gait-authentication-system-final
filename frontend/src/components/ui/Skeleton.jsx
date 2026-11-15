import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Shimmering Skeleton Loader Primitive
 * @param {object} props
 * @param {string} [props.className]
 * @param {'rect' | 'circle' | 'pill'} [props.variant='rect']
 */
export const Skeleton = ({ className, variant = 'rect' }) => {
  const variantRadius = {
    rect: 'rounded-[var(--radius-md)]',
    circle: 'rounded-full aspect-square',
    pill: 'rounded-[var(--radius-pill)]',
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[--bg-elevated-2] border border-[--border-subtle]/50 animate-pulse",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent",
        variantRadius[variant] || variantRadius.rect,
        className
      )}
      aria-hidden="true"
    />
  );
};

export default Skeleton;
