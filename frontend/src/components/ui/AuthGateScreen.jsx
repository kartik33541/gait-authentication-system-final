import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { buildAuthUrl } from '../../lib/utils';
import { AuthGateCard } from './AuthGateCard';
import { GlowOrb } from './GlowOrb';

const ROUTE_GATE_TABLE = [
  {
    prefix: '/kenny',
    featureName: 'Kenny AI Security Assistant',
    description:
      'Kenny connects directly to your organization telemetry and access controls, so an active administrator session is required.',
  },
  {
    prefix: '/dashboard',
    featureName: 'Command Dashboard & Telemetry',
    description:
      'Live entrance analytics, strictness controls, and employee access rosters are protected behind verified sign-in.',
  },
  {
    prefix: '/onboarding',
    featureName: 'Employee Onboarding Workspace',
    description:
      'Creating security workspaces and enrolling walking passkeys is restricted to signed-in organization administrators.',
  },
  {
    prefix: '/active-workspace',
    featureName: 'Live Auth Perimeter',
    description:
      'Real-time gate monitoring and sensor controls require authenticated organization access.',
  },
];

const DEFAULT_GATE_META = {
  featureName: 'this protected workspace',
  description:
    'Please sign in with your organization credentials or create a new workspace account to proceed.',
};

const resolveGateMeta = (pathname) => {
  const match = ROUTE_GATE_TABLE.find((entry) => pathname.startsWith(entry.prefix));
  return match || DEFAULT_GATE_META;
};

/**
 * Full-Screen Route Authentication Gate Widget
 * Shown cleanly instead of an abrupt silent redirect when a logged-out user opens a protected URL directly.
 */
export const AuthGateScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const intendedTarget = `${location.pathname}${location.search || ''}`;
  const meta = resolveGateMeta(location.pathname);

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden bg-[#050505]">
      <GlowOrb color="indigo" size="lg" className="opacity-20 -top-24 left-1/4" />
      <GlowOrb color="pink" size="md" className="opacity-15 bottom-10 right-1/4" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <AuthGateCard
          badgeLabel="Protected Workspace"
          featureName={meta.featureName}
          description={meta.description}
          onLogin={() => navigate(buildAuthUrl('/login', intendedTarget))}
          onSignup={() => navigate(buildAuthUrl('/signup', intendedTarget))}
          onDismiss={() => navigate('/')}
          dismissLabel="Back to Home"
          showCloseIcon={false}
        />
      </motion.div>
    </div>
  );
};

export default AuthGateScreen;
