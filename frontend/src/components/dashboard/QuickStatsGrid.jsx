import React from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, Zap, ShieldAlert } from 'lucide-react';
import { Card } from '../ui/Card';

/**
 * QuickStatsGrid Component
 * Highlights real-time biometric organization telemetry metrics across top of dashboard.
 */
export const QuickStatsGrid = () => {
  const stats = [
    {
      id: 'nodes',
      title: "Total Enrolled Vaults",
      value: "28 Nodes",
      delta: "+4 this week",
      icon: <Users className="w-5 h-5 text-[#6366F1]" />,
      color: "from-[#6366F1]/20 to-transparent",
    },
    {
      id: 'roc',
      title: "Mean Triplet Accuracy",
      value: "99.74%",
      delta: "ROC Optimal",
      icon: <Zap className="w-5 h-5 text-[#22D3A5]" />,
      color: "from-[#22D3A5]/20 to-transparent",
    },
    {
      id: 'feed',
      title: "Live Sensor Feed Rate",
      value: "142 Hz",
      delta: "Sub-15ms Latency",
      icon: <Activity className="w-5 h-5 text-[#9B6BFF]" />,
      color: "from-[#9B6BFF]/20 to-transparent",
    },
    {
      id: 'spoof',
      title: "Blocked 3D Physics Spoofs",
      value: "09 Incidents",
      delta: "100% Mitigated",
      icon: <ShieldAlert className="w-5 h-5 text-[#EC4899]" />,
      color: "from-[#EC4899]/20 to-transparent",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
      {stats.map((item, idx) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: idx * 0.06 }}
        >
          <Card className="p-6 relative overflow-hidden bg-[--bg-elevated-2]/60 border-[--border-subtle] hover:border-[--border-strong] flex flex-col justify-between h-32">
            <div className={`absolute -right-10 -bottom-10 w-32 h-32 bg-gradient-to-tl ${item.color} rounded-full blur-xl pointer-events-none`} />
            
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-mono uppercase text-[--text-secondary] font-bold tracking-wider">{item.title}</span>
              <div className="p-2 rounded-[var(--radius-sm)] bg-[--bg-primary] border border-[--border-subtle]">
                {item.icon}
              </div>
            </div>

            <div className="relative z-10 mt-auto flex items-baseline justify-between">
              <span className="text-2xl md:text-3xl font-bold text-[--text-primary] font-mono tracking-tight">{item.value}</span>
              <span className="text-micro font-mono text-[--accent-violet] font-semibold bg-white/5 px-2 py-0.5 rounded">
                {item.delta}
              </span>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default QuickStatsGrid;
