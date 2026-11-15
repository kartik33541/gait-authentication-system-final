import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, MessageCircle, LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { GradientText } from '../ui/GradientText';
import { GlowOrb } from '../ui/GlowOrb';

/**
 * Premium Hero Section Component for Landing Page.
 * Implements a 25/100 dynamic Aurora Wavefield, Sensor Dust background,
 * and a subtle vertical "Rope" scroll progress animation.
 */
export const Hero = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Hook into the global scroll position for the Rope animation
  const { scrollYProgress } = useScroll();
  
  // Maps the scroll progress (0 to 1) to a percentage (0% to 100%) for the glowing tip
  const ropeTipPosition = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const handlePrimaryClick = () => {
    navigate(isAuthenticated ? '/dashboard' : '/signup');
  };

  // --- Animation Variants ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  // Generate random data points for the "Sensor Dust" effect
  const sensorDust = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 10 + 15,
    delay: Math.random() * 5,
  }));

  return (
    <section className="relative w-full overflow-hidden py-24 md:py-36 px-4 md:px-8 flex flex-col items-center justify-center text-center bg-[#050505]">
      
      {/* =========================================================
          SCROLL ROPE ANIMATION (Subtle Left-Side Progress)
          ========================================================= */}
      <div className="fixed top-0 left-4 md:left-12 bottom-0 w-[1px] bg-white/5 z-50 pointer-events-none hidden sm:block">
        {/* The growing rope line */}
        <motion.div
          className="w-full h-full bg-gradient-to-b from-indigo-500 via-fuchsia-500 to-rose-500 origin-top"
          style={{ scaleY: scrollYProgress }}
        />
        {/* The glowing tip of the rope */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-1.5 h-3 rounded-full bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,1)]"
          style={{ top: ropeTipPosition }}
        />
      </div>

      {/* =========================================================
          DYNAMIC BACKGROUND LAYER (25/100 Dynamism)
          ========================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        
        {/* 1. Aurora Wavefield (Slow, intersecting rotating gradients) */}
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-[100%] mix-blend-screen opacity-30 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(0,0,0,0) 70%)',
          }}
        />
        
        <motion.div
          animate={{
            rotate: [360, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-[100%] mix-blend-screen opacity-20 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(236,72,153,0.4) 0%, rgba(0,0,0,0) 70%)',
          }}
        />

        <motion.div
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[40%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] rounded-[100%] mix-blend-screen opacity-15 blur-[80px]"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(0,0,0,0) 70%)',
          }}
        />

        {/* 2. Flowing Biometric Grid Lines */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ 
               backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
               backgroundSize: '4rem 4rem',
               maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 10%, transparent 100%)',
               WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 10%, transparent 100%)'
             }} 
        />

        {/* 3. Floating Sensor Dust (Simulating IMU data points) */}
        {sensorDust.map((dust) => (
          <motion.div
            key={dust.id}
            initial={{ opacity: 0, y: `${dust.y + 20}vh`, x: `${dust.x}vw` }}
            animate={{ 
              opacity: [0, 0.8, 0],
              y: [`${dust.y + 20}vh`, `${dust.y - 20}vh`],
              x: [`${dust.x}vw`, `${dust.x + (Math.random() * 10 - 5)}vw`]
            }}
            transition={{ 
              duration: dust.duration, 
              repeat: Infinity, 
              delay: dust.delay,
              ease: "linear"
            }}
            className="absolute rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            style={{
              width: dust.size,
              height: dust.size,
            }}
          />
        ))}
      </div>

      {/* =========================================================
          FOREGROUND CONTENT SHELL
          ========================================================= */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-8"
      >
        {/* Status Badge */}
        <motion.div variants={itemVariants}>
          <Badge variant="success" pulsing className="px-5 py-2 text-[11px] tracking-widest shadow-[0_0_20px_rgba(34,211,165,0.15)] bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981]">
            CONTINUOUS PERIMETER PROTECTION
          </Badge>
        </motion.div>

        {/* Hero Headline */}
        <motion.div variants={itemVariants} className="flex flex-col gap-3">
          <span className="text-xs md:text-sm font-mono uppercase tracking-[0.25em] text-white/50 font-medium mb-2">
            Smart Facility Access System
          </span>
          <h1 className="text-[clamp(3rem,7vw,5.5rem)] font-bold tracking-tighter text-white leading-[1.1]">
            Identity verification,
          </h1>
          <div className="text-[clamp(3rem,7vw,5.5rem)] font-bold tracking-tighter leading-[1.1]">
            <GradientText className="from-indigo-400 via-fuchsia-400 to-rose-400">driven by motion.</GradientText>
          </div>
        </motion.div>

        {/* Supporting Copy */}
        <motion.p variants={itemVariants} className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light mt-4">
          Secure your doors and perimeters with effortless motion verification. Turn natural walking into instant, hands-free access using your smartphone—no badges, no keycards, no stopping at gates.
        </motion.p>

        {/* Action Button Row */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-5 mt-8">
          <Button
            variant="primary"
            size="lg"
            icon={ArrowRight}
            onClick={handlePrimaryClick}
            className="shadow-[0_0_40px_rgba(155,107,255,0.35)] font-semibold text-base px-10 py-6 rounded-full hover:scale-105 transition-transform bg-[#9B6BFF] hover:bg-[#8B55FF] text-[#07070C] border-none"
          >
            {isAuthenticated ? 'Open Dashboard' : 'Get Started'}
          </Button>
          {isAuthenticated ? (
            <Button
              variant="secondary"
              size="lg"
              icon={MessageCircle}
              onClick={() => navigate('/kenny')}
              className="font-medium text-base px-10 py-6 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors"
            >
              Talk to Kenny
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="lg"
              icon={LogIn}
              onClick={() => navigate('/login')}
              className="font-medium text-base px-10 py-6 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors"
            >
              Sign In
            </Button>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;