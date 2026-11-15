import React from 'react';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/landing/Hero';
import { ArchitectureStrip } from '../components/landing/ArchitectureStrip';
import { FeatureGrid } from '../components/landing/FeatureGrid';
import { AndroidSection } from '../components/landing/AndroidSection';
import { HowItWorks } from '../components/landing/HowItWorks';
import { CTASection } from '../components/landing/CTASection';

/**
 * Landing Page Component
 * Pure composition of high-performance dark biometric-fintech sections.
 */
export const Landing = () => {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <main className="flex-1 flex flex-col items-center w-full pb-20 overflow-hidden">
        <Hero />
        <ArchitectureStrip />
        <FeatureGrid />
        <AndroidSection />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;