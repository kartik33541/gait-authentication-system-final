import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users, Power, ArrowRight, Sliders } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

/**
 * WorkspaceCard Component
 * Interactive card displaying perimeter metrics and server power controls.
 * @param {object} props
 * @param {object} props.workspace
 * @param {function} props.onToggleState
 */
export const WorkspaceCard = ({ workspace, onToggleState }) => {
  const navigate = useNavigate();
  const isLive = workspace.serverState === 'LIVE';

  const handlePowerToggle = (e) => {
    e.stopPropagation();
    onToggleState(workspace.id);
    toast.success(`Perimeter '${workspace.name}' server state toggled.`);
  };

  return (
    <GlassPanel
      hoverEffect
      onClick={() => navigate(`/active-workspace?id=${workspace.id}`)}
      className="h-full flex flex-col justify-between p-6 md:p-8 border-[--border-subtle] transition-all duration-300"
    >
      <div>
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[var(--radius-md)] bg-[--bg-elevated-2] border border-[--border-subtle]">
              <Shield className="w-5 h-5 text-[--accent-indigo]" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[--text-primary] truncate max-w-[220px] sm:max-w-xs">{workspace.name}</h3>
              <div className="flex items-center gap-2 text-micro font-mono text-[--text-muted]">
                <span>ID: {workspace.id.toUpperCase()}</span>
                <span>•</span>
                <span className="text-[--accent-violet] font-semibold">{workspace.threshold || 'Balanced'} Guard</span>
              </div>
            </div>
          </div>

          <Badge
            variant={isLive ? 'success' : 'neutral'}
            pulsing={isLive}
            className="text-xs shrink-0 font-mono"
          >
            {isLive ? '● ENGINE LIVE' : '○ STANDBY'}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-[--text-secondary] leading-relaxed mb-6 line-clamp-2">
          {workspace.description || 'Zero-trust biometric temporal perimeter configured with Siamese LSTM embeddings.'}
        </p>
      </div>

      {/* Metrics & Action Footer */}
      <div className="pt-5 border-t border-[--border-subtle]/50 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs font-mono text-[--text-secondary]">
          <div className="flex items-center gap-1.5" title="Enrolled Personnel">
            <Users className="w-4 h-4 text-[--accent-violet]" />
            <span className="font-bold text-[--text-primary]">{workspace.persons?.length || 0}</span>
            <span className="text-[--text-muted]">Nodes</span>
          </div>
          <div className="flex items-center gap-1.5" title="Kinetic Similarity">
            <Sliders className="w-4 h-4 text-[--accent-success]" />
            <span className="font-bold text-[--text-primary]">99.7%</span>
            <span className="text-[--text-muted]">ROC</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant={isLive ? "ghost" : "secondary"}
            size="sm"
            onClick={handlePowerToggle}
            aria-label={isLive ? "Pause perimeter server" : "Initialize server"}
            className="!px-3 text-xs font-mono"
          >
            <Power className={cn("w-3.5 h-3.5", isLive ? "text-[--accent-success]" : "text-[--text-muted]")} />
            <span className="hidden sm:inline">{isLive ? "LIVE" : "PAUSED"}</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={ArrowRight}
            className="font-semibold text-xs px-4"
          >
            Console
          </Button>
        </div>
      </div>
    </GlassPanel>
  );
};

export default WorkspaceCard;
