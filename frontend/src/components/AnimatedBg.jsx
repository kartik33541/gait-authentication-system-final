/**
 * @file AnimatedBg.jsx
 * @description Enterprise-grade, interactive background component designed for the 
 * Gemini-inspired Cognitive Interface. This component features complex SVG meshes,
 * CSS-driven fluid gradients, and a React-managed interactive spotlight effect that 
 * follows the user's cursor to simulate an "aware" neural network environment.
 * 
 * Performance Note: Utilizes hardware acceleration and will-change CSS properties 
 * to ensure 60fps rendering even on lower-end devices.
 */

import React, { useEffect, useState, useRef } from 'react';

// Assumes existence of the useTheme hook defined in App.jsx
// Fallback provided if hook is not available in isolated testing
const useTheme = () => {
  try {
    const { useTheme: useAppTheme } = require('../App');
    return useAppTheme();
  } catch {
    return { theme: 'dark' };
  }
};

const AnimatedBg = () => {
  const { theme } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const bgRef = useRef(null);

  // ---------------------------------------------------------------------------
  // INTERACTIVITY: Mouse Tracking Spotlight
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let animationFrameId;
    
    const handleMouseMove = (e) => {
      if (!bgRef.current) return;
      
      // Use requestAnimationFrame for performance optimization
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        const { clientX, clientY } = e;
        // Calculate relative position based on viewport
        const x = (clientX / window.innerWidth) * 100;
        const y = (clientY / window.innerHeight) * 100;
        setMousePosition({ x, y });
      });
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // RENDER HELPERS
  // ---------------------------------------------------------------------------
  
  // Dynamic color selection based on active theme
  const getColors = () => {
    return theme === 'dark' 
      ? { grid: 'rgba(255, 255, 255, 0.03)', primary: '#818cf8', secondary: '#c084fc', ambient: 'rgba(2, 6, 23, 1)' }
      : { grid: 'rgba(0, 0, 0, 0.03)', primary: '#4f46e5', secondary: '#9333ea', ambient: 'rgba(255, 255, 255, 1)' };
  };

  const colors = getColors();

  return (
    <div 
      ref={bgRef}
      className="fixed inset-0 z-hide overflow-hidden pointer-events-none transition-colors duration-700 ease-in-out"
      style={{ backgroundColor: 'var(--bg-primary)' }}
      aria-hidden="true"
    >
      {/* 
        ========================================================================
        LAYER 1: The Base Neural Grid
        A scalable SVG grid that represents the underlying sensor matrix of the 
        Gait Authentication platform.
        ========================================================================
      */}
      <div className="absolute inset-0 opacity-40 transition-opacity duration-1000">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cognitive-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path 
                d="M 60 0 L 0 0 0 60" 
                fill="none" 
                stroke={colors.grid} 
                strokeWidth="1.5" 
                className="transition-colors duration-700"
              />
              {/* Intersection Nodes */}
              <circle cx="0" cy="0" r="1.5" fill={colors.grid} />
            </pattern>
            
            {/* Ambient vignette effect to soften the edges */}
            <radialGradient id="vignette-glow" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="100%" stopColor="var(--bg-primary)" />
            </radialGradient>
          </defs>
          
          <rect width="100%" height="100%" fill="url(#cognitive-grid)" />
          
          {/* Topographic organic lines simulating gait pathways */}
          <path 
            d="M-100,200 Q300,50 600,300 T1200,100" 
            fill="none" 
            stroke={`url(#gradient-path-1)`} 
            strokeWidth="0.5" 
            className="opacity-20 animate-pulse-slow"
          />
          <path 
            d="M-50,800 Q400,600 800,900 T1400,700" 
            fill="none" 
            stroke={`url(#gradient-path-2)`} 
            strokeWidth="0.5" 
            className="opacity-20 animate-pulse-fast"
            style={{ animationDelay: '1s' }}
          />

          <defs>
            <linearGradient id="gradient-path-1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0" />
              <stop offset="50%" stopColor={colors.primary} stopOpacity="1" />
              <stop offset="100%" stopColor={colors.secondary} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradient-path-2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.secondary} stopOpacity="0" />
              <stop offset="50%" stopColor={colors.secondary} stopOpacity="1" />
              <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
            </linearGradient>
          </defs>
          
          <rect width="100%" height="100%" fill="url(#vignette-glow)" />
        </svg>
      </div>

      {/* 
        ========================================================================
        LAYER 2: Fluid Ambient Orbs
        These large, highly blurred divs move slowly in the background to create 
        the signature Gemini "liquid glass" feeling.
        ========================================================================
      */}
      <div className="absolute inset-0 overflow-hidden mix-blend-screen dark:mix-blend-lighten">
        {/* Primary AI Node (Blue) */}
        <div 
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-30 dark:opacity-20 animate-float-slow gpu-accelerate transition-colors duration-1000"
          style={{ 
            background: `radial-gradient(circle, ${colors.primary} 0%, transparent 70%)` 
          }}
        />
        
        {/* Secondary AI Node (Purple) */}
        <div 
          className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-30 dark:opacity-20 animate-float-medium gpu-accelerate transition-colors duration-1000"
          style={{ 
            background: `radial-gradient(circle, ${colors.secondary} 0%, transparent 70%)`,
            animationDelay: '-2s'
          }}
        />
        
        {/* Accent Sparkle Node (Light Blue/Cyan) */}
        <div 
          className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full blur-[100px] opacity-20 dark:opacity-10 animate-float-fast gpu-accelerate transition-colors duration-1000"
          style={{ 
            background: `radial-gradient(circle, var(--brand-accent) 0%, transparent 70%)`,
            animationDelay: '-4s'
          }}
        />
      </div>

      {/* 
        ========================================================================
        LAYER 3: Interactive Mouse Spotlight
        Creates a subtle illumination effect that follows the user's cursor,
        revealing the grid and creating a sense of deep interactivity.
        ========================================================================
      */}
      <div 
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none mix-blend-overlay"
        style={{
          opacity: isHovering ? 1 : 0,
          background: `radial-gradient(
            circle 800px at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(255,255,255,0.06), 
            transparent 40%
          )`
        }}
      />

      {/* 
        ========================================================================
        LAYER 4: Simulated Data Stream Particles
        Tiny glowing dots that float upward, representing biometric sensor data 
        being processed by the neural engine.
        ========================================================================
      */}
      <div className="absolute inset-0 overflow-hidden opacity-50 dark:opacity-30">
        {[...Array(15)].map((_, i) => {
          // Generate random parameters for organic movement
          const left = `${Math.random() * 100}%`;
          const animationDuration = `${Math.random() * 10 + 10}s`;
          const animationDelay = `-${Math.random() * 10}s`;
          const size = Math.random() * 3 + 1;
          
          return (
            <div 
              key={`particle-${i}`}
              className="absolute bottom-[-10px] rounded-full bg-white shadow-glow-sm animate-data-stream"
              style={{
                left,
                width: `${size}px`,
                height: `${size}px`,
                animationDuration,
                animationDelay,
                opacity: Math.random() * 0.5 + 0.1,
              }}
            />
          );
        })}
      </div>
      
      {/* Heavy noise overlay for texture (Glassmorphism essential) */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
        }}
      />
    </div>
  );
};

export default React.memo(AnimatedBg);