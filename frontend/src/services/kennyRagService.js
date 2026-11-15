/**
 * @file kennyRagService.js
 * @description Agent 3: The RAG & Product Operations Guide.
 * Grounded in the non-technical GaitAuth Product Manual and Kenny AI System Specifications.
 * Delivers clear, human-centered explanations with zero developer or neural-network jargon.
 */

export const RAG_KNOWLEDGE_STORE = {
  auth_concept: {
    topicKey: 'auth_concept',
    title: '1:1 Contactless Gait Authentication (How It Works & Privacy)',
    summary: 'How phones unlock perimeter doors through natural walking motion without facial recognition or cameras.',
    content: [
      `### 🚶 1:1 Contactless Gait Authentication Explained`,
      ``,
      `* **No Stopping at Doors:** When an employee approaches a perimeter door or turnstile, their smartphone pairs their encrypted passkey with their natural walking pattern in real time. Doors unlock automatically as they walk through.`,
      `* **What is 1:1 Matching?** Traditional biometric systems compare a face or fingerprint against thousands of strangers (1:N search), which causes false matches and long queues. GaitAuth only verifies: *"Does this live walk match the registered owner of this specific passkey?"* This ensures sub-second unlocks and virtually zero false-acceptance risk.`,
      `* **100% Privacy-Preserving:** GaitAuth operates exclusively on non-invasive motion sensors (accelerometers and gyroscopes) inside the employee's phone. There are **zero facial recognition cameras, no retina scanners, no fingerprint pads, and no surveillance video** involved.`
    ].join('\n')
  },

  health_check: {
    topicKey: 'health_check',
    title: 'The Morning Executive Health Check',
    summary: 'The 4 executive summary numbers at the top of the dashboard.',
    content: [
      `### ☀️ The Morning Executive Health Check`,
      ``,
      `Designed to give administrators complete peace of mind in 3 seconds through 4 high-level real-time KPI numbers:`,
      ``,
      `1. **Total Entries Today:** Real-time count of every door unlock attempt recorded since midnight.`,
      `2. **Smooth Entry Rate:** Percentage of successful authentications against total attempts (e.g., 99.4%).`,
      `3. **Flagged Issues:** Count of rejected or anomalous entry attempts requiring review. Resolving or dismissing an incident automatically decrements this counter in real time.`,
      `4. **Door Sensor Status:** Real-time hardware heartbeat indicating whether all gateway turnstiles and IoT collector nodes are online and operational.`
    ].join('\n')
  },

  employee_management: {
    topicKey: 'employee_management',
    title: 'Employee Access Lifecycle & Recalibration',
    summary: 'Pausing access, updating recordings after an ankle sprain, and stale sample safety rules.',
    content: [
      `### 👥 Employee Access Management & Recalibration`,
      ``,
      `* **1-Click Pause & Resume:** Instantly suspend or restore door unlocking privileges for any employee. If paused, all turnstiles immediately stop them with the reason: *"Access paused by admin"*.`,
      `* **Walking Baseline Recalibration ("Update Readings"):** If an employee recovers from an ankle sprain, wears heavy work boots, or their natural stride changes, administrators can update their walking profile without retraining any models:`,
      `  - **Append Mode:** Adds fresh walking samples to enrich their existing baseline.`,
      `  - **Overwrite Mode:** Replaces older recordings with fresh samples after an explicit safety confirmation.`,
      `* **Stale Sample Deletion ("-1 Stale"):** Removes older or noisy recordings while strictly enforcing a **minimum baseline threshold of at least 2 recordings** to guarantee mathematical security stability.`,
      `* **Permanent Removal:** Safely deletes an employee profile and credentials with double-confirmation protection.`
    ].join('\n')
  },

  gate_strictness: {
    topicKey: 'gate_strictness',
    title: '3-Tier Dynamic Gate Strictness & Perimeter Policy',
    summary: 'The 3 operational strictness modes, automated night schedule, and emergency lockdown.',
    content: [
      `### 🛡️ 3-Tier Dynamic Gate Strictness`,
      ``,
      `Administrators can match the security threshold to their operational environment directly from the dashboard:`,
      ``,
      `* **1. Smooth & Easy Mode (0.65 threshold):**`,
      `  - *Best For:* Morning rush hours, busy warehouse floors, employees carrying heavy packages.`,
      `  - *Experience:* Maximum convenience; doors open instantly with high tolerance for natural walking variations.`,
      `* **2. Balanced Mode (0.75 threshold — Default):**`,
      `  - *Best For:* Standard corporate daily business operations.`,
      `  - *Experience:* Enterprise-grade zero-trust authentication; 99.4% precision with standard walking cadence.`,
      `* **3. Strict & High-Security Mode (0.85 threshold):**`,
      `  - *Best For:* Sensitive research labs, server rooms, executive suites, or after-hours security.`,
      `  - *Experience:* Zero false-acceptance tolerance; requires exact mathematical cadence alignment.`,
      ``,
      `* **Automated Night Schedule:** Automatically elevates doors to Strict Mode after 8:00 PM local time.`,
      `* **Emergency Site Lockdown:** A single-click override that immediately locks all doors and turnstiles across the facility.`
    ].join('\n')
  },

  incident_remediation: {
    topicKey: 'incident_remediation',
    title: 'Actionable Incident Resolution & False Alarm Dismissal',
    summary: 'How administrators resolve flagged door attempts and how it updates dashboard analytics.',
    content: [
      `### ⚡ Actionable Incident Resolution`,
      ``,
      `When an employee is stopped at a door, administrators can inspect the event in the Live Telemetry Feed and resolve it with 1 click:`,
      ``,
      `* **Audit Details:** Expanding any log entry reveals the 3D Kinetic Energy Score (mechanical anti-spoofing) and stride cadence consistency.`,
      `* **Dismiss (False Alarm):** If an employee was rejected because they were carrying heavy boxes or walking unusually fast, clicking *"Dismiss"* marks the log as a false alarm and **automatically clears the issue from your Morning Health Check counter** in real time.`,
      `* **Escalate to Security:** Dispatches the incident record to on-duty security personnel for on-site verification.`
    ].join('\n')
  },

  kenny_ai: {
    topicKey: 'kenny_ai',
    title: 'Kenny AI Multi-Agent Architecture & Security Safeguards',
    summary: 'How Kenny operates through 4 specialized subagents with strict data boundaries.',
    content: [
      `### 🤖 Kenny AI Multi-Agent System Architecture`,
      ``,
      `Kenny is an enterprise Autonomous Security Operations Assistant (SecOps AI) organized into 5 collaborative roles:`,
      ``,
      `1. **Master Orchestrator:** Manages conversational meet-and-greet natively, understands administrator context, and dispatches specialized tasks.`,
      `2. **Agent 1: Navigator Agent:** Generates interactive in-chat route cards that deep-link directly to application pages and settings modals.`,
      `3. **Agent 2: Database & Telemetry Analyst:** Performs read-only queries for employee counts and daily door logs with **Sanitized Projections** (zero raw biometric math or credentials exposed).`,
      `4. **Agent 3: RAG & Product Operations Guide:** Explains system features, 1:1 authentication, and operational best practices in human, non-developer English.`,
      `5. **Agent 4: Action & Mutation Guard:** Enforces a **Two-Phase Commit Human-in-the-Loop State Machine**. Kenny never alters database state autonomously; all state changes require physical button confirmation in chat.`
    ].join('\n')
  },

  android_client: {
    topicKey: 'android_client',
    title: 'GaitAuth Android Client & Sideloading',
    summary: 'How the Android application samples sensors, privacy guarantees, and APK download instructions.',
    content: [
      `### 📱 Official GaitAuth Android Application`,
      ``,
      `* **Zero User Friction:** Employees keep their phone in their pocket or bag; the app reads motion data to unlock perimeter turnstiles and doors before they even break stride.`,
      `* **100% Privacy Guarantee:** Does not request cameras, microphones, or continuous GPS location—only standard motion sensors.`,
      `* **Direct Downloads:** Administrators and employees can download \`Gait_Auth_Live.apk\` (3.8 MB) or the complete distribution archive from the Android App Center (/android).`,
      `* **Sideloading Setup:** Android requires allowing *"Install unknown apps"* in Settings before completing installation.`
    ].join('\n')
  }
};

