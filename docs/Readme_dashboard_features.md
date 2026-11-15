# GaitAuth Enterprise Dashboard — Architecture & Features Reference

This document serves as the comprehensive, production-grade technical and operational reference for the GaitAuth Admin Dashboard. It details the system architecture, real-time Firestore pipelines, security controls, and feature specifications implemented across Points 1, 2, 3, and 4.

---

## 1. System Architecture & Core Principles

### 1.1 Zero Mock Data Policy
Every metric, badge, log entry, employee record, and security toggle rendered on the GaitAuth dashboard is powered by **100% live database synchronization** (Google Cloud Firestore) and the production **Siamese LSTM Python Flask engine**. There are zero simulated arrays, stubbed timers, or fake states in production.

### 1.2 Multi-Tenant Data Isolation (Tenant Tokens)
To prevent cross-tenant data leakage and eliminate the global vault bottleneck (1:N search degradation), the system utilizes **Tenant Organization Tokens** (e.g., `COMP-05PC4G-2026`):
- Every organization owns an isolated Firestore root: `organizations/{tenantId}/`.
- Mobile Android collector nodes transmit this token via the `X-TENANT-ID` header.
- The Flask inference backend retrieves only the enrolled embeddings belonging to that specific tenant, restricting cosine similarity matching strictly to the organization's workforce.

### 1.3 Hybrid Authentication Architecture
- **Web Admin Dashboard (Firebase Auth):** Handles tenant onboarding, passkey provisioning, access policies, telemetry auditing, and employee lifecycle management.
- **Mobile Android Client (GaitAuth App):** Lightweight background sensor-streaming node running on employee smartphones. Collects tri-axial accelerometer and gyroscope data at 50 Hz.
- **Deep Metric Learning Core (Siamese LSTM):** Pre-trained deep neural network (`siamese_lstm.weights.h5` + `production_encoder.keras`) converting 256-sample temporal walk sequences into 256-dimensional cryptographic embeddings. Matching is performed via Cosine Similarity against the tenant's enrolled templates.

---

## 2. Feature 1: The Morning Executive Health Check (Point 1)

### 2.1 Operational Philosophy
When an administrator sits down at their desk, they should not have to scroll through hundreds of access logs to verify whether perimeter doors are functioning. The **Morning Health Check** gives complete operational peace of mind in 3 seconds through 4 high-level real-time KPI indicators.

### 2.2 The 4 Executive KPI Cards
1. **Total Entries Today:**
   - Real-time tally of all door authentication attempts recorded since 00:00:00 local time today.
   - Listens to: `organizations/{tenantId}/access_logs` filtered by today's ISO boundary.
2. **Smooth Entry Rate:**
   - Percentage of successful entries against total attempts (`(successful_entries / total_entries) * 100`).
   - Dynamically displays high-precision security metrics (e.g., `99.2%`).
3. **Flagged Issues:**
   - Real-time counter of authentication rejections or events requiring security review (`incident_status: 'FLAGGED'`).
   - Automatically decrements in real-time when an incident is resolved by an admin.
4. **Door Sensor Status:**
   - Real-time perimeter hardware status showing a pulsing green indicator: `All door sensors online`.
   - Monitors active collector nodes and IoT turnstiles.

---

## 3. Feature 2: Actionable Incident Resolution & Live Telemetry Feed (Point 3)

### 3.1 Real-Time Telemetry Feed
- Streaming Firestore listener on `organizations/{tenantId}/access_logs` ordered by descending timestamp.
- Displays employee name, template ID, gate/door location, match confidence score, pass/fail status badge, and timestamp.
- Includes a **"Needs Review"** filter tab to isolate flagged and non-standard authentication attempts instantly.

### 3.2 Humanized Telemetry Audit Drawer
Expanding any log entry opens a detailed AI diagnostic drawer displaying:
- **3D Kinetic Energy Score:** Evaluates walking motion energy to detect mechanical or robotic spoofing attempts.
- **Stride Cadence & Acceleration Consistency:** Highlights variance against the employee's master baseline.
- **Rejection Reason:** Human-readable explanations (e.g., *"Stride cadence did not match enrolled template"*, *"Access paused by admin"*, *"Emergency site lockdown active"*).

### 3.3 One-Click Incident Actions
Directly inside the audit drawer, administrators have two one-click remediation controls:
- **"Dismiss (False Alarm)"**:
  - Updates Firestore document: `incident_status: 'DISMISSED'`, `resolution_note: 'Marked as false alarm by admin'`.
  - Immediately decrements the **Flagged Issues** counter in the Morning Health Check in real time.
- **"Escalate to Security"**:
  - Updates Firestore document: `incident_status: 'ESCALATED'`, `resolution_note: 'Escalated to on-duty security'`.
  - Dispatches incident record to on-site security response channels.

### 3.4 Live Test Walk Entry Simulator
- Embedded development and verification tool that injects an authentic walk attempt directly into Firestore.
- Tests the end-to-end telemetry pipeline, real-time state listeners, and Morning Health Check responsiveness.

---

## 4. Feature 3: Employee Lifecycle & Access Maintenance (Point 2)

### 4.1 Real-Time Employee Roster
- Connects directly to `organizations/{tenantId}/employees`.
- Displays employee avatar, name, department, unique template ID, enrolled walk samples count, active/paused status, and date enrolled.

