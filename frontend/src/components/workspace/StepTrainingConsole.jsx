import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Terminal as TerminalIcon, CheckCircle2, ShieldAlert, Rocket } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { GlassPanel } from '../ui/GlassPanel';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { GradientText } from '../ui/GradientText';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

/**
 * StepTrainingConsole Component (Step 4)
 * Simulated live GPU contrastive training studio with real-time terminal output and loss descent graph.
 * @param {object} props
 * @param {function} props.onComplete
 * @param {function} props.onBack
 */
export const StepTrainingConsole = ({ onComplete, onBack }) => {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([
    "System READY. Waiting for operator signal to initialize CUDA tensors...",
    "Found 15 temporal gait feature sequences in local biometric vault.",
  ]);
  const [chartData, setChartData] = useState([
    { epoch: 0, loss: 1.25, accuracy: 48.0 }
  ]);
  const [isDone, setIsDone] = useState(false);

  const startTraining = () => {
    setIsTraining(true);
    setProgress(0);
    setLogs([
      "INITIALIZING SIAMESE LSTM CONTRASTIVE ENGINE...",
      "Allocating GPU Tensor Core memory...",
      "Normalizing 3-axis accelerometer zero-g offsets & gravitational noise...",
      "Synthesizing negative anchor triplets via hard-negative mining..."
    ]);

    let epoch = 1;
    let currentLoss = 1.15;
    let currentAcc = 52.4;

    const interval = setInterval(() => {
      if (epoch > 30) {
        clearInterval(interval);
        setIsTraining(false);
        setIsDone(true);
        setLogs(prev => [
          ...prev,
          "-------------------------------------------------------------",
          "🎉 MODEL SYNC COMPLETE! Epoch 30/30 finished.",
          "Final Loss: 0.0124 | Triplet Validation ROC Accuracy: 99.74%",
          "🔒 Encrypting 256-D metric space vault with organization master secret.",
          "PERIMETER READY FOR DEPLOYMENT."
        ]);
        toast.success("Siamese LSTM Trained & Cryptographically Encrypted!");
        return;
      }

      // Simulate decay in loss and rise in accuracy
      currentLoss = Math.max(0.012, currentLoss * (0.85 + Math.random() * 0.08));
      currentAcc = Math.min(99.7, currentAcc + (100 - currentAcc) * 0.18);
      const logLine = `Epoch ${epoch}/30: Triplet Loss = ${currentLoss.toFixed(4)} | ROC Accuracy = ${currentAcc.toFixed(1)}%`;
      
      setLogs(prev => [...prev, logLine]);
      setChartData(prev => [...prev, { epoch, loss: parseFloat(currentLoss.toFixed(3)), accuracy: parseFloat(currentAcc.toFixed(1)) }]);
      setProgress(Math.round((epoch / 30) * 100));

      epoch += 1;
    }, 200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <GlassPanel className="p-8 border-[--border-strong] shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[--border-subtle]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[--bg-elevated-2] rounded-[var(--radius-md)] border border-[--border-subtle]">
              <Cpu className="w-6 h-6 text-[--accent-pink]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[--text-primary]">Siamese LSTM Neural Training</h2>
              <p className="text-xs text-[--text-secondary]">Optimize contrastive triplet embeddings for zero-trust accuracy (ROC ≥ 99.5%).</p>
            </div>
          </div>
          {isDone ? (
            <Badge variant="success" pulsing className="font-mono">● MODEL ENCRYPTED & LIVE</Badge>
          ) : isTraining ? (
            <Badge variant="warning" pulsing className="font-mono">● CUDA EPOCHS RUNNING...</Badge>
          ) : (
            <Badge variant="neutral" className="font-mono">STATUS: STANDBY</Badge>
          )}
        </div>

        {/* Action Controls & Progress */}
        {!isTraining && !isDone ? (
          <div className="p-8 rounded-[var(--radius-lg)] bg-[--bg-elevated-2]/80 border border-[--border-subtle] text-center my-6 flex flex-col items-center justify-center gap-4">
            <h3 className="text-2xl font-bold text-[--text-primary]">Ready to train your organization model</h3>
            <p className="text-sm text-[--text-secondary] max-w-lg leading-relaxed">
              We will compile the captured walking samples into resistant 256-D cryptographic embeddings. Takes roughly ~6 seconds on GPU.
            </p>
            <Button
              variant="primary"
              size="lg"
              icon={Rocket}
              onClick={startTraining}
              className="px-10 font-bold shadow-[0_0_35px_rgba(255,255,255,0.25)] text-base mt-2"
            >
              Start GPU Contrastive Training
            </Button>
          </div>
        ) : (
          <div className="space-y-6 my-4">
            <ProgressBar progress={progress} label={isDone ? "Training Protocol Finished (30/30 Epochs)" : `Simulating Neural Epochs (${progress}%)`} />

            {/* Simulated Live Loss Descent Chart */}
            <div className="h-64 w-full bg-[--bg-primary] p-4 rounded-[var(--radius-md)] border border-[--border-subtle]">
              <div className="flex items-center justify-between text-micro font-mono text-[--text-muted] uppercase mb-2">
                <span>Real-Time Triplet Loss Descent</span>
                <span className="text-[--accent-success]">ROC Accuracy: {chartData[chartData.length - 1]?.accuracy}%</span>
              </div>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={chartData}>
                  <XAxis dataKey="epoch" stroke="#8A8F9E" fontSize={10} tickLine={false} />
                  <YAxis stroke="#8A8F9E" fontSize={10} domain={[0, 'auto']} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#13141F', border: '1px solid #2A2D3A', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="loss" stroke="#EC4899" strokeWidth={2.5} dot={false} name="Loss" />
                  <Line type="monotone" dataKey="accuracy" stroke="#22D3A5" strokeWidth={2} dot={false} name="ROC Accuracy (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Terminal Live Output */}
        <div className="space-y-2 mt-6">
          <div className="flex items-center gap-2 text-xs font-mono text-[--text-secondary]">
            <TerminalIcon className="w-3.5 h-3.5 text-[--accent-indigo]" />
            <span>SIAMESE_CUDA_STDOUT_CONSOLE</span>
          </div>
          <div className="h-48 bg-[--bg-primary] rounded-[var(--radius-md)] p-4 font-mono text-xs text-[#22D3A5] border border-[--border-strong] overflow-y-auto space-y-1 shadow-inner select-auto">
            {logs.map((log, index) => (
              <div key={index} className={cn("leading-relaxed", log.includes("Error") && "text-[--accent-danger]", log.includes("COMPLETE") && "font-bold text-white")}>
                <span className="text-[--text-muted] mr-2">[{new Date().toLocaleTimeString()}]</span>
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Success Completion Banner */}
        <AnimatePresence>
          {isDone && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-6 rounded-[var(--radius-lg)] bg-[--accent-success]/10 border border-[--accent-success]/40 flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-8 h-8 text-[--accent-success] shrink-0" />
                <div>
                  <h4 className="text-lg font-bold text-white">Biometric Vault Cryptographic Sync Complete!</h4>
                  <p className="text-xs text-[--text-secondary]">Your organization perimeter is secured and ready to verify live employee mobile streams.</p>
                </div>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={onComplete}
                className="font-bold px-8 shadow-[0_0_30px_rgba(34,211,165,0.4)] bg-[#22D3A5] text-[#07070C] hover:bg-[#22D3A5]/90"
              >
                Deploy Active Workspace →
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassPanel>

      {/* Footer Controls */}
      <div className="pt-6 border-t border-[--border-subtle]/50 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} disabled={isTraining} className="font-medium">
          ← Back to Enrollment Studio
        </Button>
      </div>
    </div>
  );
};

export default StepTrainingConsole;
