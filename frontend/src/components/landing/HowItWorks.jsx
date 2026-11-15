import React from 'react';
import { motion } from 'framer-motion';
import { GradientText } from '../ui/GradientText';

/**
 * HowItWorks Component
 * Illustrates the 4-step workflow from creation to live perimeter deployment.
 */
export const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Create Facility Workspace",
      description: "Set up your secure workplace profile and invite team members in seconds directly from the management console."
    },
    {
      number: "02",
      title: "Quick Mobile Setup",
      description: "Staff download the GaitAuth mobile app and complete a short walking session to register their natural stride."
    },
    {
      number: "03",
      title: "Smart Profile Activation",
      description: "GaitAuth securely generates an encrypted biometric profile and pairs it with the employee's authorized digital passkey."
    },
    {
      number: "04",
      title: "Frictionless Walk-Through",
      description: "Turnstiles and smart doors unlock automatically as employees approach. Zero stopping, zero badges, and zero peak-hour lines."
    }
  ];

  return (
    <section id="how-it-works" className="w-full max-w-7xl mx-auto px-4 md:px-8 py-20 z-10 relative">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-micro font-mono uppercase text-[--accent-pink] tracking-widest block mb-2">
          SYSTEM WORKFLOW
        </span>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          From setup to secure perimeter in <GradientText>four intuitive steps.</GradientText>
        </h2>
      </div>

      <div className="relative">
        {/* Connecting timeline bar (Desktop) */}
        <div className="hidden lg:block absolute top-12 left-12 right-12 h-0.5 bg-gradient-to-r from-[#6366F1] via-[#9B6BFF] to-[#EC4899] opacity-30 z-0" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
          {steps.map((step, idx) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
              className="flex flex-col items-start bg-[--bg-elevated-2]/60 border border-[--border-subtle] rounded-[var(--radius-lg)] p-6 md:p-8 hover:border-[--border-strong] transition-colors shadow-lg"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#6366F1] via-[#9B6BFF] to-[#EC4899] p-[2px] mb-6 shadow-[0_0_20px_rgba(155,107,255,0.4)]">
                <div className="w-full h-full bg-[--bg-primary] rounded-full flex items-center justify-center font-mono font-bold text-sm text-white">
                  {step.number}
                </div>
              </div>
              <h3 className="text-lg font-bold text-[--text-primary] mb-2">{step.title}</h3>
              <p className="text-sm text-[--text-secondary] leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
