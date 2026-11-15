import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Check, 
  X, 
  AlertTriangle, 
  Lock, 
  Activity, 
  Upload, 
  Trash2, 
  Loader2, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ChevronDown
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { db } from '../../firebase';
import { 
  collection, 
  onSnapshot, 
  getDocs, 
  query, 
  where, 
  writeBatch 
} from 'firebase/firestore';
import { 
  verifyEmployeeGait, 
  inspectWalkCsvText, 
  refreshCsvTimestamps,
  getMlApiBaseUrl 
} from '../../lib/biometricApi';
import { SAMPLE_WALKS } from '../../lib/sampleWalks';
import toast from 'react-hot-toast';

export const TestWalkModal = ({ isOpen, onClose, tenantId }) => {
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  
  // Selection States
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [useCustomId, setUseCustomId] = useState(false);
  const [customEmpId, setCustomEmpId] = useState('EMP-999');

  // Walk Source: 'preset' | 'custom'
  const [walkSource, setWalkSource] = useState('preset');
  const [selectedPresetId, setSelectedPresetId] = useState('person1_natural');
  const [customCsvText, setCustomCsvText] = useState('');
  const [customFileName, setCustomFileName] = useState('');

  // Options
  const [autoRefreshTimestamps, setAutoRefreshTimestamps] = useState(true);

  // Execution & Result
  const [isVerifying, setIsVerifying] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [verifyError, setVerifyError] = useState(null);

  // Cleanup State
  const [isClearingLogs, setIsClearingLogs] = useState(false);

  // 1. Subscribe to Live Firestore Employees
  useEffect(() => {
    if (!isOpen || !tenantId) return;

    const empsRef = collection(db, 'organizations', tenantId, 'employees');
    const unsub = onSnapshot(empsRef, (snap) => {
      const list = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        const tmpl = d.master_templates || {};
        let t1Norm = 0.0;
        if (tmpl && tmpl.t1 && Array.isArray(tmpl.t1)) {
          const sumSq = tmpl.t1.reduce((sum, v) => sum + (Number(v) * Number(v)), 0);
          t1Norm = Math.sqrt(sumSq);
        }

        list.push({
          id: docSnap.id,
          name: d.name || 'Enrolled Operative',
          template_id: d.template_id || docSnap.id,
          status: String(d.status || 'ACTIVE').toUpperCase(),
          readings_count: Number(d.readings_count || 0),
          t1Norm: Math.round(t1Norm * 1000) / 1000,
          isLegacySynthetic: t1Norm > 0 && t1Norm < 0.85,
        });
      });

      list.sort((a, b) => a.template_id.localeCompare(b.template_id));
      setEmployees(list);
      setIsLoadingEmployees(false);

      if (list.length > 0) {
        setSelectedEmpId((prev) => prev || list[0].template_id);
      }
    }, (err) => {
      console.error('Firestore employees load error:', err);
      setIsLoadingEmployees(false);
    });

    return () => unsub();
  }, [isOpen, tenantId]);

  // Selected Employee Details
  const selectedEmployee = useMemo(() => {
    if (useCustomId) return null;
    return employees.find((e) => e.template_id === selectedEmpId) || null;
  }, [employees, selectedEmpId, useCustomId]);

  // Effective Active Raw CSV
  const activeCsvText = useMemo(() => {
    if (walkSource === 'custom') return customCsvText;
    const preset = SAMPLE_WALKS.find((w) => w.id === selectedPresetId);
    return preset ? preset.csvData : '';
  }, [walkSource, selectedPresetId, customCsvText]);

  // Preflight Inspection
  const csvInspection = useMemo(() => {
    return inspectWalkCsvText(activeCsvText);
  }, [activeCsvText]);

  // Handle File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a valid .csv sensor file.');
      return;
    }

    setCustomFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomCsvText(event.target?.result || '');
      setWalkSource('custom');
    };
    reader.onerror = () => toast.error('Failed to read CSV file.');
    reader.readAsText(file);
  };

  // Run Biometric Verification
  const handleRunVerification = async () => {
    const effectiveTemplateId = useCustomId ? customEmpId.trim() : selectedEmpId;
    if (!effectiveTemplateId) {
      toast.error('Please select or specify a template / employee ID.');
      return;
    }

    if (!activeCsvText || !csvInspection.isValid) {
      toast.error(csvInspection.error || 'Please provide a valid walking CSV (min 256 rows, 6-axis columns).');
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);
    setResultData(null);

    try {
      const finalCsv = autoRefreshTimestamps ? refreshCsvTimestamps(activeCsvText) : activeCsvText;
      const response = await verifyEmployeeGait({
        tenantId,
        templateId: effectiveTemplateId,
        csvData: finalCsv,
        isSimulation: true,
      });

      setResultData(response);
      if (response.granted) {
        toast.success(`Access Granted! Match: ${(response.score * 100).toFixed(1)}%`);
      } else {
        toast.error(`Access Denied: ${response.reason}`);
      }
    } catch (err) {
      setVerifyError(err.message || 'Failed to communicate with Biometric Server.');
      toast.error(err.message || 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Clear Simulation Logs
  const handleClearSimulationLogs = async () => {
    if (!tenantId) return;
    setIsClearingLogs(true);
    try {
      const logsRef = collection(db, 'organizations', tenantId, 'access_logs');
      const q = query(logsRef, where('is_simulation', '==', true));
      const snap = await getDocs(q);

      if (snap.empty) {
        toast('No simulation logs found to clean.');
        return;
      }

      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      toast.success(`Cleared ${snap.size} simulation log${snap.size === 1 ? '' : 's'} from database.`);
    } catch (err) {
      console.error('Error clearing simulation logs:', err);
      toast.error('Failed to clear simulation logs.');
    } finally {
      setIsClearingLogs(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Live Gate CSV Verification Simulator" className="max-w-3xl">
      <div className="space-y-6 text-left">
        
        {/* Banner Note */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200">
          <Activity className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-white block font-semibold">End-to-End Flask & Firestore Biometric Gate</strong>
            <p className="text-indigo-200/80 leading-relaxed font-light">
              Executes a genuine 1:1 Siamese LSTM match check on <span className="font-mono text-white">{getMlApiBaseUrl()}</span> against the employee's active Cloud Firestore template vault. Real-time telemetry logs update your dashboard automatically.
            </p>
          </div>
        </div>

        {/* 1. Identity Target Selection */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-white/90 uppercase tracking-wider font-mono">
              1. Claimed Employee Identity
            </label>
            <button
              type="button"
              onClick={() => setUseCustomId(!useCustomId)}
              className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              {useCustomId ? '← Pick from Enrolled Roster' : '+ Test Unregistered / Custom ID'}
            </button>
          </div>

          {!useCustomId ? (
            <div className="space-y-2">
              <div className="relative">
                <select
                  disabled={isLoadingEmployees || employees.length === 0}
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                >
                  {employees.map((emp) => (
                    <option key={emp.template_id} value={emp.template_id} className="bg-[#121216] text-white">
                      {emp.template_id} — {emp.name} ({emp.status}) {emp.isLegacySynthetic ? '⚠️ Legacy Dummy' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-white/40 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {selectedEmployee?.isLegacySynthetic && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    Warning: <strong>{selectedEmployee.name}</strong> holds a pre-Issue 5 synthetic template (Norm: {selectedEmployee.t1Norm}). Re-enroll with real CSVs in Roster to test genuine matching.
                  </span>
                </div>
              )}

              {selectedEmployee && (
                <div className="flex items-center gap-3 text-[11px] font-mono text-white/40 px-1">
                  <span>Status: <strong className={selectedEmployee.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'}>{selectedEmployee.status}</strong></span>
                  <span>•</span>
                  <span>Enrolled Baseline: {selectedEmployee.readings_count} walks</span>
                  <span>•</span>
                  <span>Unit Norm: {selectedEmployee.t1Norm}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <input
                type="text"
                value={customEmpId}
                onChange={(e) => setCustomEmpId(e.target.value)}
                placeholder="EMP-999 or unregistered passkey"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <span className="text-[11px] text-white/40 font-mono block">
                Use an unregistered badge ID (e.g. EMP-999) to verify that the security gate rejects unknown entities with 404 EMPLOYEE_NOT_FOUND.
              </span>
            </div>
          )}
        </div>

        {/* 2. Walk Recording Source */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-white/90 uppercase tracking-wider font-mono">
            2. Walking Sensor Recording (.CSV)
          </label>

          {/* Preset Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SAMPLE_WALKS.map((preset) => {
              const isSelected = walkSource === 'preset' && selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setWalkSource('preset');
                    setSelectedPresetId(preset.id);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-white shadow-lg'
                      : 'bg-white/[0.02] border-white/5 text-white/60 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-white">{preset.title}</span>
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-400' : 'bg-white/20'}`} />
                  </div>
                  <p className="text-[11px] text-white/40 leading-snug line-clamp-2">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Or Upload Custom CSV */}
          <div className="pt-2">
            <div className={`p-4 rounded-xl border transition-all ${
              walkSource === 'custom' 
                ? 'bg-indigo-500/10 border-indigo-500/30' 
                : 'bg-white/[0.02] border-white/5 hover:border-white/10'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-white block">
                      {walkSource === 'custom' && customFileName ? customFileName : 'Upload custom walking CSV'}
                    </span>
                    <span className="text-[11px] text-white/40 font-mono">
                      Must contain 6-axis columns (timestamp, ax, ay, az, wx, wy, wz)
                    </span>
                  </div>
                </div>

                <label className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-mono text-white transition-colors cursor-pointer self-start sm:self-auto shrink-0">
                  <span>Browse .CSV</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* CSV Preflight Status */}
          {activeCsvText && (
            <div className={`flex items-center justify-between p-3 rounded-xl border text-xs font-mono ${
              csvInspection.isValid 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                {csvInspection.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>
                  {csvInspection.isValid 
                    ? `Ready: ${csvInspection.rows} samples (~${csvInspection.durationSec}s) · 6-axis valid` 
                    : csvInspection.error}
                </span>
              </div>

              {csvInspection.isEpoch && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/60">
                  Archived Epoch Timestamps
                </span>
              )}
            </div>
          )}
        </div>

        {/* 3. Live Walk Simulation Option */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-white block">Live Walk Timestamp Simulation</span>
            <span className="text-[11px] text-white/40 font-light block">
              Auto-refreshes historical recording timestamps to right now so older test walks do not trigger REPLAY_ATTACK. Uncheck to test replay attack detection.
            </span>
          </div>
          <input
            type="checkbox"
            checked={autoRefreshTimestamps}
            onChange={(e) => setAutoRefreshTimestamps(e.target.checked)}
            className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
          />
        </div>

        {/* 4. Verification Action */}
        <div className="pt-2">
          <Button
            variant="primary"
            disabled={isVerifying || !csvInspection.isValid}
            onClick={handleRunVerification}
            className="w-full !py-3.5 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg shadow-indigo-500/20"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Running Siamese LSTM Inference & Governance...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white text-white" />
                <span>Run Live Gate Verification</span>
              </>
            )}
          </Button>
        </div>

        {/* 5. Error Banner */}
        {verifyError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <X className="w-4 h-4 text-rose-400" />
              <span>Gate Verification Failed</span>
            </div>
            <p className="font-light text-rose-200/80">{verifyError}</p>
          </div>
        )}

        {/* 6. Gate Outcome Result Card */}
        {resultData && (
          <div className={`p-5 rounded-2xl border space-y-4 transition-all ${
            resultData.granted
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : resultData.reason === 'ACCESS_PAUSED'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-rose-500/10 border-rose-500/30'
          }`}>
            
            {/* Header / Decision */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ring-1 ${
                  resultData.granted 
                    ? 'bg-emerald-500/20 ring-emerald-500/40 text-emerald-400' 
                    : resultData.reason === 'ACCESS_PAUSED'
                      ? 'bg-amber-500/20 ring-amber-500/40 text-amber-400'
                      : 'bg-rose-500/20 ring-rose-500/40 text-rose-400'
                }`}>
                  {resultData.granted ? (
                    <Check className="w-5 h-5 stroke-[3]" />
                  ) : resultData.reason === 'ACCESS_PAUSED' ? (
                    <Lock className="w-5 h-5" />
                  ) : (
                    <X className="w-5 h-5 stroke-[3]" />
                  )}
                </div>

                <div>
                  <h4 className="text-base font-bold text-white leading-tight">
                    {resultData.result}
                  </h4>
                  <p className="text-xs font-mono text-white/50 mt-0.5">
                    Flag: <strong className="text-white">{resultData.reason}</strong> · HTTP {resultData.httpStatus}
                  </p>
                </div>
              </div>

              {/* Match Score Badge */}
              <div className="text-right">
                <span className="text-lg font-mono font-bold text-white block">
                  {(resultData.score * 100).toFixed(1)}%
                </span>
                <span className="text-[11px] font-mono text-white/40 block">
                  Req: {(resultData.threshold * 100).toFixed(0)}% ({resultData.strictnessMode})
                </span>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-[11px] font-mono">
              <div className="p-2 rounded-lg bg-white/[0.02]">
                <span className="text-white/40 block">Clips Matched</span>
                <span className="text-white font-semibold">{resultData.matchedWindows} / {resultData.windowsEvaluated}</span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02]">
                <span className="text-white/40 block">Policy Mode</span>
                <span className="text-white font-semibold">{resultData.strictnessMode}</span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02]">
                <span className="text-white/40 block">Night Strict</span>
                <span className={resultData.nightStrictActive ? 'text-amber-400 font-semibold' : 'text-white/60'}>
                  {resultData.nightStrictActive ? 'ACTIVE (85%)' : 'OFF'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02]">
                <span className="text-white/40 block">Response Time</span>
                <span className="text-white font-semibold">{resultData.responseTimeSec}s</span>
              </div>
            </div>

            {/* AI Biomechanical Reasoning */}
            {resultData.message && (
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#A477FF] uppercase tracking-wider font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Biomechanical Diagnostics (gpt-5.4-nano)</span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed font-light">
                  {resultData.message}
                </p>
              </div>
            )}

            {/* Firestore Telemetry Auto-Purge Notice */}
            <div className="flex items-center justify-between text-[11px] font-mono text-white/40 pt-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Simulated walk logged · Auto-deletes in 2 minutes</span>
              </div>
              {resultData.logRecorded && (
                <span className="text-emerald-400 font-medium">✓ Logged to Gate-01</span>
              )}
            </div>

          </div>
        )}

        {/* 7. Footer Actions: Close & Clear Test Logs */}
        <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            disabled={isClearingLogs}
            onClick={handleClearSimulationLogs}
            className="flex items-center gap-1.5 text-xs font-mono text-rose-400/80 hover:text-rose-300 transition-colors cursor-pointer disabled:opacity-50"
            title="Purge all simulation test walks from Firestore access_logs immediately"
          >
            {isClearingLogs ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>Clear Simulation Logs Now</span>
          </button>

          <Button variant="ghost" size="sm" onClick={onClose} className="self-end sm:self-auto">
            Close
          </Button>
        </div>

      </div>
    </Modal>
  );
};

export default TestWalkModal;