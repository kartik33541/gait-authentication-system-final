import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { GradientText } from '../components/ui/GradientText';
import { GlowOrb } from '../components/ui/GlowOrb';

/**
 * NotFound Page Component (404)
 * Premium biometric-themed error screen for untruthful routes.
 */
export const NotFound = () => {
  return (
    <div className="flex flex-col min-h-screen w-full bg-[--bg-primary]">
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-24 text-center relative overflow-hidden">
        <GlowOrb color="pink" size="lg" className="opacity-20 top-1/4 left-1/3" />
        
        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-[--accent-danger]/10 border border-[--accent-danger]/30 flex items-center justify-center text-[--accent-danger] shadow-[0_0_35px_rgba(244,63,94,0.25)] mb-2">
            <ShieldAlert className="w-8 h-8 animate-bounce" />
          </div>
          
          <div className="flex flex-col gap-2">
            <span className="text-sm font-mono text-[--text-muted] uppercase tracking-[0.25em] font-bold">
              ERROR 404 • PAGE NOT FOUND
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[--text-primary]">
              Security route <GradientText>unavailable.</GradientText>
            </h1>
          </div>

          <p className="text-[--text-secondary] text-base leading-relaxed max-w-md">
            The facility page or workspace link you requested could not be found. Return home or sign in to continue.
          </p>

          <div className="pt-4">
            <Link to="/">
              <Button variant="primary" size="lg" icon={ArrowLeft} className="font-semibold shadow-lg px-8">
                Return to Safe Perimeter
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
