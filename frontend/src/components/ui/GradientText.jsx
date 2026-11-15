import React from 'react';
import { cn } from '../../lib/utils';

/**
 * GradientText Atomic Primitive
 * Wraps children in linear gradient indigo -> violet -> pink text clipping.
 * @param {object} props
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 * @param {string} [props.as='span']
 */
export const GradientText = ({ className, children, as = 'span', ...props }) => {
  const Component = as;
  return (
    <Component
      className={cn(
        "bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] via-[#9B6BFF] to-[#EC4899] font-bold inline-block select-auto",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

export default GradientText;
