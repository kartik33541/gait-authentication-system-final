import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { GlowOrb } from '../ui/GlowOrb';

/**
 * SplashScreen Component
 * Shown during session authentication and initial biometric parameter checking.
 */
export const SplashScreen = () => {
  return (
    <div className="fixed inset-0 w-full h-screen bg-[--bg-primary] flex flex-col items-center justify-center z-50 overflow-hidden select-none">
      <GlowOrb color="indigo" size="lg" className="opacity-25" />
      <GlowOrb color="pink" size="md" className="opacity-20 translate-x-12 translate-y-12" />
      
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: [0.95, 1.05, 1], opacity: 1 }}
        transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#6366F1] via-[#9B6BFF] to-[#EC4899] p-0.5 shadow-[0_0_50px_rgba(155,107,255,0.4)]">
          <div className="w-full h-full bg-[--bg-primary] rounded-[14px] flex items-center justify-center">
            <Shield className="w-10 h-10 text-white stroke-[2.2]" />
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-[--text-primary]">GaitAuth Core</h2>
          <p className="text-micro text-[--text-muted] uppercase tracking-[0.25em] animate-pulse font-mono">
            INITIALIZING SECURE SESSION...
          </p>
        </div>

        {/* Thin gradient progress line */}
        <div className="w-48 h-1 bg-[--bg-elevated-2] rounded-full overflow-hidden border border-[--border-subtle] mt-2">
          <motion.div
            className="h-full bg-gradient-to-r from-[#6366F1] via-[#9B6BFF] to-[#EC4899]"
            initial={{ width: '0%' }}
            animate={{ width: ['0%', '75%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
