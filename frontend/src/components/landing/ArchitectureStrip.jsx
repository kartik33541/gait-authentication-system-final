import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, MessageSquareCode } from 'lucide-react';
import { Card } from '../ui/Card';

/**
 * ArchitectureStrip Component
 * Explains the foundational technology pillars of GaitAuth.
 */
export const ArchitectureStrip = () => {
  const pillars = [
    {
      id: 'motion',
      icon: <Cpu className="w-6 h-6 text-[#6366F1]" />,
      title: "Seamless Motion Verification",
      subtitle: "Hands-Free Perimeter Access",
      description: "Recognizes your natural walking rhythm in your pocket as you approach gates. Walk straight through turnstiles and doors without slowing down or reaching for your phone."
    },
    {
      id: 'physics',
      icon: <Zap className="w-6 h-6 text-[#EC4899]" />,
      title: "Active Anti-Spoof Protection",
      subtitle: "Physical Presence Verification",
      description: "Instantly differentiates genuine human walking from recorded video replays, screen agitation, or device sharing, ensuring only verified employees gain entry."
    },
    {
      id: 'kenny',
      icon: <MessageSquareCode className="w-6 h-6 text-[#9B6BFF]" />,
      title: "Kenny AI Security Assistant",
      subtitle: "Intelligent Facility Insights",
      description: "Provides clear, human summaries of access events, attendance trends, and perimeter diagnostics directly to managers in plain, conversational English."
    }
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 z-10 relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((pillar, idx) => (
          <motion.div
            key={pillar.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
          >
            <Card className="h-full bg-[--bg-elevated]/80 backdrop-blur-md border-[--border-subtle] hover:border-[--border-strong] p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-[var(--radius-md)] bg-[--bg-elevated-2] border border-[--border-subtle]">
                  {pillar.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[--text-primary] leading-snug">{pillar.title}</h3>
                  <span className="text-micro font-mono uppercase text-[--accent-violet]">{pillar.subtitle}</span>
                </div>
              </div>
              <p className="text-sm text-[--text-secondary] leading-relaxed mt-1">
                {pillar.description}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ArchitectureStrip;