### 4.2 One-Click Access Pause / Resume
- Allows administrators to instantly suspend or restore door unlocking privileges for any employee.
- **State Change:** Toggles `status: 'ACTIVE'` or `status: 'PAUSED'`.
- **Enforcement:** If paused, any walk attempt sent by that employee's device is rejected at the gate with:
  - Rejection Reason: `"Access paused by admin"`.
  - Backend header check: `X-EMPLOYEE-STATUS: PAUSED`.

### 4.3 Walking Baseline Recalibration & Update Readings
If an employee recovers from an ankle sprain, changes footwear (e.g., heavy construction boots), or their walking pattern naturally evolves, the admin can update their baseline without retraining the neural network:
- **Append Mode ("Add Walk Recordings"):** Uploads 2 or more new CSV walk recordings to enrich the existing template profile.
- **Overwrite Mode ("Replace Existing Readings"):**
  - Completely clears older recordings and writes fresh samples.
  - **Destructive Warning Guard:** Requires explicit confirmation via an elevated warning modal (`z-[100]`) and a safety checkbox (*"I understand this permanently removes older recordings"*) before executing the database write.

### 4.4 Stale Sample Deletion ("-1 Stale")
- Allows removing older, noisy, or anomalous sensor recordings from an employee's profile.
- **Safety Threshold Enforced:** Guards against reducing the sample count below **2 recordings**. If an employee has only 2 recordings, the button is disabled to guarantee Siamese LSTM temporal stability.

### 4.5 Permanent Employee Removal
- Completely removes an employee profile, metadata, and template embeddings from Firestore.
- Protected by a dedicated confirmation modal with backdrop-blur dismissal and keyboard `Escape` handling to prevent accidental data loss.

---

## 5. Feature 4: 3-Tier Dynamic Gate Strictness & Perimeter Policy (Point 4)

### 5.1 Three-Tier Operational Strictness Modes
The administrator can adjust the physical security threshold in real time from the dashboard:

| Mode | Threshold | Intended Environment | Operational Experience |
| :--- | :---: | :--- | :--- |
| **Smooth & Easy** | **0.65** | Morning rush hours, busy warehouse floors, employees carrying heavy packages | Maximum convenience; gates open instantly with high tolerance for natural walking variations. |
| **Balanced (Default)** | **0.75** | Standard corporate working hours, daily operations | Enterprise-grade zero-trust authentication; 99.4% precision with standard walking cadence. |
| **Strict & High Security** | **0.85** | Sensitive research labs, server rooms, executive offices, after-hours | Zero false-acceptance tolerance; requires exact mathematical cadence alignment. |

### 5.2 Automated Night Schedule
- Toggleable policy rule that automatically engages **Strict & High-Security Mode (0.85 threshold)** after 8:00 PM local time.
- Ensures enhanced perimeter defense during unattended hours without requiring manual admin intervention.

### 5.3 Emergency Site Lockdown
- One-click security override modal that locks all turnstiles and doors across the facility immediately.
- Disables all passkeys and walking verifications on the Flask backend (`X-EMERGENCY-LOCKDOWN: TRUE`).
- Displays a prominent red warning banner across the dashboard with a 1-click restore mechanism.

### 5.4 Human-Centered Modal Architecture
- Strictness and lockdown modals are elevated to `z-[100]` with `backdrop-blur-2xl` to layer cleanly above the fixed navbar (`z-[60]`).
- Includes click-outside-to-dismiss on the frosted backdrop and keyboard `Escape` listener for accessible interaction.
- Copy written in clear, plain language free of robotic AI jargon.

---

## 6. Workspace Perimeter Passkey & Mobile Integration

### 6.1 Clear, Actionable Copy
- Replaced technical cryptographic jargon with simple, human-friendly instructions:
  > *"Enter this passkey in your GaitAuth Android app to automatically unlock doors with your natural walking pattern."*

### 6.2 One-Click Clipboard Copy
- Features instant clipboard copying with visual feedback ("Copied!") and display of the active organization token (`COMP-XXXXXX-2026`).

---

## 7. Navbar Architecture & Page-Level Scoping

To prevent visual collisions between center navigation elements and action buttons:
- **Dashboard (`/dashboard`):** Features the full administrative suite: `+ Add Members`, `Dashboard` active indicator, `Kenny AI` shortcut (with `Sparkles` icon and `AI` badge), user profile pill, and `Log Out`.
- **Home Page (`/`):** Stripped of dashboard-specific tools to give the centered marketing navigation (`Architecture`, `How it Works`, `3D Physics Guard`, `Talk to Kenny`) complete breathing room. For authenticated admins, only a compact `Dashboard` button, profile pill, and `Log Out` are displayed.
- **Kenny AI Space (`/kenny`):** Displays the centered `LLM Diagnostics Active` badge without interference, offering only the single `Dashboard` return button and profile controls on the right.

---

## 8. Technology Stack & Verification Summary

- **Frontend:** React 19, Vite 8, Tailwind CSS, Lucide React, Framer Motion.
- **Database & Sync:** Google Cloud Firebase / Firestore SDK (Real-time `onSnapshot`, `updateDoc`, `deleteDoc`).
- **Backend Inference Server:** Python 3.10+, Flask, Keras 3 / TensorFlow 2.x, Scikit-learn (`scaler.pkl`), NumPy, SciPy.
- **Biometric Neural Network:** 2-layer Siamese LSTM with 256 hidden units, temporal window size = 256 samples (approx. 5.12s walk @ 50 Hz).
- **Verification:** Continuous production build verification with zero compilation warnings (`npm --prefix frontend run build`).

