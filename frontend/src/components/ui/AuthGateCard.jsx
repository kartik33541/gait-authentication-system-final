import React from 'react';
import { Lock, LogIn, UserPlus, ArrowLeft, X, ShieldCheck } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { GradientText } from './GradientText';

/**
 * Shared Auth Gate Card Content
 * Presents a unified "Kindly log in or sign up to continue" prompt for both modal and full-screen gates.
 */
export const AuthGateCard = ({
  badgeLabel = 'Authentication Required',
  featureName = 'this protected resource',
  description = 'Organization telemetry, employee access controls, and enterprise distribution packages are restricted to authorized accounts.',
  onLogin,
  onSignup,
  onDismiss,
  dismissLabel = 'Stay on Page',
  showCloseIcon = false,
}) => {
  return (
    <div className="w-full max-w-[480px] bg-[#0E0F17]/95 border border-white/15 rounded-[28px] p-7 sm:p-9 shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_50px_rgba(155,107,255,0.18)] relative overflow-hidden backdrop-blur-2xl text-left">
      {/* Top Edge Gradient Highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

      {/* Subtle Ambient Corner Glow */}
      <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#9B6BFF]/15 rounded-full blur-3xl pointer-events-none" />

      {showCloseIcon && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close authentication prompt"
          className="absolute top-5 right-5 p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="relative z-10 flex flex-col gap-5">
        {/* Icon + Badge Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <Lock className="w-5 h-5" />
          </div>
          <Badge
            variant="warning"
            className="text-[10px] font-mono uppercase tracking-widest bg-amber-500/10 text-amber-300 border-amber-500/25"
          >
            {badgeLabel}
          </Badge>
        </div>

        {/* Title & Context Copy */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
            Kindly log in or sign up <GradientText>to continue.</GradientText>
          </h2>
          <p className="text-sm text-white/70 leading-relaxed mt-3">
            Access to <span className="text-white font-semibold">{featureName}</span> is limited to signed-in workspace members. {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            icon={LogIn}
            onClick={onLogin}
            className="w-full justify-center bg-[#9B6BFF] hover:bg-[#8B55FF] text-[#07070C] font-semibold shadow-[0_0_25px_rgba(155,107,255,0.35)] border-none py-3.5"
          >
            Log In to Continue
          </Button>

          <Button
            variant="secondary"
            size="lg"
            icon={UserPlus}
            onClick={onSignup}
            className="w-full justify-center bg-white/5 hover:bg-white/10 border border-white/15 text-white font-medium py-3.5"
          >
            Create Organization Account
          </Button>
        </div>

        {/* Bottom Safeguard + Secondary Back/Dismiss Action */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 text-xs text-white/50">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Zero-Trust Perimeter Guard</span>
          </span>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-white/70 hover:text-white transition-colors inline-flex items-center gap-1 font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{dismissLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthGateCard;
