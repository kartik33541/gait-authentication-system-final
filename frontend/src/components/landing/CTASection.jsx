import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { GlassPanel } from '../ui/GlassPanel';
import { Button } from '../ui/Button';
import { GradientText } from '../ui/GradientText';
import { GlowOrb } from '../ui/GlowOrb';

/**
 * CTASection Component
 * High-impact concluding banner urging users to initialize their secure perimeter.
 */
export const CTASection = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <section id="security" className="w-full max-w-6xl mx-auto px-4 md:px-8 py-16 z-10 relative">
      <GlassPanel className="relative p-10 md:p-16 text-center border-[--border-strong] overflow-hidden shadow-[0_25px_80px_-15px_rgba(99,102,241,0.35)]">
        <GlowOrb color="indigo" size="lg" className="-top-24 -right-24 opacity-30" />
        <GlowOrb color="pink" size="md" className="-bottom-20 -left-20 opacity-25" />
        
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-6">
          <div className="p-3 bg-[--accent-indigo]/10 border border-[--accent-indigo]/20 rounded-full text-[--accent-indigo] mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[--text-primary]">
            Ready to secure your <GradientText>facility perimeter?</GradientText>
          </h2>
          
          <p className="text-[--text-secondary] text-base md:text-lg leading-relaxed">
            Eliminate lost keycards, tailgating, and bottleneck lines. Deploy seamless smartphone walking access across your organization in minutes.
          </p>
          
          <div className="pt-4">
            <Button
              variant="primary"
              size="lg"
              icon={ArrowRight}
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
              className="text-base font-semibold px-10 shadow-[0_0_40px_rgba(155,107,255,0.35)] hover:shadow-[0_0_50px_rgba(155,107,255,0.45)] bg-[#9B6BFF] hover:bg-[#8B55FF] text-[#07070C] border-none"
            >
              {isAuthenticated ? 'Open Command Dashboard' : 'Get Started Now'}
            </Button>
          </div>

          <p className="text-xs font-mono text-[--text-muted] uppercase tracking-widest mt-2">
            ENTERPRISE READY • PRIVACY FIRST • INSTANT VERIFICATION
          </p>
        </div>
      </GlassPanel>
    </section>
  );
};

export default CTASection;
