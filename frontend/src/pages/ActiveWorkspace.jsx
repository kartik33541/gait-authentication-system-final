import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Shield, Power, Smartphone, Users, Lock, Unlock, MessageSquareCode } from 'lucide-react';
import { Footer } from '../components/layout/Footer';
import { PageShell } from '../components/layout/PageShell';
import { LiveBiometricStream } from '../components/dashboard/LiveBiometricStream';
import { ApkDownloadModal } from '../components/dashboard/ApkDownloadModal';
import { useWorkspace } from '../hooks/useWorkspace';
import { Button } from '../components/ui/Button';
import { GlassPanel } from '../components/ui/GlassPanel';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

/**
 * ActiveWorkspace Console Page Component
 * Live monitoring feed and door-relay management terminal for an active organization workspace.
 */
export const ActiveWorkspace = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { workspaces, toggleServerState } = useWorkspace();
  
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  // Determine target workspace from query ID or fallback to the first active perimeter
  const queryId = searchParams.get('id');
  const workspace = workspaces.find(w => w.id === queryId) || workspaces[0];

  const [doorRelays, setDoorRelays] = useState(
    workspace?.persons?.map(p => ({ personId: p.id, status: 'GRANTED' })) || []
  );

  if (!workspace) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-[--bg-primary]">
        <Navbar />
        <PageShell className="items-center justify-center text-center my-auto">
          <h2 className="text-2xl font-bold text-[--text-primary] mb-2">No Active Perimeters Configured</h2>
          <p className="text-sm text-[--text-secondary] mb-6">Create a zero-trust organization workspace to initialize live sensor streams.</p>
          <Link to="/new-workspace"><Button variant="primary">Deploy New Perimeter →</Button></Link>
        </PageShell>
        <Footer />
      </div>
    );
  }

  const isLive = workspace.serverState === 'LIVE';

  const handleToggleDoor = (personId) => {
    setDoorRelays(prev => prev.map(r => {
      if (r.personId === personId) {
        const nextStatus = r.status === 'GRANTED' ? 'REVOKED' : 'GRANTED';
        toast(nextStatus === 'GRANTED' ? "Door Relay GRANTED for personnel." : "Access REVOKED for security zone.");
        return { ...r, status: nextStatus };
      }
      return r;
    }));
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[--bg-primary]">
      <PageShell className="space-y-8">
        {/* Top Console Title & Control Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[--border-subtle]">
          <div className="flex items-start md:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6366F1] via-[#9B6BFF] to-[#EC4899] p-0.5 shadow-[0_0_30px_rgba(99,102,241,0.3)] shrink-0">
              <div className="w-full h-full bg-[--bg-primary] rounded-[14px] flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[--text-primary]">{workspace.name}</h1>
                <Badge variant={isLive ? "success" : "neutral"} pulsing={isLive} className="font-mono text-xs">
                  {isLive ? "● LIVE PERIMETER" : "○ PAUSED"}
                </Badge>
              </div>
              <p className="text-xs text-[--text-secondary] font-mono">
                VAULT_HASH: {workspace.id.toUpperCase()} • THRESHOLD: <span className="text-[--accent-violet] font-semibold">{workspace.threshold} Security</span>
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={isLive ? "ghost" : "secondary"}
              size="md"
              icon={Power}
              onClick={() => toggleServerState(workspace.id)}
              className={cn("text-xs font-mono", isLive ? "text-[--accent-success]" : "text-[--text-muted]")}
            >
              {isLive ? "Server State: ON" : "Turn On Server"}
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={Smartphone}
              onClick={() => setIsApkModalOpen(true)}
              className="text-xs font-semibold"
            >
              Deploy Mobile APK
            </Button>
            <Link to="/kenny">
              <Button variant="primary" size="md" icon={MessageSquareCode} className="font-semibold text-xs shadow-md">
                Ask Kenny AI
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Recharts Sensor Stream */}
        <LiveBiometricStream isLive={isLive} />

        {/* Authorized Personnel & Real-Time Relay Controls */}
        <GlassPanel className="p-6 md:p-8 border-[--border-strong] shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[--border-subtle]">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-[--accent-indigo]" />
              <h3 className="font-bold text-lg text-[--text-primary]">Enrolled Vaults & Door Relays</h3>
            </div>
            <span className="text-xs font-mono text-[--text-muted]">3-AXIS TEMPORAL MATCHING ON</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workspace.persons?.map((person) => {
              const relay = doorRelays.find(r => r.personId === person.id) || { status: 'GRANTED' };
              const isGranted = relay.status === 'GRANTED';

              return (
                <div
                  key={person.id}
                  className={cn(
                    "p-5 rounded-[var(--radius-md)] border transition-all flex items-center justify-between gap-4 shadow-md",
                    isGranted ? "bg-[--bg-elevated-2] border-[--border-subtle]" : "bg-[--accent-danger]/5 border-[--accent-danger]/30"
                  )}
                >
                  <div className="flex items-center gap-3.5 truncate pr-2">
                    <Avatar name={person.name} size="md" gradientRing={isGranted} />
                    <div className="truncate">
                      <h4 className="font-bold text-sm text-[--text-primary] truncate flex items-center gap-2">
                        <span>{person.name}</span>
                        <Badge variant={isGranted ? "success" : "danger"} className="text-[9px] px-2 py-0.2 font-mono">
                          {isGranted ? "AUTHORIZED" : "LOCKED"}
                        </Badge>
                      </h4>
                      <p className="text-micro font-mono text-[--text-muted] truncate mt-0.5">{person.role} • {person.email}</p>
                    </div>
                  </div>

                  {/* Relay Toggle button */}
                  <button
                    type="button"
                    onClick={() => handleToggleDoor(person.id)}
                    aria-label={isGranted ? "Revoke access" : "Grant access"}
                    className={cn(
                      "px-3 py-2 rounded-[var(--radius-pill)] border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all select-none shrink-0",
                      isGranted 
                        ? "bg-white/5 hover:bg-white/10 text-[--accent-success] border-[--accent-success]/30"
                        : "bg-[--accent-danger]/10 hover:bg-[--accent-danger]/20 text-[--accent-danger] border-[--accent-danger]/30"
                    )}
                  >
                    {isGranted ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{isGranted ? "RELAY OPEN" : "REVOKED"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      </PageShell>

      <ApkDownloadModal isOpen={isApkModalOpen} onClose={() => setIsApkModalOpen(false)} workspace={workspace} />

      <Footer />
    </div>
  );
};

export default ActiveWorkspace;