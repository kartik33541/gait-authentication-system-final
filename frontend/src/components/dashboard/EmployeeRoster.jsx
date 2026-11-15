import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  Tag,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  Lock,
  AlertTriangle,
  X,
  UploadCloud,
  FileText,
  AlertOctagon,
  Mail,
  Copy,
  ExternalLink,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { enrollEmployeeBiometrics, sendEmployeeInviteEmail } from '../../lib/biometricApi';
import toast from 'react-hot-toast';

export const EmployeeRoster = ({ workspace }) => {
  const { tenantId, user } = useAuth();
  const activeTenantId = workspace?.orgKey || tenantId || user?.tenant_id || 'COMP-05PC4G-2026';

  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [updateEmployee, setUpdateEmployee] = useState(null);
  const [updateMode, setUpdateMode] = useState('REPLACE'); // 'REPLACE' | 'APPEND'
  const [confirmedWarning, setConfirmedWarning] = useState(false);
  const [deleteConfirmEmployee, setDeleteConfirmEmployee] = useState(null);

  // Mobile Invite & Passkey Modal State
  const [inviteModalEmp, setInviteModalEmp] = useState(null);
  const [copiedSetupLink, setCopiedSetupLink] = useState(false);
  const [copiedPasskey, setCopiedPasskey] = useState(false);
  const [editEmailInput, setEditEmailInput] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // File Upload State
  const [newFiles, setNewFiles] = useState([]);
  const [isProcessingUpdate, setIsProcessingUpdate] = useState(false);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setUpdateEmployee(null);
        setDeleteConfirmEmployee(null);
        setInviteModalEmp(null);
      }
    };
    if (updateEmployee || deleteConfirmEmployee || inviteModalEmp) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [updateEmployee, deleteConfirmEmployee, inviteModalEmp]);

  // 1. Real-time listener on company's private employees collection
  useEffect(() => {
    if (!activeTenantId) {
      setIsLoading(false);
      return;
    }

    const employeesRef = collection(db, 'organizations', activeTenantId, 'employees');
    const unsubscribe = onSnapshot(employeesRef, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name || 'Unnamed Operative',
          email: data.email || null,
          setup_status: data.setup_status || null,
          template_id: data.template_id || docSnap.id,
          tenant_id: data.tenant_id || activeTenantId,
          status: data.status || 'ACTIVE',
          readings_count: data.readings_count || 2,
          master_templates: data.master_templates,
          enrolled_at: data.enrolled_at,
          last_calibrated_at: data.last_calibrated_at || null,
          last_overwritten_at: data.last_overwritten_at || null
        });
      });
      list.sort((a, b) => a.template_id.localeCompare(b.template_id));
      setEmployees(list);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore employees onSnapshot error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [activeTenantId]);

  // -------------------------------------------------------------
  // ACTION 1: Pause / Resume Access
  // -------------------------------------------------------------
  const handleTogglePause = async (emp) => {
    const isCurrentlyPaused = emp.status === 'PAUSED';
    const newStatus = isCurrentlyPaused ? 'ACTIVE' : 'PAUSED';

    try {
      const empRef = doc(db, 'organizations', activeTenantId, 'employees', emp.id);
      await updateDoc(empRef, {
        status: newStatus,
        updated_at: new Date().toISOString()
      });

      const logsCollection = collection(db, 'organizations', activeTenantId, 'access_logs');
      await addDoc(logsCollection, {
        tenant_id: activeTenantId,
        employee_id: emp.template_id,
        employee_name: emp.name,
        status: newStatus === 'PAUSED' ? 'DENIED' : 'GRANTED',
        reason_code: newStatus === 'PAUSED' ? 'ACCESS_PAUSED' : 'PERIMETER_RESUMED',
        reason: newStatus === 'PAUSED' ? 'Access paused by admin' : 'Access privileges reactivated by admin',
        confidence_score: '100%',
        walk_energy: 0,
        ai_diagnosis: newStatus === 'PAUSED'
          ? `Security Administrator locked mobile credentials for ${emp.name} (${emp.template_id}). Automatic turnstile and door unlocks are actively blocked.`
          : `Security Administrator reactivated perimeter access privileges for ${emp.name} (${emp.template_id}). Biometric gate verification is operational.`,
        timestamp: serverTimestamp()
      });

      toast.success(
        newStatus === 'PAUSED'
          ? `Access paused for ${emp.name}. Biometric gate will block this passkey.`
          : `Access reactivated for ${emp.name}!`
      );
    } catch (err) {
      console.error("Error toggling pause state:", err);
      toast.error("Failed to update employee status. Check database connection.");
    }
  };

  // -------------------------------------------------------------
  // ACTION 2: File Handling for Update Readings Modal
  // -------------------------------------------------------------
  const handleFilesSelected = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const invalid = selected.filter(f => !f.name.toLowerCase().endsWith('.csv'));
    if (invalid.length > 0) {
      toast.error("Only .csv walking recording files are accepted.");
      return;
    }

    const readers = selected.map(file => {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = (event) => resolve({ name: file.name, size: file.size, content: event.target.result });
        r.onerror = reject;
        r.readAsText(file);
      });
    });

    Promise.all(readers).then(fileObjects => {
      setNewFiles(prev => [...prev, ...fileObjects]);
    }).catch(err => {
      console.error("File read error:", err);
      toast.error("Could not read uploaded sensor files.");
    });
  };

  const handleRemoveFile = (idx) => {
    setNewFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // -------------------------------------------------------------
  // ACTION 3: Confirm & Execute Update Readings
  // -------------------------------------------------------------
  const handleConfirmUpdateReadings = async () => {
    if (!updateEmployee || newFiles.length === 0) return;

    if (updateMode === 'REPLACE' && !confirmedWarning) {
      toast.error("Please acknowledge the overwrite notice to proceed.");
      return;
    }

    setIsProcessingUpdate(true);
    try {
      const csvStrings = newFiles.map(f => f.content);
      const enrollResult = await enrollEmployeeBiometrics({
        tenantId: activeTenantId,
        templateId: updateEmployee.template_id,
        employeeName: updateEmployee.name,
        csvFiles: csvStrings,
        mode: updateMode,
        existingTemplates: updateMode === 'APPEND' ? updateEmployee.master_templates : null,
      });

      const updatedTemplates = enrollResult.master_templates;
      const finalCount = updateMode === 'REPLACE'
        ? newFiles.length
        : (updateEmployee.readings_count || 2) + newFiles.length;

      const empRef = doc(db, 'organizations', activeTenantId, 'employees', updateEmployee.id);
      await updateDoc(empRef, {
        master_templates: updatedTemplates,
        readings_count: finalCount,
        last_calibrated_at: new Date().toISOString(),
        ...(updateMode === 'REPLACE' ? { last_overwritten_at: new Date().toISOString() } : {})
      });

      const logsCollection = collection(db, 'organizations', activeTenantId, 'access_logs');
      await addDoc(logsCollection, {
        tenant_id: activeTenantId,
        employee_id: updateEmployee.template_id,
        employee_name: updateEmployee.name,
        status: 'GRANTED',
        confidence_score: '100%',
        walk_energy: 2.3,
        reason: updateMode === 'REPLACE' ? 'Old readings replaced with new baseline' : 'Additional walking recordings added',
        ai_diagnosis: updateMode === 'REPLACE'
          ? `Administrator discarded previous ${updateEmployee.readings_count || 2} older recordings and established a fresh baseline with ${newFiles.length} new recordings for ${updateEmployee.name} (${updateEmployee.template_id}). Biometric manifold updated in database.`
          : `Administrator appended ${newFiles.length} fresh recordings to ${updateEmployee.name}'s biometric profile. Total recordings: ${finalCount}.`,
        timestamp: serverTimestamp()
      });

      toast.success(
        updateMode === 'REPLACE'
          ? `Older readings deleted. New baseline saved for ${updateEmployee.name}!`
          : `Added ${newFiles.length} recordings for ${updateEmployee.name}!`
      );

      setUpdateEmployee(null);
      setNewFiles([]);
      setConfirmedWarning(false);
    } catch (err) {
      console.error("Update readings error:", err);
      toast.error(err?.message || "Failed to update walking recordings. Existing baseline left untouched.");
    } finally {
      setIsProcessingUpdate(false);
    }
  };

  // -------------------------------------------------------------
  // ACTION 4: Delete Complete Employee
  // -------------------------------------------------------------
  const handleConfirmDeleteEmployee = async () => {
    if (!deleteConfirmEmployee) return;

    try {
      const empRef = doc(db, 'organizations', activeTenantId, 'employees', deleteConfirmEmployee.id);
      await deleteDoc(empRef);

      const orgRef = doc(db, 'organizations', activeTenantId);
      await updateDoc(orgRef, {
        total_employees: increment(-1)
      }).catch(err => console.warn("Headcount sync note:", err));

      const logsCollection = collection(db, 'organizations', activeTenantId, 'access_logs');
      await addDoc(logsCollection, {
        tenant_id: activeTenantId,
        employee_id: deleteConfirmEmployee.template_id,
        employee_name: deleteConfirmEmployee.name,
        status: 'DENIED',
        reason_code: 'EMPLOYEE_DELETED',
        reason: 'Employee permanently deleted by admin',
        confidence_score: '0%',
        walk_energy: 0,
        ai_diagnosis: `Administrator permanently deleted ${deleteConfirmEmployee.name} (${deleteConfirmEmployee.template_id}) from active roster. All physical door access revoked immediately.`,
        timestamp: serverTimestamp()
      });

      toast.success(`${deleteConfirmEmployee.name} deleted from company roster.`);
      setDeleteConfirmEmployee(null);
    } catch (err) {
      console.error("Delete employee error:", err);
      toast.error("Failed to delete employee from Cloud Firestore.");
    }
  };

  return (
    <div className="w-full flex flex-col h-full rounded-[2rem] bg-[#09090b] ring-1 ring-white/5 shadow-2xl overflow-hidden relative">

      {/* Roster Header */}
      <div className="flex items-center justify-between p-6 md:p-8 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight leading-none">Team Members Roster</h3>
            <span className="text-[10px] text-white/40 font-mono">Enrolled Passkey Directory</span>
          </div>
        </div>
        <div className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#7EDDB5]">
          {isLoading ? 'Loading...' : `${employees.length} Enrolled`}
        </div>
      </div>

      {/* Action CTA */}
      <div className="p-5 pb-3">
        <Link
          to="/onboarding"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#A477FF]/10 border border-[#A477FF]/30 hover:border-[#A477FF] hover:bg-[#A477FF]/20 text-[#A477FF] hover:text-white transition-all text-xs font-semibold uppercase tracking-wider cursor-pointer group shadow-sm"
        >
          <Plus className="w-4 h-4 group-hover:scale-110 transition-transform text-[#A477FF]" />
          <span>+ Add More Team Members</span>
        </Link>
      </div>

      {/* Employee List Container */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-2.5 scrollbar-hide">
        {isLoading ? (
          <div className="h-40 flex flex-col items-center justify-center text-white/40 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="text-xs font-mono">Synchronizing biometric vault...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 text-white/30">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-white/70">No employees enrolled yet</p>
            <p className="text-xs text-white/40 mt-1 max-w-xs font-light">
              Add your first team members to generate their 256-D biometric signatures and Mobile App Passkeys.
            </p>
          </div>
        ) : (
          employees.map((emp) => {
            const isPaused = emp.status === 'PAUSED';

            return (
              <div
                key={emp.id}
                className={`p-4 rounded-2xl border transition-all duration-200 ${isPaused
                    ? 'bg-amber-500/[0.02] border-amber-500/20'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
                  }`}
              >
                {/* Employee Row: Avatar + Name + Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-full p-[1.5px] ${isPaused
                          ? 'bg-amber-500/40'
                          : 'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500'
                        }`}>
                        <div className="w-full h-full bg-[#050505] rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#09090b] ${isPaused ? 'bg-amber-400' : 'bg-emerald-400'
                        }`} />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white/95 truncate">
                        {emp.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/50 border border-white/5">
                          <Tag className="w-2.5 h-2.5" />
                          {emp.template_id}
                        </span>

                        <span className={`text-[10px] font-mono flex items-center gap-1 ${isPaused ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                          {isPaused ? (
                            <>
                              <Lock className="w-3 h-3" />
                              <span>Access Paused</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3 h-3" />
                              <span>{emp.readings_count || 2} Recordings</span>
                            </>
                          )}
                        </span>

                        {emp.email && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 truncate max-w-[140px]" title={emp.email}>
                            <Mail className="w-2.5 h-2.5 text-indigo-400" />
                            <span className="truncate">{emp.email}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Delete Trash Button */}
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmEmployee(emp)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title={`Delete ${emp.name} from roster`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Lifecycle Action Buttons Strip */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5 text-[11px] font-medium">

                  {/* Button 1: Pause / Resume Toggle */}
                  <button
                    type="button"
                    onClick={() => handleTogglePause(emp)}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${isPaused
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                      }`}
                    title={isPaused ? "Reactivate phone passkey" : "Immediately lock phone passkey"}
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Resume Access</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3 fill-current" />
                        <span>Pause Access</span>
                      </>
                    )}
                  </button>

                  {/* Button 2: Update Readings (Replace Old or Append) */}
                  <button
                    type="button"
                    onClick={() => {
                      setUpdateEmployee(emp);
                      setUpdateMode('REPLACE');
                      setConfirmedWarning(false);
                      setNewFiles([]);
                    }}
                    className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Replace baseline or append additional walking recordings"
                  >
                    <RefreshCw className="w-3 h-3 text-[#A477FF]" />
                    <span>Update Readings</span>
                  </button>

                  {/* Button 3: Setup Invite & Passkey Handover */}
                  <button
                    type="button"
                    onClick={() => {
                      setInviteModalEmp(emp);
                      setCopiedSetupLink(false);
                      setCopiedPasskey(false);
                      setEditEmailInput(emp.email || '');
                    }}
                    className="py-1.5 px-3 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="View mobile setup invite link & facility passkey"
                  >
                    <Mail className="w-3 h-3 text-indigo-400" />
                    <span>Invite / Passkey</span>
                  </button>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================
          MODAL: Update Biometric Readings
          ========================================================= */}
      {updateEmployee && (
        <div
          onClick={() => !isProcessingUpdate && setUpdateEmployee(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#040406]/85 backdrop-blur-2xl animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-[#111118] border border-white/10 p-6 sm:p-7 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-hide text-left"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#A477FF] shrink-0">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    Update Biometric Recordings
                  </h3>
                  <span className="text-xs text-white/50 font-mono">
                    {updateEmployee.name} ({updateEmployee.template_id})
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={isProcessingUpdate}
                onClick={() => setUpdateEmployee(null)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/90 uppercase tracking-wider font-mono">
                Update Strategy
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setUpdateMode('REPLACE');
                    setConfirmedWarning(false);
                  }}
                  className={`py-2 px-3 rounded-lg transition-all text-center cursor-pointer ${updateMode === 'REPLACE'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
                      : 'text-white/40 hover:text-white'
                    }`}
                >
                  Replace Old Readings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUpdateMode('APPEND');
                    setConfirmedWarning(true);
                  }}
                  className={`py-2 px-3 rounded-lg transition-all text-center cursor-pointer ${updateMode === 'APPEND'
                      ? 'bg-[#A477FF]/20 text-[#A477FF] border border-[#A477FF]/30 font-semibold'
                      : 'text-white/40 hover:text-white'
                    }`}
                >
                  Append (Keep Old)
                </button>
              </div>
            </div>

            {/* Explanatory Banner based on mode */}
            {updateMode === 'REPLACE' ? (
              <div className="p-4 rounded-xl bg-rose-500/[0.06] border border-rose-500/20 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs font-mono">
                  <AlertOctagon className="w-4 h-4 shrink-0" />
                  <span>OVERWRITE NOTICE</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed font-light">
                  All previous <strong className="text-white">{updateEmployee.readings_count || 2} walking recordings</strong> will be permanently discarded. The new recordings will become this employee's sole authentication baseline.
                </p>
                <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={confirmedWarning}
                    onChange={(e) => setConfirmedWarning(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-black/40 text-rose-500 focus:ring-rose-500/30 cursor-pointer"
                  />
                  <span className="text-[11.5px] text-rose-200/90 font-medium">
                    I confirm I want to wipe previous recordings and establish a new baseline.
                  </span>
                </label>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-purple-500/[0.06] border border-purple-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-[#A477FF] font-semibold text-xs font-mono">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>INCREMENTAL CALIBRATION</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed font-light">
                  New walks will be clustered together with the employee's existing baseline. Total active recordings will increase to <strong className="text-white">{(updateEmployee.readings_count || 2) + newFiles.length}</strong>.
                </p>
              </div>
            )}

            {/* Upload Input Area */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/90 uppercase tracking-wider font-mono">
                Upload New Walking Recordings (.csv)
              </label>
              <div className="p-4 rounded-xl border border-dashed border-white/10 hover:border-[#A477FF]/40 bg-white/[0.01] hover:bg-white/[0.02] transition-all text-center">
                <UploadCloud className="w-6 h-6 text-white/40 mx-auto mb-2" />
                <label className="inline-block px-4 py-2 rounded-lg bg-[#A477FF]/10 hover:bg-[#A477FF]/20 border border-[#A477FF]/30 text-[#A477FF] hover:text-white text-xs font-semibold transition-all cursor-pointer">
                  <span>Browse .CSV Files</span>
                  <input
                    type="file"
                    accept=".csv"
                    multiple
                    onChange={handleFilesSelected}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-white/30 block mt-2 font-mono">
                  Select 1 or more walking recordings captured from the mobile sensor
                </span>
              </div>
            </div>

            {/* Uploaded Files Queue */}
            {newFiles.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs text-white/50 font-mono">
                  Files ready to enroll ({newFiles.length}):
                </span>
                <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                  {newFiles.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-[#A477FF] shrink-0" />
                        <span className="text-white/80 truncate">{f.name}</span>
                        <span className="text-white/30 text-[10px]">
                          ({(f.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-white/30 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                disabled={isProcessingUpdate}
                onClick={() => setUpdateEmployee(null)}
                className="py-2.5 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-white/60 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isProcessingUpdate || newFiles.length === 0 || (updateMode === 'REPLACE' && !confirmedWarning)}
                onClick={handleConfirmUpdateReadings}
                className="py-2.5 px-5 rounded-xl bg-[#A477FF] hover:bg-[#B18BFF] text-[#100A1C] text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-500/20"
              >
                {isProcessingUpdate ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Calibrating Neural Manifold...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {updateMode === 'REPLACE'
                        ? 'Overwrite & Save New Baseline'
                        : 'Append & Recalibrate'}
                    </span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: Delete Employee Confirmation
          ========================================================= */}
      {deleteConfirmEmployee && (
        <div
          onClick={() => setDeleteConfirmEmployee(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#040406]/85 backdrop-blur-2xl animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[#111118] border border-rose-500/20 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Remove Employee from Perimeter?
                </h3>
                <span className="text-xs text-white/40 font-mono">
                  {deleteConfirmEmployee.template_id}
                </span>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed font-light">
              Are you sure you want to permanently delete <strong className="text-white">{deleteConfirmEmployee.name}</strong>?
              This will erase their 256-D motion signature from the company partition and immediately revoke all access at all doors.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmEmployee(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/60 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteEmployee}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Employee</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: Mobile Setup Invite & Passkey Handover
          ========================================================= */}
      {inviteModalEmp && (
        <div
          onClick={() => setInviteModalEmp(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#040406]/85 backdrop-blur-2xl animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-[#111118] border border-white/10 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-left"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    Mobile Setup &amp; Passkey
                  </h3>
                  <span className="text-xs text-white/50 font-mono">
                    {inviteModalEmp.name} ({inviteModalEmp.template_id})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalEmp(null)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Section 1: 1-Click Mobile Setup Link */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/90 uppercase tracking-wider font-mono">
                  1. Mobile Setup Invite Link
                </span>
                <span className="text-[11px] font-mono text-emerald-400">Zero Password Required</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed font-light">
                Send this link to {inviteModalEmp.name}. When opened on an Android phone, it downloads the APK and activates their passkey in 1 tap.
              </p>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono">
                <span className="text-indigo-300 truncate flex-1 select-all">
                  {`${window.location.origin}/setup?tenant=${encodeURIComponent(activeTenantId)}&emp=${encodeURIComponent(inviteModalEmp.template_id)}`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/setup?tenant=${encodeURIComponent(activeTenantId)}&emp=${encodeURIComponent(inviteModalEmp.template_id)}`;
                    navigator.clipboard.writeText(url);
                    setCopiedSetupLink(true);
                    toast.success("Setup link copied to clipboard!");
                    setTimeout(() => setCopiedSetupLink(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 hover:text-white transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedSetupLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSetupLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Section 2: Facility Passkey String */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-xs font-semibold text-white/90 uppercase tracking-wider font-mono">
                2. Sealed Device Passkey
              </span>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/10">
                <div>
                  <span className="text-sm font-mono font-bold text-white tracking-wider block">
                    {`${activeTenantId}:${inviteModalEmp.template_id}`}
                  </span>
                  <span className="text-[11px] text-white/40 font-mono">
                    Company: {activeTenantId} • Operative: {inviteModalEmp.template_id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${activeTenantId}:${inviteModalEmp.template_id}`);
                    setCopiedPasskey(true);
                    toast.success("Passkey copied!");
                    setTimeout(() => setCopiedPasskey(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-mono shrink-0 cursor-pointer"
                >
                  {copiedPasskey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPasskey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Section 3: Email Dispatch */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/90 uppercase tracking-wider font-mono">
                  3. Send Setup Email
                </span>
                {inviteModalEmp.email && (
                  <span className="text-[11px] font-mono text-white/40">{inviteModalEmp.email}</span>
                )}
              </div>

              {inviteModalEmp.email ? (
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={async () => {
                    setIsSendingEmail(true);
                    const toastId = toast.loading(`Sending invite to ${inviteModalEmp.email}...`);
                    try {
                      await sendEmployeeInviteEmail({
                        tenantId: activeTenantId,
                        employeeId: inviteModalEmp.template_id || inviteModalEmp.id,
                        employeeName: inviteModalEmp.name,
                        employeeEmail: inviteModalEmp.email,
                        companyName: workspace?.companyName || user?.organization || 'Ram Chandra and Sons',
                      });

                      try {
                        const empDocRef = doc(db, 'organizations', activeTenantId, 'employees', inviteModalEmp.id);
                        await updateDoc(empDocRef, {
                          setup_status: 'INVITED',
                          invited_at: new Date().toISOString()
                        });
                      } catch (fsErr) {
                        console.warn('Could not update setup_status:', fsErr);
                      }

                      setEmailSentSuccess(true);
                      toast.success(`Invitation email sent to ${inviteModalEmp.email}!`, { id: toastId });
                    } catch (err) {
                      console.error('Invite error:', err);
                      toast.error(err.message || 'Failed to dispatch email.', { id: toastId });
                    } finally {
                      setIsSendingEmail(false);
                    }
                  }}
                  className={`w-full py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    emailSentSuccess
                      ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-200'
                      : 'bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-200 hover:text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Sending Invitation...</span>
                    </>
                  ) : emailSentSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Invitation Sent to {inviteModalEmp.email}</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 text-indigo-400" />
                      <span>Send Invitation Email to {inviteModalEmp.email}</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={editEmailInput}
                    onChange={(e) => setEditEmailInput(e.target.value)}
                    placeholder="Enter work email (e.g. jensen@work.com)"
                    className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs font-mono placeholder-white/30 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    disabled={isSavingEmail || !editEmailInput.trim()}
                    onClick={async () => {
                      if (!editEmailInput.trim() || !editEmailInput.includes('@')) {
                        toast.error("Please enter a valid email address.");
                        return;
                      }
                      setIsSavingEmail(true);
                      try {
                        const empDocRef = doc(db, 'organizations', activeTenantId, 'employees', inviteModalEmp.id);
                        await updateDoc(empDocRef, {
                          email: editEmailInput.trim().toLowerCase(),
                          setup_status: 'INVITE_READY',
                          updated_at: new Date().toISOString()
                        });
                        setInviteModalEmp((prev) => prev ? { ...prev, email: editEmailInput.trim().toLowerCase() } : null);
                        toast.success("Email saved successfully!");
                      } catch (err) {
                        toast.error("Failed to save email: " + err.message);
                      } finally {
                        setIsSavingEmail(false);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[#A477FF] hover:bg-[#B18BFF] text-[#100A1C] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingEmail ? 'Saving...' : 'Save Email'}
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <a
                href={`/setup?tenant=${encodeURIComponent(activeTenantId)}&emp=${encodeURIComponent(inviteModalEmp.template_id)}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-white/50 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Preview Mobile Page</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                type="button"
                onClick={() => setInviteModalEmp(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeeRoster;
