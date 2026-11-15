import React from 'react';
import { motion } from 'framer-motion';

export const VoiceOrb = ({ state = 'idle', size = 'lg', onClick }) => {
  const sizeClass = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }[size];

  const coreVariants = {
    idle: { scale: [0.95, 1.05, 0.95], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } },
    listening: { scale: [0.9, 1.15, 0.9], transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } },
    speaking: { scale: [0.95, 1.1, 1.0, 1.15, 0.95], transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' } }
  };

  return (
    <div onClick={onClick} className={`relative flex items-center justify-center cursor-pointer ${sizeClass}`}>
      {/* Outer Glow */}
      <motion.div
        animate={state}
        variants={{
          idle: { opacity: 0.2, scale: 1.2 },
          listening: { opacity: [0.3, 0.7, 0.3], scale: [1.1, 1.5, 1.1], transition: { duration: 1.5, repeat: Infinity } },
          speaking: { opacity: [0.4, 0.8, 0.4], scale: [1.2, 1.6, 1.2], transition: { duration: 0.8, repeat: Infinity } }
        }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-rose-500 blur-xl z-0"
      />
      
      {/* Core AI Orb */}
      <motion.div
        variants={coreVariants}
        animate={state}
        className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-rose-500 p-[2px] z-10"
      >
        <div className="w-full h-full rounded-full bg-[#050505] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-rose-500/20 mix-blend-screen" />
          <span className="text-2xl font-semibold text-white/90 z-20">K</span>
        </div>
      </motion.div>
    </div>
  );
};

export default VoiceOrb;