import React from 'react';
import { PasskeyHeader } from '../components/dashboard/PasskeyHeader';
import { MorningHealthCheck } from '../components/dashboard/MorningHealthCheck';
import { PerimeterPolicyBar } from '../components/dashboard/PerimeterPolicyBar';
import { LiveTelemetryFeed } from '../components/dashboard/LiveTelemetryFeed';
import { EmployeeRoster } from '../components/dashboard/EmployeeRoster';
import { useAuth } from '../hooks/useAuth';

export const Dashboard = ({ activeWorkspace }) => {
  const { user, tenantId, organization } = useAuth();

  const currentWorkspace = activeWorkspace || {
    orgKey: tenantId || user?.tenant_id || 'COMP-05PC4G-2026',
    name: organization || user?.organization || 'Ram Chandra and Sons',
    serverState: 'LIVE'
  };

  const activeTenantId = currentWorkspace.orgKey;

  return (
    <div className="w-full min-h-screen bg-[#050505] pt-24 pb-16 px-4 md:px-8 font-sans antialiased">
      <div className="flex flex-col gap-6 w-full max-w-[90rem] mx-auto">
        
        {/* Top Section: Command Header & Passkey */}
        <PasskeyHeader workspace={currentWorkspace} />

        {/* Executive Morning Health Check (The 4 Summary Numbers at Top) */}
        <MorningHealthCheck tenantId={activeTenantId} />

        {/* Point 4: 3-Tier Dynamic Gate Strictness & Perimeter Policy Bar */}
        <PerimeterPolicyBar tenantId={activeTenantId} />

        {/* Middle Section: Split layout for Logs (with Point 3 Incident Actions) and Roster (with Point 2 Lifecycle Actions) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[640px]">
          <div id="telemetry" className="lg:col-span-8 h-full scroll-mt-28">
            <LiveTelemetryFeed tenantId={activeTenantId} />
          </div>
          <div id="roster" className="lg:col-span-4 h-full scroll-mt-28">
            <EmployeeRoster workspace={currentWorkspace} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
