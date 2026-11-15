import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Play, CheckCircle2, Shield, Loader2 } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

/**
 * StepEnrollmentMonitor Component (Step 3)
 * Immersive simulation studio for capturing five 60s walking sessions per employee node.
 * @param {object} props
 * @param {Array} props.persons
 * @param {function} props.onUpdatePersons
 * @param {function} props.onBack
 * @param {function} props.onNext
 */
export const StepEnrollmentMonitor = ({ persons = [], onUpdatePersons, onBack, onNext }) => {
  const [activeRecordingId, setActiveRecordingId] = useState(null);
  const [recordingProgress, setRecordingProgress] = useState(0);

  // Simulates capturing a walk session for a target person
  const handleStartSimulatedWalk = (personId) => {
    if (activeRecordingId) {
      toast.error("A sensor recording stream is already open. Please complete current walk.");
      return;
    }

    const targetPerson = persons.find(p => p.id === personId);
    if (!targetPerson) return;

    const nextPendingReading = targetPerson.readings.find(r => r.status !== 'completed');
    if (!nextPendingReading) {
      toast.success("All 5 biometric sessions complete for this node!");
      return;
    }

    setActiveRecordingId(personId);
    setRecordingProgress(0);

    // Mark target reading as in progress
    const updatedPersons = persons.map(p => {
      if (p.id !== personId) return p;
      return {
        ...p,
        readings: p.readings.map(r => r.id === nextPendingReading.id ? { ...r, status: 'recording' } : r)
      };
    });
    onUpdatePersons(updatedPersons);

    // Run simulated countdown interval (100ms ticks to reach 100% in ~2.5 seconds)
    const interval = setInterval(() => {
      setRecordingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setActiveRecordingId(null);

          // Finalize reading completion
          onUpdatePersons(persons => persons.map(p => {
            if (p.id !== personId) return p;
            const finalizedReadings = p.readings.map(r => r.id === nextPendingReading.id ? { ...r, status: 'completed' } : r);
            const allDone = finalizedReadings.every(r => r.status === 'completed');
            return {
              ...p,
              readings: finalizedReadings,
              enrollmentStatus: allDone ? 'completed' : 'in_progress'
            };
          }));
          toast.success(`Reading #${nextPendingReading.id} captured & embedded successfully!`);
          return 0;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handleSimulateAll = () => {
    toast.loading("Automated test script capturing all remaining walk readings...", { duration: 1500 });
    setTimeout(() => {
      onUpdatePersons(persons => persons.map(p => ({
        ...p,
        enrollmentStatus: 'completed',
        readings: p.readings.map(r => ({ ...r, status: 'completed' }))
      })));
      toast.success("All employee nodes enrolled via test simulator!");
    }, 1500);
  };

  const allPersonsEnrolled = persons.every(p => p.readings.every(r => r.status === 'completed'));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <GlassPanel className="p-8 border-[--border-strong] shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[--border-subtle]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[--bg-elevated-2] rounded-[var(--radius-md)] border border-[--border-subtle]">
              <Activity className="w-6 h-6 text-[--accent-success]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[--text-primary]">Kinetic Enrollment Studio</h2>
              <p className="text-xs text-[--text-secondary]">Each node requires 5 natural walking readings (60s each) to train the invariant LSTM model.</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSimulateAll}
            disabled={allPersonsEnrolled || activeRecordingId !== null}
            className="text-xs shrink-0"
          >
            ⚡ Auto-Simulate All
          </Button>
        </div>

        {/* Personnel Cards */}
        <div className="space-y-4 mt-6">
          {persons.map((person) => {
            const isRecordingThis = activeRecordingId === person.id;
            const completedCount = person.readings.filter(r => r.status === 'completed').length;
            const isNodeDone = completedCount === 5;

            return (
              <GlassPanel
                key={person.id}
                className={cn(
                  "p-6 border transition-all duration-300",
                  isNodeDone ? "border-[--accent-success]/50 bg-[--accent-success]/5 shadow-[0_0_25px_rgba(34,211,165,0.1)]" : "border-[--border-subtle] bg-[--bg-elevated-2]/60"
                )}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-[--bg-primary] border border-[--border-strong] flex items-center justify-center font-bold text-base text-white shadow-inner">
                      {person.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-[--text-primary] flex items-center gap-2">
                        <span>{person.name}</span>
                        {isNodeDone && <Badge variant="success" className="text-[10px] py-0.5">Ready for LSTM</Badge>}
                      </h4>
                      <p className="text-xs text-[--text-muted] font-mono">{person.role} • {completedCount}/5 Readings Captured</p>
                    </div>
                  </div>

                  {/* Trigger Simulate Walk CTA */}
                  <div>
                    {!isNodeDone ? (
                      <Button
                        variant={isRecordingThis ? "danger" : "primary"}
                        size="sm"
                        icon={isRecordingThis ? Loader2 : Play}
                        onClick={() => handleStartSimulatedWalk(person.id)}
                        disabled={activeRecordingId !== null && !isRecordingThis}
                        className={cn("font-medium shadow-sm min-w-[200px] justify-center", isRecordingThis && "animate-pulse")}
                      >
                        {isRecordingThis ? `Capturing (${recordingProgress}%)...` : "Simulate Walk (#" + (completedCount + 1) + ")"}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-semibold text-[--accent-success] font-mono">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>CAPTURES COMPLETE</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Progress Bar during active recording */}
                {isRecordingThis && (
                  <div className="mt-4 pt-4 border-t border-[--border-subtle]/50">
                    <ProgressBar progress={recordingProgress} label="Capturing 3-Axis Gyroscopic & Accelerometer Vectors..." />
                  </div>
                )}

                {/* 5-Checkpoint Indicator Strip */}
                <div className="grid grid-cols-5 gap-2.5 mt-5 pt-4 border-t border-[--border-subtle]/30">
                  {person.readings.map((r, i) => {
                    const isCompleted = r.status === 'completed';
                    const isCurrentlyActive = r.status === 'recording';

                    return (
                      <div
                        key={r.id}
                        className={cn(
                          "p-2 rounded-[var(--radius-sm)] text-center font-mono text-xs border transition-colors flex flex-col items-center justify-center gap-1",
                          isCompleted ? "bg-[--accent-success]/15 border-[--accent-success]/40 text-[--accent-success]" :
                          isCurrentlyActive ? "bg-[--accent-warning]/20 border-[--accent-warning] text-[--accent-warning] animate-pulse" :
                          "bg-[--bg-primary] border-[--border-subtle] text-[--text-muted]"
                        )}
                      >
                        <span className="text-micro font-bold">WALK 0{i+1}</span>
                        {isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : isCurrentlyActive ? (
                          <Activity className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span className="text-micro">60s</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </GlassPanel>
            );
          })}
        </div>
      </GlassPanel>

      {/* Footer Navigation */}
      <div className="pt-6 border-t border-[--border-subtle]/50 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="font-medium">
          ← Back to Personnel
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={onNext}
          disabled={!allPersonsEnrolled}
          className="font-semibold px-8 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
        >
          Next: Train Siamese LSTM →
        </Button>
      </div>
    </div>
  );
};

export default StepEnrollmentMonitor;
