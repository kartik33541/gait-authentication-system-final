import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ShieldCheck, 
  Sliders, 
  Zap, 
  Lock, 
  AlertOctagon, 
  X, 
  Check, 
  Moon, 
  ShieldAlert,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { db } from '../../firebase';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  addDoc, 
  collection, 
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

/**
 * PerimeterPolicyBar & GateStrictnessModal — Point 4 Implementation.
 * 
 * Crafted with a warm, human-centered product design:
 * - Clear, jargon-free choices (Smooth & Easy, Balanced, Strict).
 * - High z-index (z-[100]) covering the entire screen including the navbar.
 * - Backdrop blur that isolates the card with tap-outside-to-dismiss.
 * - Direct real-time synchronization with Cloud Firestore.
 */
export const PerimeterPolicyBar = ({ tenantId: propTenantId }) => {
  const { user, tenantId: authTenantId } = useAuth();
  const activeTenantId = propTenantId || authTenantId || user?.tenant_id || 'COMP-05PC4G-2026';

  const [isOpen, setIsOpen] = useState(false);
  const [isLockdownModalOpen, setIsLockdownModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchParams] = useSearchParams();

  // Deep-link modal listener from Kenny Navigator Agent
  useEffect(() => {
    const openTarget = searchParams.get('open');
    if (openTarget === 'strictness') {
      setIsOpen(true);
    } else if (openTarget === 'lockdown') {
      setIsLockdownModalOpen(true);
    }
  }, [searchParams]);

  // Firestore Policy State
  const [policy, setPolicy] = useState({
    strictness_mode: 'BALANCED', // 'HIGH_THROUGHPUT' | 'BALANCED' | 'STRICT'
    threshold: 0.75,
    auto_night_strict: true,
    updated_at: null,
    updated_by: 'System Default'
  });
  const [isLockdown, setIsLockdown] = useState(false);

  // Draft state inside modal
  const [selectedMode, setSelectedMode] = useState('BALANCED');
  const [autoNight, setAutoNight] = useState(true);

  // 1. Subscribe to real-time organization security policy in Cloud Firestore
  useEffect(() => {
    if (!activeTenantId) return;

    const orgRef = doc(db, 'organizations', activeTenantId);
    const unsubscribe = onSnapshot(orgRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const savedPolicy = data.security_policy || {};
        const currentMode = savedPolicy.strictness_mode || 'BALANCED';
        const currentThreshold = savedPolicy.threshold || (currentMode === 'HIGH_THROUGHPUT' ? 0.65 : currentMode === 'STRICT' ? 0.85 : 0.75);

        setPolicy({
          strictness_mode: currentMode,
          threshold: currentThreshold,
          auto_night_strict: savedPolicy.auto_night_strict ?? true,
          updated_at: savedPolicy.updated_at || null,
          updated_by: savedPolicy.updated_by || 'Default Policy'
        });

        setIsLockdown(Boolean(data.emergency_lockdown));
        setSelectedMode(currentMode);
        setAutoNight(savedPolicy.auto_night_strict ?? true);
      }
    }, (err) => {
      console.error("Error subscribing to security policy:", err);
    });

    return () => unsubscribe();
  }, [activeTenantId]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsLockdownModalOpen(false);
      }
    };
    if (isOpen || isLockdownModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLockdownModalOpen]);

  // Mode Configuration Data — Humanized & Clean
  const modes = [
    {
      id: 'HIGH_THROUGHPUT',
      name: 'Smooth & Easy',
      threshold: 0.65,
      badge: 'Fastest unlock',
      badgeColor: 'text-amber-300 border-amber-500/20 bg-amber-500/10',
      icon: Zap,
      iconColor: 'text-amber-400',
      description: 'Tolerates walking fast, holding coffees, or carrying heavy bags. Best for morning rush hours and busy hallways.'
    },
    {
      id: 'BALANCED',
      name: 'Balanced',
      threshold: 0.75,
      badge: 'Recommended',
      badgeColor: 'text-[#7EDDB5] border-[#7EDDB5]/20 bg-[#7EDDB5]/10',
      icon: ShieldCheck,
      iconColor: 'text-[#7EDDB5]',
      description: 'Zero-trust verification designed for standard office days. Opens smoothly for employees while keeping unauthorized visitors locked out.'
    },
    {
      id: 'STRICT',
      name: 'Strict & High Security',
      threshold: 0.85,
      badge: 'Maximum security',
      badgeColor: 'text-rose-300 border-rose-500/20 bg-rose-500/10',
      icon: Lock,
      iconColor: 'text-rose-400',
      description: 'Zero tolerance for variations. Requires exact walking rhythm. Best for research labs, server rooms, or after hours.'
    }
  ];

  const currentModeInfo = modes.find(m => m.id === policy.strictness_mode) || modes[1];

  // 2. Save Policy to Firestore
  const handleSavePolicy = async () => {
    setIsSaving(true);
    const chosenMode = modes.find(m => m.id === selectedMode) || modes[1];

    try {
      const orgRef = doc(db, 'organizations', activeTenantId);
      await updateDoc(orgRef, {
        security_policy: {
          strictness_mode: chosenMode.id,
          threshold: chosenMode.threshold,
          auto_night_strict: autoNight,
          updated_at: new Date().toISOString(),
          updated_by: user?.name || 'Administrator'
        }
      });

      // Write administrative audit event to Firestore access_logs
      const logsCollection = collection(db, 'organizations', activeTenantId, 'access_logs');
      await addDoc(logsCollection, {
        tenant_id: activeTenantId,
        employee_id: 'POLICY',
        employee_name: user?.name || 'Security Admin',
        status: 'GRANTED',
        confidence_score: '100%',
        walk_energy: 0,
        reason: `Door sensitivity set to ${chosenMode.name}`,
        ai_diagnosis: `Administrator set door strictness to ${chosenMode.name} (threshold: ${chosenMode.threshold}). Auto night schedule is ${autoNight ? 'active' : 'off'}.`,
        timestamp: serverTimestamp()
      });

      toast.success(`Door settings saved: ${chosenMode.name}`);
      setIsOpen(false);
    } catch (err) {
      console.error("Error saving policy:", err);
      toast.error("Failed to update door settings");
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Toggle Emergency Master Lockdown
  const handleToggleLockdown = async () => {
    const nextLockdownState = !isLockdown;
    setIsSaving(true);

    try {
      const orgRef = doc(db, 'organizations', activeTenantId);
      await updateDoc(orgRef, {
        emergency_lockdown: nextLockdownState
      });

      const logsCollection = collection(db, 'organizations', activeTenantId, 'access_logs');
      await addDoc(logsCollection, {
        tenant_id: activeTenantId,
        employee_id: 'LOCKDOWN',
        employee_name: user?.name || 'Security Admin',
        status: nextLockdownState ? 'DENIED' : 'GRANTED',
        confidence_score: '100%',
        walk_energy: 0,
        reason: nextLockdownState ? 'Emergency Lockdown Activated' : 'Emergency Lockdown Lifted',
        ai_diagnosis: nextLockdownState
          ? `Emergency lockdown triggered by ${user?.name}. All perimeter doors are locked immediately.`
          : `Emergency lockdown lifted by ${user?.name}. Standard walk-through access resumed.`,
        timestamp: serverTimestamp()
      });

      toast.success(
        nextLockdownState 
          ? "Lockdown active: All doors locked!" 
          : "Lockdown lifted: Normal access restored."
      );

      setIsLockdownModalOpen(false);
    } catch (err) {
      console.error("Error toggling lockdown:", err);
      toast.error("Failed to update lockdown state");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* =========================================================
          DASHBOARD TRIGGER BAR
          ========================================================= */}
      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#09090b] border border-white/5 shadow-xl">
        
        {/* Left: Interactive Policy Trigger */}
        <div 
          onClick={() => {
            setSelectedMode(policy.strictness_mode);
            setAutoNight(policy.auto_night_strict);
            setIsOpen(true);
          }}
          className="flex-1 flex items-center justify-between p-3 sm:px-4 sm:py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/15 transition-all cursor-pointer group"
          title="Click to adjust door sensitivity"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#A477FF]/10 border border-[#A477FF]/20 flex items-center justify-center text-[#A477FF] shrink-0 group-hover:scale-105 transition-transform">
              <Sliders className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white tracking-tight">
                  Door Strictness: {currentModeInfo.name}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${currentModeInfo.badgeColor}`}>
                  {currentModeInfo.badge}
                </span>
              </div>
              <p className="text-[11.5px] text-white/50 font-light truncate mt-0.5">
                {currentModeInfo.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-[#A477FF] group-hover:translate-x-1 transition-transform pl-2 shrink-0">
            <span>Change</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Right: Emergency Lockdown Status Button */}
        <button
          type="button"
          onClick={() => setIsLockdownModalOpen(true)}
          className={`px-4 py-3 rounded-xl border font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
            isLockdown
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]'
              : 'bg-white/[0.02] hover:bg-rose-500/10 border-white/10 hover:border-rose-500/30 text-white/60 hover:text-rose-400'
          }`}
          title="Lock all doors immediately"
        >
          <AlertOctagon className={`w-4 h-4 ${isLockdown ? 'text-rose-400' : 'text-white/40'}`} />
          <span>{isLockdown ? 'PERIMETER IN LOCKDOWN' : 'Emergency Lockdown'}</span>
        </button>

      </div>

      {/* =========================================================
          MODAL 1: DOOR STRICTNESS SETTINGS (z-[100] OVER NAVBAR)
          ========================================================= */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#040406]/85 backdrop-blur-2xl animate-in fade-in duration-200"
        >
          {/* Modal Card — stopPropagation so clicking inside does not dismiss */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-[24px] bg-[#111118] border border-[#2C2C39] p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] space-y-6 animate-in zoom-in-95 duration-200 relative"
          >
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#A477FF] tracking-wider uppercase">
                  Door Sensitivity
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1 tracking-tight">
                  How strict should your doors be?
                </h3>
                <p className="text-xs sm:text-[13px] text-white/50 mt-1 leading-relaxed font-light">
                  Choose how closely someone's walking pattern must match their registered profile to unlock doors.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close (or press Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Humanized Selection Cards */}
            <div className="space-y-3">
              {modes.map((mode) => {
                const isSelected = selectedMode === mode.id;
                const ModeIcon = mode.icon;

                return (
                  <div
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`p-4 sm:p-4.5 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#181824] border-[#A477FF] shadow-[0_0_24px_rgba(164,119,255,0.18)] ring-1 ring-[#A477FF]/50'
                        : 'bg-white/[0.02] border-[#2C2C39] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3.5">
                      <div className="flex items-start gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mt-0.5 shrink-0 ${
                          isSelected 
                            ? 'bg-[#A477FF]/15 border-[#A477FF]/30 text-[#A477FF]' 
                            : 'bg-white/5 border-white/10 text-white/40'
                        }`}>
                          <ModeIcon className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-[14.5px] font-semibold text-white tracking-tight">
                              {mode.name}
                            </h4>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${mode.badgeColor}`}>
                              {mode.badge}
                            </span>
                          </div>

                          <p className="text-[12.5px] text-white/65 mt-1 leading-relaxed font-light">
                            {mode.description}
                          </p>
                        </div>
                      </div>

                      {/* Selection Check Circle */}
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-all ${
                        isSelected 
                          ? 'border-[#A477FF] bg-[#A477FF] text-[#100A1C]' 
                          : 'border-white/20 bg-transparent'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Night Schedule Toggle */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-[#2C2C39] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[13px] font-semibold text-white block">
                    Tighten security automatically at night
                  </span>
                  <span className="text-[11.5px] text-white/50 font-light block mt-0.5">
                    Automatically switches to Strict Mode after 8:00 PM and returns to your choice at 8:00 AM.
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={autoNight} 
                  onChange={(e) => setAutoNight(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A477FF]" />
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-white/60 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSavePolicy}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl bg-[#A477FF] hover:bg-[#B18BFF] text-[#100A1C] text-xs font-semibold transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    <span>Save door settings</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: EMERGENCY LOCKDOWN (z-[100] OVER NAVBAR)
          ========================================================= */}
      {isLockdownModalOpen && (
        <div 
          onClick={() => setIsLockdownModalOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#040406]/85 backdrop-blur-2xl animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[#111118] border border-rose-500/30 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
          >
            
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isLockdown ? 'Deactivate Emergency Lockdown?' : 'Trigger Emergency Lockdown?'}
                </h3>
                <span className="text-xs text-white/40 font-mono">
                  All Office Doors & Turnstiles
                </span>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed font-light">
              {isLockdown 
                ? 'Deactivating lockdown will restore regular biometric walk verification and allow team members to enter with their passkeys.' 
                : 'Emergency lockdown immediately stops all phones from opening any door. Use this during a physical building alert.'}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLockdownModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/60 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleToggleLockdown}
                disabled={isSaving}
                className={`flex-1 py-2.5 rounded-xl text-white text-xs font-semibold transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 ${
                  isLockdown 
                    ? 'bg-emerald-600 hover:bg-emerald-500' 
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <AlertOctagon className="w-4 h-4" />
                )}
                <span>{isLockdown ? 'Lift Lockdown' : 'Lock All Doors Now'}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default PerimeterPolicyBar;
