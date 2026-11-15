import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Lock, 
  UserCheck 
} from 'lucide-react';
import { executeConfirmedAction } from '../../services/kennyActionGuard';

export const ActionCard = ({ card }) => {
  const [status, setStatus] = useState(card?.status || 'PENDING_CONFIRMATION');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionMessage, setExecutionMessage] = useState('');

  if (!card) return null;

  const handleConfirm = async () => {
    setIsExecuting(true);
    try {
      const res = await executeConfirmedAction(card);
      setStatus('COMMITTED');
      setExecutionMessage(res.message || 'Action executed successfully in Cloud Firestore.');
    } catch (err) {
      console.error(err);
      setStatus('FAILED');
      setExecutionMessage(err.message || 'Execution error');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCancel = () => {
    setStatus('CANCELLED');
    setExecutionMessage('Action cancelled by administrator. No database changes were made.');
  };

  return (
    <div className={`mt-3.5 w-full max-w-md rounded-2xl p-4 transition-all border ${
      status === 'COMMITTED'
        ? 'bg-emerald-950/20 border-emerald-500/30'
        : status === 'CANCELLED'
        ? 'bg-zinc-900/40 border-white/10 opacity-75'
        : 'bg-gradient-to-br from-[#1C1217] via-[#160E12] to-[#0D070A] border-amber-500/35 shadow-[0_10px_35px_rgba(0,0,0,0.6)]'
    }`}>
      
      {/* Header Strip */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/5 text-[11px] font-mono">
        <span className={`font-semibold tracking-wider uppercase flex items-center gap-1.5 ${
          status === 'COMMITTED' ? 'text-emerald-400' : status === 'CANCELLED' ? 'text-zinc-400' : 'text-amber-400'
        }`}>
          {status === 'COMMITTED' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Executed</span>
            </>
          ) : status === 'CANCELLED' ? (
            <>
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelled</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              <span>Confirmation Required</span>
            </>
          )}
        </span>
        <span className="text-zinc-500">
          Admin Approval
        </span>
      </div>

      {/* Action Title & Warning Body */}
      <div className="py-3">
        <h4 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
          {card.title}
        </h4>
        <p className="text-xs text-amber-300/80 mt-1 leading-relaxed bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
          {card.warning}
        </p>

        {/* Target Details */}
        <div className="mt-2 text-[11px] font-mono text-zinc-400 flex items-center gap-3">
          <span>Target: <strong className="text-white">{card.targetName}</strong></span>
          {card.targetId && <span>ID: <code className="text-indigo-300">{card.targetId}</code></span>}
        </div>

        {/* Execution Result Banner */}
        {executionMessage && (
          <div className={`mt-2.5 p-2 rounded-lg text-xs font-mono ${
            status === 'COMMITTED' ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20' : 'text-zinc-400 bg-white/5'
          }`}>
            {executionMessage}
          </div>
        )}
      </div>

      {/* Action Buttons (Only shown when pending confirmation) */}
      {status === 'PENDING_CONFIRMATION' && (
        <div className="flex items-center gap-2.5 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isExecuting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Executing...</span>
              </>
            ) : (
              <span>{card.confirmLabel || 'Confirm Action'}</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isExecuting}
            className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium border border-white/10 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Immutable Post-Action Lock */}
      {status !== 'PENDING_CONFIRMATION' && (
        <div className="pt-2 border-t border-white/5 text-[10px] text-zinc-500 font-mono flex items-center justify-between">
          <span>Action Recorded</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      )}

    </div>
  );
};

export default ActionCard;

