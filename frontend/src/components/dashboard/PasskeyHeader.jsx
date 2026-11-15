import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Shield, UserPlus } from 'lucide-react';
import { cn } from '../../lib/utils';

export const PasskeyHeader = ({ workspace }) => {
  const [copied, setCopied] = useState(false);
  const isLive = workspace?.serverState === 'LIVE';

  const copyToClipboard = () => {
    if (workspace?.orgKey) {
      navigator.clipboard.writeText(workspace.orgKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-8 rounded-[2rem] bg-[#09090b] ring-1 ring-white/5 shadow-2xl relative overflow-hidden">
      
      {/* Subtle Ambient Glow based on Server Status */}
      <div className={cn(
        "absolute top-0 right-0 w-96 h-96 blur-[120px] rounded-full pointer-events-none opacity-20",
        isLive ? "bg-emerald-500" : "bg-rose-500"
      )} />
      
      <div className="flex items-start gap-5 z-10">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] ring-1 ring-white/10 flex items-center justify-center shrink-0">
          <Shield className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1">Company Perimeter Passkey</h2>
          <p className="text-sm text-white/70 max-w-md font-light leading-relaxed">
            Enter this passkey in your GaitAuth Android app to automatically unlock doors with your natural walking pattern.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto z-10">
        
        {/* Primary Add Team Members Action */}
        <Link 
          to="/onboarding"
          className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#A477FF] hover:bg-[#B18BFF] text-[#100A1C] font-semibold text-sm transition-all shadow-[0_0_20px_rgba(164,119,255,0.25)] hover:scale-105 active:scale-95 shrink-0"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add Team Members</span>
        </Link>

        {/* Passkey Copy Container */}
        <div 
          onClick={copyToClipboard}
          className="flex items-center justify-between gap-6 px-5 py-3.5 rounded-2xl bg-[#18181b] ring-1 ring-white/10 hover:ring-indigo-500/50 transition-all cursor-pointer group min-w-[300px]"
        >
          <span className="text-xl font-mono text-white tracking-[0.2em] font-medium">
            {workspace?.orgKey || 'NO-KEY-FOUND'}
          </span>
          <div className="text-white/40 group-hover:text-indigo-400 transition-colors">
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white/[0.02] ring-1 ring-white/5">
          <div className="relative flex h-3 w-3">
            {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50"></span>}
            <span className={cn("relative inline-flex rounded-full h-3 w-3", isLive ? "bg-emerald-500" : "bg-rose-500")}></span>
          </div>
          <span className="text-sm font-semibold tracking-wider text-white">
            {isLive ? 'SYSTEM LIVE' : 'OFFLINE'}
          </span>
        </div>

      </div>
    </div>
  );
};