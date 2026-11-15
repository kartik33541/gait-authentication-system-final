import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, AlertOctagon, Activity, Eye, Server } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { GradientText } from '../ui/GradientText';

/**
 * FeatureGrid Component
 * Displays a 3x2 responsive grid of biometric security advantages.
 */
export const FeatureGrid = () => {
  const features = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#22D3A5]" />,
      title: "Contactless Mobile Access",
      description: "Zero external hardware or optical scanners required. Authorized personnel gain entrance naturally as they approach, keeping their phone in pocket or bag."
    },
    {
      icon: <Lock className="w-6 h-6 text-[#6366F1]" />,
      title: "Privacy-Preserving Vault",
      description: "Gait profiles are converted into irreversible, encrypted mathematical tokens. No raw motion data, video feeds, or personal identifiers are ever stored."
    },
    {
      icon: <AlertOctagon className="w-6 h-6 text-[#EC4899]" />,
      title: "Anti-Tailgating & Spoof Defense",
      description: "Instantly detects device handoffs, artificial motion simulations, and unauthorized following, stopping fraudulent entries before the gate opens."
    },
    {
      icon: <Activity className="w-6 h-6 text-[#9B6BFF]" />,
      title: "Continuous Adaptive Security",
      description: "Intelligently accommodates everyday variations like footwear changes, attire, and carrying laptop bags without generating frustrating false alarms."
    },
    {
      icon: <Eye className="w-6 h-6 text-[#38BDF8]" />,
      title: "Transparent Audit & Insights",
      description: "Every access attempt is recorded with instant, plain-language insights. Security teams can verify anomalies and review events in seconds."
    },
    {
      icon: <Server className="w-6 h-6 text-[#F5B942]" />,
      title: "Multi-Facility Access Control",
      description: "Centralized administration across headquarters, server rooms, laboratories, and regional offices with granular role-based security permissions."
    }
  ];

  return (
    <section id="features" className="w-full max-w-7xl mx-auto px-4 md:px-8 py-20 z-10 relative">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-micro font-mono uppercase text-[--accent-indigo] tracking-widest block mb-2">
          ENTERPRISE SECURITY CAPABILITIES
        </span>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Built for high-security <GradientText>workplaces & facilities.</GradientText>
        </h2>
        <p className="text-[--text-secondary] text-base">
          Connect your employees' everyday smartphones to smart doors and speed gates for seamless, hands-free facility protection.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
          >
            <GlassPanel hoverEffect className="h-full p-8 flex flex-col justify-between border-[--border-subtle] bg-[--glass-fill]/50">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-sm">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-[--text-primary] mb-3">{item.title}</h3>
                <p className="text-sm text-[--text-secondary] leading-relaxed">{item.description}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-[--border-subtle]/40 flex items-center justify-between text-xs font-mono text-[--text-muted]">
                <span>CAPABILITY 0{idx + 1}</span>
                <span className="text-[--accent-violet] font-semibold">ACTIVE</span>
              </div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FeatureGrid;
