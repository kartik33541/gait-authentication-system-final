import React from 'react';
import { Activity, ShieldAlert, Fingerprint } from 'lucide-react';

export const SecurityAnalyticsStrip = () => {
  const stats = [
    {
      title: "Total Entries Today",
      value: "42",
      sub: "+12% vs yesterday",
      icon: <Fingerprint className="w-5 h-5 text-indigo-400" />,
      subColor: "text-emerald-400"
    },
    {
      title: "Failed Attempts",
      value: "3",
      sub: "2 Spoof attempts blocked",
      icon: <ShieldAlert className="w-5 h-5 text-white/70" />,
      subColor: "text-rose-400"
    },
    {
      title: "System Latency",
      value: "1.2s",
      sub: "Avg LSTM Inference",
      icon: <Activity className="w-5 h-5 text-white/70" />,
      subColor: "text-white/40"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {stats.map((stat, i) => (
        <div key={i} className="flex items-start p-6 rounded-[2rem] bg-[#09090b] ring-1 ring-white/5 hover:ring-white/10 hover:-translate-y-1 transition-all duration-300 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] ring-1 ring-white/10 flex items-center justify-center mr-5 shrink-0">
            {stat.icon}
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">{stat.title}</p>
            <h4 className="text-3xl font-display font-semibold text-white tracking-tight leading-none mb-2">{stat.value}</h4>
            <span className={`text-[11px] font-mono font-medium ${stat.subColor}`}>{stat.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
};