import React, { useState } from 'react';
import { Shield, Sliders, FileText } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

/**
 * StepNameDescription Component (Step 1)
 * Captures workspace organization profile, threshold sensitivity, and description.
 * @param {object} props
 * @param {object} props.initialData
 * @param {function} props.onNext
 */
export const StepNameDescription = ({ initialData, onNext }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [threshold, setThreshold] = useState(initialData?.threshold || 'Balanced');

  const thresholds = [
    { id: 'Balanced', label: 'Balanced (Recommended)', desc: 'Optimal balance between security and user convenience. 99.4% ROC efficiency.', color: 'border-[--accent-indigo]' },
    { id: 'High Security', label: 'High Security', desc: 'Stricter kinetic similarity thresholds. Ideal for server rooms and financial hubs.', color: 'border-[--accent-violet]' },
    { id: 'Extreme Perimeter', label: 'Extreme Zero-Trust', desc: 'Zero tolerance for kinetic drift. Requires 5 consecutive matched steps to grant door relays.', color: 'border-[--accent-pink]' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a valid perimeter workspace name.");
      return;
    }
    onNext({ name, description, threshold });
  };

  return (
    <GlassPanel className="p-8 md:p-12 max-w-3xl mx-auto border-[--border-strong] shadow-xl">
      <div className="flex items-center gap-3 pb-6 mb-8 border-b border-[--border-subtle]">
        <div className="p-3 bg-[--bg-elevated-2] rounded-[var(--radius-md)] border border-[--border-subtle]">
          <Shield className="w-6 h-6 text-[--accent-indigo]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[--text-primary]">Configure Perimeter Profile</h2>
          <p className="text-sm text-[--text-secondary]">Set up your organization parameters and Siamese kinetic similarity thresholds.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Perimeter / Workspace Name"
          placeholder="e.g., Vault Cluster North-East or R&D Bio-Lab"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-[--text-secondary] uppercase tracking-wider select-none">
            Workspace Description & Access Policy
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe facility zoning rules, required security clearance level, and primary access times..."
            className="w-full bg-[--bg-elevated-2] border border-[--border-subtle] focus:border-[--accent-indigo] rounded-[var(--radius-md)] text-sm text-[--text-primary] placeholder-[--text-muted] px-4 py-3 outline-none transition-all resize-none"
          />
        </div>

        {/* Security Threshold Selector */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-[--text-secondary] uppercase tracking-wider flex items-center gap-2 select-none">
            <Sliders className="w-3.5 h-3.5 text-[--accent-violet]" />
            <span>Kinetic Similarity Threshold</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {thresholds.map((t) => {
              const isSelected = threshold === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setThreshold(t.id)}
                  className={cn(
                    "p-4 rounded-[var(--radius-md)] bg-[--bg-elevated-2] border cursor-pointer transition-all select-none flex flex-col justify-between",
                    isSelected
                      ? "border-[--accent-indigo] ring-1 ring-[--accent-indigo]/50 bg-[--bg-elevated] shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                      : "border-[--border-subtle] hover:border-[--border-strong]"
                  )}
                >
                  <div className="font-semibold text-sm text-[--text-primary] mb-1">{t.label}</div>
                  <p className="text-xs text-[--text-muted] leading-normal">{t.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-6 border-t border-[--border-subtle]/50 flex justify-end gap-4">
          <Button type="submit" variant="primary" size="lg" className="px-8 font-semibold">
            Next: Define Personnel Nodes →
          </Button>
        </div>
      </form>
    </GlassPanel>
  );
};

export default StepNameDescription;
