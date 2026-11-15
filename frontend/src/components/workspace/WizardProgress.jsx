import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * WizardProgress Component
 * Visualizes step indicators 1 to 4 with connected completion lines.
 * @param {object} props
 * @param {number} props.currentStep - Current step number (1 to 4)
 * @param {function} [props.onStepClick]
 */
export const WizardProgress = ({ currentStep = 1, onStepClick }) => {
  const steps = [
    { number: 1, label: "Perimeter Profile", sub: "Name & Threshold" },
    { number: 2, label: "Personnel Nodes", sub: "Define up to 15 Vaults" },
    { number: 3, label: "Gait Enrollment", sub: "5×60s Reading Capture" },
    { number: 4, label: "Siamese Training", sub: "GPU Contrastive Epochs" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-6 mb-8 select-none">
      <div className="flex items-center justify-between relative">
        {steps.map((step, idx) => {
          const isDone = currentStep > step.number;
          const isCurrent = currentStep === step.number;

          return (
            <React.Fragment key={step.number}>
              <div
                onClick={() => isDone && onStepClick && onStepClick(step.number)}
                className={cn(
                  "flex flex-col items-center relative z-10 transition-transform",
                  isDone && onStepClick ? "cursor-pointer hover:scale-105" : ""
                )}
              >
                <div
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center font-mono font-bold text-sm transition-all duration-300",
                    isDone && "bg-[--accent-success] text-[#07070C] shadow-[0_0_20px_rgba(34,211,165,0.4)]",
                    isCurrent && "bg-[--bg-primary] text-white border-[2px] border-transparent bg-gradient-to-tr from-[#6366F1] via-[#9B6BFF] to-[#EC4899] p-0.5 shadow-[0_0_25px_rgba(155,107,255,0.5)]",
                    !isDone && !isCurrent && "bg-[--bg-elevated-2] border border-[--border-subtle] text-[--text-muted]"
                  )}
                >
                  {isCurrent ? (
                    <div className="w-full h-full bg-[--bg-primary] rounded-full flex items-center justify-center text-white font-bold">
                      {step.number}
                    </div>
                  ) : isDone ? (
                    <Check className="w-5 h-5 stroke-[2.8]" />
                  ) : (
                    step.number
                  )}
                </div>
                <div className="text-center mt-2.5 max-w-[120px]">
                  <div className={cn("text-xs font-semibold leading-tight", isCurrent || isDone ? "text-[--text-primary]" : "text-[--text-muted]")}>
                    {step.label}
                  </div>
                  <div className="text-micro font-mono text-[--text-muted] mt-0.5 hidden sm:block">
                    {step.sub}
                  </div>
                </div>
              </div>

              {/* Connecting line between steps */}
              {idx < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-[--bg-elevated-2] mx-2 -mt-7 relative overflow-hidden rounded-full">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#6366F1] via-[#9B6BFF] to-[#EC4899]"
                    initial={{ width: 0 }}
                    animate={{ width: currentStep > step.number ? '100%' : '0%' }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default WizardProgress;
