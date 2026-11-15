import React from 'react';
import { GlowOrb } from '../ui/GlowOrb';

/**
 * AnimatedBg Component
 * Renders an atmospheric biometric fintech ambient lighting background behind all pages.
 */
export const AnimatedBg = () => {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-[--bg-primary]" aria-hidden="true">
      {/* Drifting gradient ambient light orbs */}
      <GlowOrb color="indigo" size="xl" speed="normal" className="-top-32 -left-32 opacity-15" />
      <GlowOrb color="violet" size="xl" speed="slow" className="top-1/3 -right-32 opacity-15" />
      <GlowOrb color="pink" size="lg" speed="fast" className="-bottom-32 left-1/4 opacity-10" />

      {/* Subtle structured dot-matrix depth grid */}
      <div 
        className="absolute inset-0 opacity-[0.035]" 
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />
      
      {/* Film grain noise finish */}
      <div className="absolute inset-0 grain-overlay pointer-events-none" />
    </div>
  );
};

export default AnimatedBg;
