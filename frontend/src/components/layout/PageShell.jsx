import React from 'react';
import { cn } from '../../lib/utils';

/**
 * PageShell Component
 * Consistent container architecture for dashboard and workspace screens.
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 */
export const PageShell = ({ children, className }) => {
  return (
    <div className={cn("max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 w-full flex-1 flex flex-col relative z-10", className)}>
      {children}
    </div>
  );
};

export default PageShell;
