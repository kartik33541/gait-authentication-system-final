# GaitAuth Enterprise Product & Operational Manual

This document serves as the comprehensive, non-technical operational manual for administrators and facility managers using the GaitAuth Contactless Biometric Authentication Platform. It is specifically designed to ground Kenny AI's RAG Knowledge Engine.

---

## 1. How 1:1 Contactless Gait Authentication Works (Concept & Privacy)

### 1.1 The Operational Concept
- **No Stopping at Doors:** When an employee approaches a perimeter door or turnstile, their smartphone pairs their encrypted passkey with their natural walking pattern in real time.
- **1:1 Matching:** Instead of searching a massive database of thousands of people (1:N search), the system only answers: *"Does this live walk match the registered profile of the person holding this passkey?"* This ensures sub-second door unlocks and zero false-acceptance risk.
- **Privacy First:** GaitAuth uses only non-invasive motion sensors (accelerometer and gyroscope). There are **no facial recognition cameras, no retina scanners, no fingerprint pads, and no surveillance video**. Biometrics remain private, cryptographic motion signatures.

---

## 2. The 4 Core Dashboard Features

### 2.1 Feature 1: The Morning Executive Health Check
Designed to give administrators peace of mind in 3 seconds through 4 live KPI numbers:
1. **Total Entries Today:** Real-time count of door unlock attempts since midnight.
2. **Smooth Entry Rate:** Percentage of successful authentications against total attempts (e.g., 99.4%).
3. **Flagged Issues:** Count of rejected or anomalous entry attempts requiring review. Resolving an incident automatically updates this counter in real time.
4. **Door Sensor Status:** Live indicator showing whether gateway turnstiles and IoT collector nodes are online and healthy.

### 2.2 Feature 2: Actionable Incident Resolution & Live Telemetry Feed
- **Live Stream:** Displays every door event with timestamp, employee identity, match score, and result badge.
- **Audit Details:** Expanding any log reveals the 3D Kinetic Energy Score, cadence consistency, and rejection explanations.
- **1-Click Remediation:**
  - *"Dismiss (False Alarm)"*: Clears the alert from the Morning Health Check.
  - *"Escalate to Security"*: Flags the event for on-site security response.
- **Filter Tabs:** Toggle between all entries and "Needs Review".

### 2.3 Feature 3: Employee Lifecycle & Access Maintenance
- **Employee Roster:** Real-time directory of all enrolled staff, department info, template IDs, and active status.
- **1-Click Pause / Resume:** Instantly revokes or restores door access for any individual (e.g. lost phone, suspended access). If paused, doors reject with *"Access paused by admin"*.
- **Recalibrate Walking Baseline ("Update Readings"):**
  - Used when an employee recovers from an ankle sprain, changes heavy work boots, or walking cadence evolves.
  - Supports **Append Mode** (adding fresh recordings) or **Overwrite Mode** (replacing older recordings with a safety warning).
- **Stale Sample Deletion ("-1 Stale"):** Safely removes older recordings while strictly maintaining a minimum safety threshold of **at least 2 recordings** to guarantee mathematical stability.
- **Permanent Deletion:** Removes an employee profile completely through an explicit confirmation modal.

### 2.4 Feature 4: 3-Tier Dynamic Gate Strictness & Perimeter Policy
Administrators can adjust perimeter threshold sensitivity from the dashboard:
1. **Smooth & Easy Mode (0.65 threshold):** Best for morning rush hours, busy warehouse floors, or employees carrying equipment. Opens instantly with high tolerance.
2. **Balanced Mode (0.75 threshold — Default):** Standard corporate operations providing 99.4% precision with normal walking cadence.
3. **Strict & High-Security Mode (0.85 threshold):** Zero false-acceptance tolerance for server rooms, executive offices, or sensitive labs.
- **Automated Night Schedule:** Automatically switches to Strict Mode after 8:00 PM.
- **Emergency Site Lockdown:** One-click emergency override that locks all facility doors immediately.

---

## 3. How Kenny AI Agent Works (Complete Operational Architecture)

### 3.1 Multi-Agent Architecture
Kenny AI is an enterprise Autonomous Security Operations Assistant (SecOps AI) built with a central **Master Orchestrator** and 4 specialized subagents:
1. **The Master Orchestrator (Greeter & Dispatcher):**
   - Handles natural meet-and-greet, casual conversation, and general questions directly.
   - Evaluates administrative intent and delegates specialized queries to the correct subagent.
   - Aware of admin session context (Name, Organization, Tenant ID).
2. **Agent 1: The Navigator Agent (Deep-Linking Specialist):**
   - Helps admins find any feature across the application.
   - Generates interactive, clickable action cards that navigate directly to pages like `/onboarding`, `/dashboard`, or deep-link to specific settings modals.
3. **Agent 2: Database & Telemetry Analyst (SecOps Intelligence):**
   - Read-only intelligence analyst scoped strictly to the admin's organization.
   - Answers questions regarding employee counts, verifies whether an employee exists, and summarizes daily entrance logs.
   - Strictly redacts raw biometric embeddings and internal secrets (Zero PII or raw math exposed).
4. **Agent 3: RAG & Product Operations Guide (This Manual):**
   - Explains all GaitAuth platform features and Kenny AI capabilities in plain, human English.
   - Free of developer neural network jargon.
5. **Agent 4: Action & Mutation Guard (Human-in-the-Loop Controller):**
   - Manages administrative state changes (e.g. pausing an employee, setting gate strictness).
   - **Strict Zero-Autonomous Mutation Guardrail:** Kenny never changes the database directly. Instead, Kenny generates an interactive **Action Confirmation Card** in chat, requiring the human admin to physically click the confirmation button.
   - Prohibits destructive actions like permanent employee deletion or log clearing via chat.

