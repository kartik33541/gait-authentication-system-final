import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  ChevronDown, 
  Sparkles, 
  Lock, 
  ShieldAlert, 
  Radio, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Play
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { TestWalkModal } from './TestWalkModal';
import toast from 'react-hot-toast';

/**
 * LiveTelemetryFeed — Point 1 & Point 3 Implementation.
 * 
 * Features:
 * - Real-time stream from Firestore organizations/{tenantId}/access_logs.
 * - Point 3 Actionable Incident Resolution:
 *   1. "Dismiss as False Alarm": Resolves alert, drops Flagged count in Morning Health Check.
 *   2. "Escalate Incident": Flags threat and logs admin investigation note.
 *   3. Filter tabs: All, Granted, Needs Review.
 * 100% REAL DATA. ZERO MOCK ARRAYS OR CLIENT-SIDE FAKE LOGS.
 */
export const LiveTelemetryFeed = ({ tenantId: propTenantId }) => {
  const { user, tenantId: authTenantId } = useAuth();
  const activeTenantId = propTenantId || authTenantId || user?.tenant_id || 'COMP-05PC4G-2026';

  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'GRANTED' | 'NEEDS_REVIEW'
  const [resolvingId, setResolvingId] = useState(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // 1. Subscribe to real-time access logs from Cloud Firestore
  useEffect(() => {
    if (!activeTenantId) {
      setIsLoading(false);
      return;
    }

    const logsRef = collection(db, 'organizations', activeTenantId, 'access_logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(30));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      const nowMs = Date.now();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        // Check if this is an ephemeral simulation log that has expired (2 min retention)
        if (data.is_simulation) {
          let isExpired = false;
          if (data.expires_at) {
            isExpired = new Date(data.expires_at).getTime() <= nowMs;
          } else if (data.timestamp?.toDate) {
            isExpired = (nowMs - data.timestamp.toDate().getTime()) > 2 * 60 * 1000;
          }

          if (isExpired) {
            // Asynchronously delete expired simulation log from Firestore
            deleteDoc(docSnap.ref).catch((err) => {
              console.warn("Auto-purged simulation log error:", err);
            });
            return; // Skip from rendering list
          }
        }

        let formattedTime = 'Just now';
        
        if (data.timestamp?.toDate) {
          const d = data.timestamp.toDate();
          const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
          if (diffSec < 60) {
            formattedTime = 'Just now';
          } else if (diffSec < 3600) {
            formattedTime = `${Math.floor(diffSec / 60)} mins ago`;
          } else {
            formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
        } else if (data.timestamp) {
          formattedTime = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        list.push({
          id: docSnap.id,
          employee_id: data.employee_id || 'UNKNOWN',
          user_name: data.employee_name || data.user_name || 'Unidentified Entity',
          status: (data.status || 'DENIED').toUpperCase(),
          incident_status: data.incident_status || 'UNRESOLVED', // 'UNRESOLVED' | 'DISMISSED' | 'ESCALATED' | 'RESOLVED'
          resolved_by: data.resolved_by || null,
          resolution_note: data.resolution_note || null,
          confidence: data.confidence_score || '0%',
          walk_energy: Number(data.walk_energy || 0),
          reason: data.reason || 'Verification check',
          reason_code: data.reason_code || null,
          ai_diagnosis: data.ai_diagnosis || data.details || null,
          time: formattedTime,
          rawTimestamp: data.timestamp,
          is_simulation: Boolean(data.is_simulation),
          expires_at: data.expires_at || null
        });
      });

      setLogs(list);
      setIsLoading(false);
    }, (err) => {
      console.error("Firestore access_logs onSnapshot error:", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [activeTenantId]);

  // Periodic garbage collection: auto-delete simulation logs older than 2 minutes every 15 seconds
  useEffect(() => {
    if (!activeTenantId) return;

    const interval = setInterval(() => {
      const nowMs = Date.now();
      logs.forEach((log) => {
        if (log.is_simulation && log.expires_at) {
          if (new Date(log.expires_at).getTime() <= nowMs) {
            const logRef = doc(db, 'organizations', activeTenantId, 'access_logs', log.id);
            deleteDoc(logRef).catch(() => {});
          }
        }
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [activeTenantId, logs]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // -------------------------------------------------------------
  // POINT 3: Actionable Incident Resolution Handlers
  // -------------------------------------------------------------
  const handleResolveIncident = async (logId, actionType) => {
    setResolvingId(logId);
    try {
      const logRef = doc(db, 'organizations', activeTenantId, 'access_logs', logId);
      const isDismiss = actionType === 'DISMISS';

      await updateDoc(logRef, {
        incident_status: isDismiss ? 'DISMISSED' : 'ESCALATED',
        resolved_by: user?.name || 'Administrator',
        resolved_at: serverTimestamp(),
        resolution_note: isDismiss 
          ? 'Reviewed and dismissed as false alarm by manager' 
          : 'Flagged and escalated to facility security team'
      });

      toast.success(
        isDismiss 
          ? "Alert dismissed as False Alarm. Morning Health Check updated." 
          : "Incident escalated to Security Personnel!"
      );
    } catch (err) {
      console.error("Error resolving incident:", err);
      toast.error("Failed to update incident status");
    } finally {
      setResolvingId(null);
    }
  };

  const handleReopenIncident = async (logId) => {
    setResolvingId(logId);
    try {
      const logRef = doc(db, 'organizations', activeTenantId, 'access_logs', logId);
      await updateDoc(logRef, {
        incident_status: 'UNRESOLVED',
        resolved_by: null,
        resolved_at: null,
        resolution_note: null
      });

      toast.success("Incident reopened for active review.");
    } catch (err) {
      console.error("Error reopening incident:", err);
      toast.error("Failed to reopen incident");
    } finally {
      setResolvingId(null);
    }
  };

  const isNeedsReviewLog = (log) =>
    log.status !== 'GRANTED' && String(log.incident_status || 'UNRESOLVED').toUpperCase() !== 'DISMISSED';

  // Filter logs (keep both UNRESOLVED and ESCALATED threats visible until dismissed)
  const filteredLogs = logs.filter((log) => {
    if (filter === 'GRANTED') return log.status === 'GRANTED';
    if (filter === 'NEEDS_REVIEW') return isNeedsReviewLog(log);
    return true;
  });

  const unreviewedCount = logs.filter(isNeedsReviewLog).length;

  return (
    <div className="w-full flex flex-col h-full rounded-[2rem] bg-[#09090b] ring-1 ring-white/5 shadow-2xl overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 md:px-8 py-5 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20 flex items-center justify-center">
            <Radio className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight leading-none">Inference Stream</h3>
            <span className="text-[10px] text-white/40 font-mono">Live Firestore Event Registry</span>
          </div>
        </div>

        {/* Right Action Tools: Filter & Live Indicator */}
        <div className="flex items-center gap-2.5">
          {/* Quick Filter */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] font-mono">
            <button
              onClick={() => setFilter('ALL')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                filter === 'ALL' ? "bg-white/10 text-white font-semibold" : "text-white/40 hover:text-white"
              )}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setFilter('GRANTED')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                filter === 'GRANTED' ? "bg-emerald-500/20 text-[#7EDDB5] font-semibold" : "text-white/40 hover:text-white"
              )}
            >
              Granted
            </button>
            <button
              onClick={() => setFilter('NEEDS_REVIEW')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                filter === 'NEEDS_REVIEW' ? "bg-rose-500/20 text-rose-400 font-semibold" : "text-white/40 hover:text-white"
              )}
            >
              <span>Needs Review</span>
              {unreviewedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[9px]">
                  {unreviewedCount}
                </span>
              )}
            </button>
          </div>

          {/* Test Walk Entry Simulator Button */}
          <button
            type="button"
            onClick={() => setIsSimulatorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 hover:text-white transition-all text-[11px] font-mono font-medium cursor-pointer shadow-sm hover:shadow-indigo-500/10 active:scale-95"
            title="Launch Biometric CSV Test Walk Simulator"
          >
            <Play className="w-3 h-3 fill-indigo-400 text-indigo-400" />
            <span>Test Walk Entry</span>
          </button>

          <div
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-mono"
            title="Live biometric verification results stream directly from the Flask engine"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE FLASK SYNC</span>
          </div>
        </div>
      </div>

      {/* Feed Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-hide">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-white/40 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="text-xs font-mono">Connecting to live perimeter telemetry...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 text-white/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white/80">
              {filter === 'NEEDS_REVIEW' ? 'Zero unreviewed incidents' : 'No access events recorded today'}
            </p>
            <p className="text-xs text-white/40 mt-1 max-w-sm font-light leading-relaxed">
              {filter === 'NEEDS_REVIEW' 
                ? 'All flagged alerts have been investigated and dismissed by the administrator.' 
                : 'When employees walk through perimeter doors or trigger Flask biometric verification, real-time match scores stream here automatically.'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isGranted = log.status === 'GRANTED';
            const isPaused = log.reason_code === 'ACCESS_PAUSED' || log.reason?.toLowerCase().includes('paused') || log.status === 'PAUSED';
            const isDismissed = !isGranted && log.incident_status === 'DISMISSED';
            const isEscalated = log.incident_status === 'ESCALATED';
            const isExpanded = expandedId === log.id;
            const hasAiAudit = Boolean(log.ai_diagnosis || log.reason);

            return (
              <div 
                key={log.id}
                className={`flex flex-col rounded-2xl transition-all duration-200 overflow-hidden border ${
                  isDismissed 
                    ? 'bg-white/[0.01] border-white/5 opacity-75' 
                    : isEscalated
                      ? 'bg-rose-500/[0.03] border-rose-500/25'
                      : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/5'
                }`}
              >
                {/* Primary Row */}
                <div 
                  onClick={() => hasAiAudit && toggleExpand(log.id)}
                  className={cn(
                    "flex items-center justify-between p-4 sm:p-5",
                    hasAiAudit ? "cursor-pointer" : ""
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Status Badge Icon */}
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center ring-1 shrink-0",
                      isGranted 
                        ? "bg-emerald-500/10 ring-emerald-500/30 text-emerald-400" 
                        : isPaused 
                          ? "bg-amber-500/10 ring-amber-500/30 text-amber-400" 
                          : isDismissed
                            ? "bg-white/5 ring-white/10 text-white/40"
                            : "bg-rose-500/10 ring-rose-500/30 text-rose-400"
                    )}>
                      {isGranted ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : isPaused ? (
                        <Lock className="w-4 h-4" />
                      ) : isDismissed ? (
                        <CheckCircle className="w-4 h-4 text-white/50" />
                      ) : (
                        <X className="w-4 h-4 stroke-[3]" />
                      )}
                    </div>

                    {/* Employee & Status info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white leading-tight">
                          {log.user_name}
                        </h4>
                        {log.employee_id && log.employee_id !== 'UNKNOWN' && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/5">
                            {log.employee_id}
                          </span>
                        )}

                        {/* Ephemeral Simulation Badge */}
                        {log.is_simulation && (
                          <span 
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold"
                            title="Ephemeral Simulation Entry (auto-deletes after 2 minutes)"
                          >
                            SIM
                          </span>
                        )}

                        {/* Incident Status Pill */}
                        {isDismissed && (
                          <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/40 border border-white/10">
                            Dismissed
                          </span>
                        )}
                        {isEscalated && (
                          <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                            ⚠️ Escalated
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-white/50 font-mono mt-0.5">
                        {isGranted 
                          ? `Match: ${log.confidence}` 
                          : isPaused 
                            ? 'Access Paused by Admin' 
                            : `Verification Blocked · ${log.reason}`}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Time & AI Audit toggle */}
                  <div className="flex items-center gap-4 sm:gap-6">
                    <span className="text-xs text-white/30 font-mono hidden sm:block">
                      {log.time}
                    </span>
                    {hasAiAudit && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(log.id);
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ring-1 cursor-pointer",
                          isExpanded 
                            ? "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20" 
                            : "bg-white/5 text-white/60 ring-white/10 hover:text-white"
                        )}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#A477FF]" />
                        <span>AI Audit</span>
                        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isExpanded && "rotate-180")} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progressive Disclosure: AI Audit Drawer & Point 3 Actions */}
                <AnimatePresence>
                  {isExpanded && hasAiAudit && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/5 bg-[#050505]/95 px-5 py-4 space-y-3.5"
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-1 self-stretch rounded-full shrink-0 mt-0.5",
                          isGranted ? "bg-emerald-500/50" : isPaused ? "bg-amber-500/50" : "bg-rose-500/50"
                        )} />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A477FF]">
                              LLM Biomechanical Reasoning
                            </span>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                              <span>Energy: {log.walk_energy > 0 ? `${Number(log.walk_energy).toFixed(2)}g` : 'N/A'}</span>
                              <span>•</span>
                              <span>Embedding: 256-D</span>
                            </div>
                          </div>

                          <p className="text-[13px] text-white/80 leading-relaxed font-light">
                            {log.ai_diagnosis || log.reason}
                          </p>
                        </div>
                      </div>

                      {/* POINT 3: Actionable Incident Investigation & Resolution Bar */}
                      {!isGranted && (
                        <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          
                          {/* Resolution Status Text */}
                          <div className="text-white/50 text-[11.5px] font-light">
                            {isDismissed ? (
                              <span className="text-[#7EDDB5] flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Dismissed as False Alarm by {log.resolved_by || 'Admin'}</span>
                              </span>
                            ) : isEscalated ? (
                              <span className="text-rose-400 flex items-center gap-1.5 font-medium">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Escalated to Security by {log.resolved_by || 'Admin'}</span>
                              </span>
                            ) : (
                              <span>Investigation needed: Unresolved entry alert</span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {!isDismissed ? (
                              <button
                                type="button"
                                disabled={resolvingId === log.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResolveIncident(log.id, 'DISMISS');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-white/70 hover:text-emerald-400 transition-all font-medium text-[11px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                title="Mark as resolved / False alarm (e.g. employee carrying boxes or rushing)"
                              >
                                {resolvingId === log.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3 text-[#7EDDB5]" />
                                )}
                                <span>Dismiss (False Alarm)</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={resolvingId === log.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReopenIncident(log.id);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-all text-[11px] flex items-center gap-1 cursor-pointer"
                                title="Reopen alert for review"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reopen Alert</span>
                              </button>
                            )}

                            {!isEscalated && (
                              <button
                                type="button"
                                disabled={resolvingId === log.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResolveIncident(log.id, 'ESCALATE');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 hover:border-rose-500/40 text-rose-300 hover:text-rose-200 transition-all font-medium text-[11px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                title="Confirm security incident and notify security"
                              >
                                <AlertTriangle className="w-3 h-3 text-rose-400" />
                                <span>Escalate to Security</span>
                              </button>
                            )}
                          </div>

                        </div>
                      )}

                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })
        )}
      </div>

      {/* Test Walk Entry Modal Simulator */}
      <TestWalkModal 
        isOpen={isSimulatorOpen} 
        onClose={() => setIsSimulatorOpen(false)} 
        tenantId={activeTenantId} 
      />

    </div>
  );
};

export default LiveTelemetryFeed;
