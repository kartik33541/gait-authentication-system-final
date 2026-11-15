import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Radio, Clock } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

/**
 * ActivityLogFeed Component
 * Real-time continuous stream table of zero-trust perimeter access events.
 */
export const ActivityLogFeed = () => {
  const [logs, setLogs] = useState([
    { id: 1, type: 'VERIFY_SUCCESS', person: 'Kartik Rawat', zone: 'Vault Cluster North', confidence: '99.8%', time: 'Just now' },
    { id: 2, type: 'VERIFY_SUCCESS', person: 'Dr. Evelyn Reed', zone: 'Bio-Lab Sector A', confidence: '99.4%', time: '2m ago' },
    { id: 3, type: 'SPOOF_REJECTED', person: 'UNKNOWN_ID_09', zone: 'Server Hub East Gate', confidence: '14.2%', time: '8m ago', detail: 'Static video screen replay detected via 3D Physics Guard (E < 0.2)' },
    { id: 4, type: 'VERIFY_SUCCESS', person: 'Nikhil Dangi', zone: 'Main Administrative Wing', confidence: '99.9%', time: '15m ago' },
  ]);

  // Simulate a live random authentication event coming across the socket feed every 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const names = ['Abhishek Gupta', 'Praveen K. Patel', 'Elena Vance', 'Marcus Vance'];
      const zones = ['Research Facility B', 'Quantum Suite Gateway', 'Data Core Entrance'];
      const isSuccess = Math.random() > 0.2;

      const newLog = {
        id: Date.now(),
        type: isSuccess ? 'VERIFY_SUCCESS' : 'SPOOF_REJECTED',
        person: isSuccess ? names[Math.floor(Math.random() * names.length)] : 'ANONYMOUS_SKELETON_TRY',
        zone: zones[Math.floor(Math.random() * zones.length)],
        confidence: isSuccess ? `${(99.2 + Math.random() * 0.7).toFixed(1)}%` : `${(10 + Math.random() * 25).toFixed(1)}%`,
        time: 'Just now',
        detail: isSuccess ? null : 'Kinetic frequency drift or device orientation anomaly rejected'
      };

      setLogs(prev => [newLog, ...prev.slice(0, 7)]);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  return (
    <GlassPanel className="p-6 md:p-8 border-[--border-strong] shadow-xl">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-[--border-subtle]">
        <div className="flex items-center gap-3">
          <Radio className="w-5 h-5 text-[--accent-success] animate-pulse" />
          <h3 className="font-bold text-lg text-[--text-primary]">Live Perimeter Telemetry & Security Logs</h3>
        </div>
        <Badge variant="info" className="font-mono text-[10px]">REAL-TIME SOCKET STREAM</Badge>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {logs.map((log) => {
            const isSuccess = log.type === 'VERIFY_SUCCESS';

            return (
              <motion.div
                key={log.id}
                layout
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35 }}
                className={cn(
                  "p-4 rounded-[var(--radius-md)] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-sans transition-colors",
                  isSuccess 
                    ? "bg-[--bg-elevated-2]/70 border-[--border-subtle] hover:border-[--border-strong]"
                    : "bg-[--accent-danger]/5 border-[--accent-danger]/30 text-[--text-primary] shadow-[0_0_20px_rgba(244,63,94,0.1)]"
                )}
              >
                <div className="flex items-center gap-3.5">
                  <div className={cn("p-2 rounded-full shrink-0", isSuccess ? "bg-[--accent-success]/10 text-[--accent-success]" : "bg-[--accent-danger]/20 text-[--accent-danger]")}>
                    {isSuccess ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4 animate-pulse" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-bold text-[--text-primary]">
                      <span>{log.person}</span>
                      <span className="text-[--text-muted] font-normal">•</span>
                      <span className={cn("text-xs font-mono font-semibold", isSuccess ? "text-[--text-secondary]" : "text-[--accent-danger]")}>
                        {log.zone}
                      </span>
                    </div>
                    {log.detail && (
                      <p className="text-xs text-[--accent-danger] font-mono mt-0.5">{log.detail}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono shrink-0 sm:self-center">
                  <div className="flex items-center gap-1">
                    <span className="text-[--text-muted]">SIMILARITY:</span>
                    <span className={cn("font-bold", isSuccess ? "text-[--accent-success]" : "text-[--accent-danger]")}>{log.confidence}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[--text-muted]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{log.time}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </GlassPanel>
  );
};

export default ActivityLogFeed;
