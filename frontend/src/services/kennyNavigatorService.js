/**
 * @file kennyNavigatorService.js
 * @description Agent 1: The Navigator Agent (Deep-Linking & In-App Routing Specialist).
 * Resolves semantic user destinations into client-side application routes and interactive Nav Cards.
 */

export const ROUTE_DIRECTORY = {
  onboarding: {
    destinationKey: 'onboarding',
    title: 'Employee Onboarding Wizard',
    description: 'Enroll new team members, record walking baselines, and assign mobile passkeys.',
    route: '/onboarding',
    buttonLabel: 'Launch Member Onboarding',
    iconName: 'UserPlus',
    category: 'Workforce Setup'
  },
  dashboard: {
    destinationKey: 'dashboard',
    title: 'Command Hub & Health Check',
    description: 'View today\'s entrance analytics, sensor heartbeats, and perimeter status.',
    route: '/dashboard',
    buttonLabel: 'Open Command Dashboard',
    iconName: 'LayoutDashboard',
    category: 'Overview'
  },
  strictness_modal: {
    destinationKey: 'strictness_modal',
    title: '3-Tier Gate Strictness Settings',
    description: 'Configure perimeter threshold (Smooth 0.65, Balanced 0.75, Strict 0.85).',
    route: '/dashboard?open=strictness',
    buttonLabel: 'Configure Gate Strictness',
    iconName: 'Sliders',
    category: 'Perimeter Security'
  },
  lockdown_modal: {
    destinationKey: 'lockdown_modal',
    title: 'Emergency Site Lockdown',
    description: 'Override all turnstiles and immediately seal facility perimeters.',
    route: '/dashboard?open=lockdown',
    buttonLabel: 'Emergency Lockdown Controls',
    iconName: 'ShieldAlert',
    category: 'Emergency Protocol'
  },
  telemetry_feed: {
    destinationKey: 'telemetry_feed',
    title: 'Live Telemetry & Access Feed',
    description: 'Inspect live door entry attempts, match confidence scores, and raw 3D kinetic energy.',
    route: '/dashboard#telemetry',
    buttonLabel: 'View Live Telemetry Stream',
    iconName: 'Activity',
    category: 'Audit & Telemetry'
  },
  employee_roster: {
    destinationKey: 'employee_roster',
    title: 'Employee Access Roster',
    description: 'Manage individual access status (Pause/Resume, Recalibrate, Stale Sample Deletion).',
    route: '/dashboard#roster',
    buttonLabel: 'Manage Employee Roster',
    iconName: 'Users',
    category: 'Workforce Management'
  },
  android_app: {
    destinationKey: 'android_app',
    title: 'Android Mobile Application',
    description: 'Download official GaitAuth APKs, review sideloading steps, and inspect sensor specifications.',
    route: '/android',
    buttonLabel: 'Open Android App Center',
    iconName: 'Smartphone',
    category: 'Mobile Client'
  }
};

/**
 * Resolves a requested navigation target into an interactive Nav Card payload.
 */
export const resolveNavigation = (args, context = {}) => {
  const requested = (args.destination || 'dashboard').toLowerCase().trim();
  
  // Find match in directory or fuzzy match
  let target = ROUTE_DIRECTORY[requested];
  if (!target) {
    if (requested.includes('android') || requested.includes('apk') || requested.includes('mobile') || requested.includes('phone') || requested.includes('download')) {
      target = ROUTE_DIRECTORY.android_app;
    } else if (requested.includes('onboard') || requested.includes('add') || requested.includes('member') || requested.includes('enroll')) {
      target = ROUTE_DIRECTORY.onboarding;
    } else if (requested.includes('strict') || requested.includes('policy') || requested.includes('threshold') || requested.includes('mode')) {
      target = ROUTE_DIRECTORY.strictness_modal;
    } else if (requested.includes('lock') || requested.includes('emergency')) {
      target = ROUTE_DIRECTORY.lockdown_modal;
    } else if (requested.includes('feed') || requested.includes('log') || requested.includes('telemetry') || requested.includes('attempt')) {
      target = ROUTE_DIRECTORY.telemetry_feed;
    } else if (requested.includes('roster') || requested.includes('employee') || requested.includes('user') || requested.includes('pause')) {
      target = ROUTE_DIRECTORY.employee_roster;
    } else {
      target = ROUTE_DIRECTORY.dashboard;
    }
  }

  const timestamp = new Date().toLocaleTimeString();

  return {
    dispatchedAgent: 'Kenny',
    timestamp,
    navCard: {
      id: `NAV_${Date.now()}`,
      destinationKey: target.destinationKey,
      title: target.title,
      description: target.description,
      route: target.route,
      buttonLabel: target.buttonLabel,
      iconName: target.iconName,
      category: target.category,
      reason: args.reason || `Requested by ${context.adminName || 'Admin'}`
    },
    message: [
      `### 🧭 Navigator`,
      ``,
      `* **Destination:** **${target.title}**`,
      `* **Route:** \`${target.route}\``,
      args.reason ? `* **Context:** ${args.reason}` : ``,
      ``,
      `I've generated a direct shortcut for you below. Click the card to navigate immediately:`
    ].filter(Boolean).join('\n')
  };
};