/**
 * Master Execution Dispatcher for Agent 3
 */
export const executeRagGuide = (args, context = {}) => {
  const requestedTopic = (args.topic || '').toLowerCase().trim();
  const timestamp = new Date().toLocaleTimeString();

  let matchedSection = RAG_KNOWLEDGE_STORE.auth_concept;

  if (requestedTopic.includes('android') || requestedTopic.includes('apk') || requestedTopic.includes('mobile') || requestedTopic.includes('phone') || requestedTopic.includes('sideload')) {
    matchedSection = RAG_KNOWLEDGE_STORE.android_client;
  } else if (requestedTopic.includes('strict') || requestedTopic.includes('tier') || requestedTopic.includes('mode') || requestedTopic.includes('lockdown') || requestedTopic.includes('night')) {
    matchedSection = RAG_KNOWLEDGE_STORE.gate_strictness;
  } else if (requestedTopic.includes('health') || requestedTopic.includes('morning') || requestedTopic.includes('number') || requestedTopic.includes('rate') || requestedTopic.includes('summary')) {
    matchedSection = RAG_KNOWLEDGE_STORE.health_check;
  } else if (requestedTopic.includes('pause') || requestedTopic.includes('recalibrat') || requestedTopic.includes('sprain') || requestedTopic.includes('boot') || requestedTopic.includes('stale') || requestedTopic.includes('roster')) {
    matchedSection = RAG_KNOWLEDGE_STORE.employee_management;
  } else if (requestedTopic.includes('incident') || requestedTopic.includes('dismiss') || requestedTopic.includes('false alarm') || requestedTopic.includes('escalat')) {
    matchedSection = RAG_KNOWLEDGE_STORE.incident_remediation;
  } else if (requestedTopic.includes('kenny') || requestedTopic.includes('multi-agent') || requestedTopic.includes('agent') || requestedTopic.includes('architecture') || requestedTopic.includes('subagent')) {
    matchedSection = RAG_KNOWLEDGE_STORE.kenny_ai;
  } else if (requestedTopic.includes('1:1') || requestedTopic.includes('gait') || requestedTopic.includes('privacy') || requestedTopic.includes('camera') || requestedTopic.includes('how it works')) {
    matchedSection = RAG_KNOWLEDGE_STORE.auth_concept;
  }

  const formattedResponse = matchedSection.content;

  return {
    dispatchedAgent: 'Kenny',
    timestamp,
    topicKey: matchedSection.topicKey,
    title: matchedSection.title,
    message: formattedResponse
  };
};

