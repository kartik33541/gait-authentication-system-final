import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { Badge } from '../ui/Badge';
import { GradientText } from '../ui/GradientText';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { GoogleAuthButton } from './GoogleAuthButton';

/**
 * AuthCard Split-Card Shell Component
 * Exact architectural structure from Section 0 & 3.5:
 * Left panel = branding/theme panel with waveform & pulsing status dot.
 * Right panel = Plain functional form on near-black card, rounded 24px corners.
 * @param {object} props
 * @param {'login' | 'signup'} props.mode
 * @param {function} props.onToggleMode
 * @param {function} props.onSuccess
 */
export const AuthCard = ({ mode = 'login', onToggleMode, onSuccess }) => {
  return (
    <GlassPanel className="p-0 rounded-[var(--radius-lg)] max-w-5xl w-full mx-auto my-8 border border-[--border-subtle] overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-[0_30px_90px_-20px_rgba(7,7,12,1)]">
      
      {/* LEFT COLUMN: Branding & Waveform Theme Panel (Shown LG+) */}
      <div className="hidden lg:flex lg:col-span-5 bg-[--bg-elevated-2]/90 p-10 flex-col justify-between border-r border-[--border-subtle] relative overflow-hidden">
        {/* Top: Logo Mark */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-gradient-to-tr from-[#6366F1] via-[#9B6BFF] to-[#EC4899] p-[2px] shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <div className="w-full h-full bg-[--bg-primary] rounded-[8px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-[--text-primary]">GaitAuth</span>
        </div>

        {/* Middle: Headline & Subtext */}
        <div className="flex flex-col gap-3 my-auto py-8 z-10">
          <h2 className="text-3xl font-bold tracking-tight text-[--text-primary] leading-none">
            Zero-trust
          </h2>
          <div className="text-3xl font-bold tracking-tight leading-none">
            <GradientText>biometric security.</GradientText>
          </div>
          <p className="text-sm text-[--text-secondary] leading-relaxed mt-2 max-w-sm">
            Authenticate enterprise personnel seamlessly using Siamese LSTM temporal verification models and 3D kinetic energy scoring.
          </p>
        </div>

        {/* Center-Bottom: Animated Waveform SVG */}
        <div className="absolute inset-x-0 bottom-28 flex items-center justify-center opacity-30 pointer-events-none">
          <svg viewBox="0 0 500 120" className="w-full h-32 text-[--accent-indigo]" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 60 C 50 10, 100 110, 150 60 C 200 10, 250 110, 300 60 C 350 10, 400 110, 450 60 C 480 30, 490 80, 500 60"
              stroke="url(#auth-gradient-wave)"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="animate-pulse"
            />
            <defs>
              <linearGradient id="auth-gradient-wave" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="50%" stopColor="#9B6BFF" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Bottom: Secure Status Badge */}
        <div className="z-10 mt-auto pt-4">
          <Badge variant="success" pulsing className="text-micro shadow-[0_0_15px_rgba(34,211,165,0.2)]">
            SECURE E2EE CONNECTION
          </Badge>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Functional Form */}
      <div className="col-span-1 lg:col-span-7 bg-[--bg-primary] p-8 md:p-12 flex flex-col justify-center gap-6 z-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[--text-primary] mb-1">
            {mode === 'login' ? "Welcome back!" : "Create your perimeter."}
          </h2>
          <p className="text-sm text-[--text-secondary]">
            {mode === 'login'
              ? "Enter your passkey credentials to administer authorized biometric zones."
              : "Register your root administrator node to begin capturing personnel gait data."}
          </p>
        </div>

        <GoogleAuthButton onSuccess={onSuccess} />

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 border-t border-[--border-subtle]/60" />
          <span className="text-micro font-mono text-[--text-muted] uppercase tracking-wider">OR ENTERPASSKEY</span>
          <div className="flex-1 border-t border-[--border-subtle]/60" />
        </div>

        {/* Form area with smooth AnimatePresence transition */}
        <div className="relative min-h-[260px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -15 : 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'login' ? 15 : -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="w-full"
            >
              {mode === 'login' ? (
                <LoginForm onSuccess={onSuccess} />
              ) : (
                <SignupForm onSuccess={onSuccess} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Mode Toggle */}
        <div className="pt-4 border-t border-[--border-subtle]/50 text-center text-sm text-[--text-secondary]">
          {mode === 'login' ? (
            <span>
              Don't have an enterprise perimeter?{' '}
              <button
                type="button"
                onClick={onToggleMode}
                className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] via-[#9B6BFF] to-[#EC4899] hover:opacity-80 transition-opacity ml-1"
              >
                Sign up now →
              </button>
            </span>
          ) : (
            <span>
              Already administer a workspace?{' '}
              <button
                type="button"
                onClick={onToggleMode}
                className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] via-[#9B6BFF] to-[#EC4899] hover:opacity-80 transition-opacity ml-1"
              >
                Log in →
              </button>
            </span>
          )}
        </div>
      </div>
    </GlassPanel>
  );
};

export default AuthCard;
