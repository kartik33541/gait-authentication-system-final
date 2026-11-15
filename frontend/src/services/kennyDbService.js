/**
 * @file kennyDbService.js
 * @description Agent 2: The Database & Telemetry Analyst (SecOps Intelligence).
 * Executes real read-only Firestore queries strictly scoped to the active tenant.
 * Enforces Least-Privilege Sanitized Projections (Zero raw biometrics or embeddings exposed).
 */

import { db } from '../firebase.js';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';

/**
 * 1. Workforce Summary Tool
 * Reads all employees enrolled in the organization and projects safe metadata.
 */
export const getWorkforceSummary = async (tenantId) => {
  if (!tenantId) {
    return { success: false, error: 'Organization authentication required.', total_employees: 0, employees: [] };
  }
  const safeTenant = tenantId;
  try {
    const empRef = collection(db, 'organizations', safeTenant, 'employees');
    const snapshot = await getDocs(empRef);

    let activeCount = 0;
    let pausedCount = 0;
    const employeeList = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const status = data.status || 'ACTIVE';
      if (status === 'ACTIVE') activeCount++;
      else pausedCount++;

      // SANITIZED PROJECTION: Never expose raw embeddings or sensor series
      employeeList.push({
        id: docSnap.id,
        template_id: data.template_id || docSnap.id,
        name: data.name || 'Unnamed Employee',
        department: data.department || 'General Staff',
        status: status,
        samples_count: Array.isArray(data.sample_files) ? data.sample_files.length : (data.samples_count || 2),
        enrolled_date: data.created_at?.toDate ? data.created_at.toDate().toLocaleDateString() : (data.created_at || 'Recent')
      });
    });

    return {
      success: true,
      total_employees: snapshot.size,
      active_count: activeCount,
      paused_count: pausedCount,
      employees: employeeList
    };
  } catch (err) {
    console.error("DB Analyst workforce summary query failed:", err);
    return {
      success: false,
      error: err.message,
      total_employees: 0,
      active_count: 0,
      paused_count: 0,
      employees: []
    };
  }
};

/**
 * 2. Search Employee Roster Tool
 * Checks if a specific employee exists, their status, template ID, and department.
 */
export const searchEmployeeRoster = async (tenantId, searchName) => {
  if (!tenantId) {
    return { success: false, found: false, error: 'Organization authentication required.' };
  }
  const safeTenant = tenantId;
  const cleanSearch = (searchName || '').toLowerCase().trim();

  try {
    const summary = await getWorkforceSummary(safeTenant);
    if (!summary.success) throw new Error(summary.error);

    const matches = summary.employees.filter(emp => 
      emp.name.toLowerCase().includes(cleanSearch) || 
      emp.template_id.toLowerCase().includes(cleanSearch) ||
      emp.department.toLowerCase().includes(cleanSearch)
    );

    if (matches.length > 0) {
      return {
        success: true,
        found: true,
        matchCount: matches.length,
        matchedEmployee: matches[0],
        allMatches: matches
      };
    } else {
      return {
        success: true,
        found: false,
        searchedQuery: searchName,
        totalEnrolledInOrg: summary.total_employees
      };
    }
  } catch (err) {
    console.error("DB Analyst employee search failed:", err);
    return {
      success: false,
      found: false,
      error: err.message
    };
  }
};

const ADMIN_AUDIT_IDS = new Set(['POLICY', 'LOCKDOWN', 'POLICY-SYS']);

export const isAdminAuditLog = (data = {}) => {
  const empId = String(data.employee_id || '').trim().toUpperCase();
  return ADMIN_AUDIT_IDS.has(empId);
};

export const parseLogDate = (ts) => {
  if (!ts) return null;
  if (typeof ts?.toDate === 'function') {
    return ts.toDate();
  }
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatLogConfidence = (rawScore) => {
  if (rawScore === null || rawScore === undefined || rawScore === '') return 'N/A';
  if (typeof rawScore === 'string') {
    const trimmed = rawScore.trim();
    if (!trimmed) return 'N/A';
    if (trimmed.endsWith('%')) {
      const numeric = Number.parseFloat(trimmed);
      return Number.isFinite(numeric) ? `${Math.max(0, numeric).toFixed(1)}%` : 'N/A';
    }
    const numeric = Number.parseFloat(trimmed);
    if (!Number.isFinite(numeric)) return 'N/A';
    return numeric <= 1 ? `${(Math.max(0, numeric) * 100).toFixed(1)}%` : `${Math.max(0, numeric).toFixed(1)}%`;
  }
  if (typeof rawScore === 'number' && Number.isFinite(rawScore)) {
    return rawScore <= 1 ? `${(Math.max(0, rawScore) * 100).toFixed(1)}%` : `${Math.max(0, rawScore).toFixed(1)}%`;
  }
  return 'N/A';
};

/**
 * 3. Daily Access Logs & Incident Tool
 * Queries today's entrance attempts, rejections, and security flags.
 */
export const getDailyAccessSummary = async (tenantId, filter = 'all') => {
  if (!tenantId) {
    return { success: false, error: 'Organization authentication required.', logs: [] };
  }
  const safeTenant = tenantId;
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const logsRef = collection(db, 'organizations', safeTenant, 'access_logs');
    const q = query(
      logsRef,
      where('timestamp', '>=', startOfDay),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    let totalAttempts = 0;
    let successCount = 0;
    let rejectedCount = 0;
    let flaggedIssues = 0;
    const events = [];
    const normalizedFilter = String(filter || 'all').toLowerCase().trim();

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (isAdminAuditLog(data)) return;

      totalAttempts++;
      const status = String(data.status || 'DENIED').toUpperCase();
      const isSuccess = status === 'GRANTED' || status === 'SUCCESS';
      const incidentStatus = String(data.incident_status || (isSuccess ? 'RESOLVED' : 'UNRESOLVED')).toUpperCase();
      const isActiveFlag = !isSuccess && incidentStatus !== 'DISMISSED';

      if (isSuccess) successCount++;
      else rejectedCount++;

      if (isActiveFlag) {
        flaggedIssues++;
      }

      if (normalizedFilter === 'rejections_only' && isSuccess) return;
      if (normalizedFilter === 'flagged' && !isActiveFlag) return;

      const parsedDate = parseLogDate(data.timestamp);

      // Safe event projection
      events.push({
        id: docSnap.id,
        time: parsedDate ? parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown',
        employee_name: data.employee_name || data.matched_user || 'Unknown Person',
        gate: data.gate_id || data.location || 'GATE-01',
        status,
        confidence_score: formatLogConfidence(data.confidence_score),
        reason: data.reason || (isSuccess ? 'Biometric Cadence Matched' : 'Cadence Mismatch'),
        incident_status: incidentStatus
      });
    });

    const smoothRate = totalAttempts > 0 
      ? `${((successCount / totalAttempts) * 100).toFixed(1)}%` 
      : '100.0%';

    return {
      success: true,
      total_attempts: totalAttempts,
      success_count: successCount,
      rejected_count: rejectedCount,
      smooth_rate: smoothRate,
      flagged_issues: flaggedIssues,
      events: events
    };
  } catch (err) {
    console.error("DB Analyst daily access summary query failed:", err);
    return {
      success: false,
      error: err.message,
      total_attempts: 0,
      success_count: 0,
      rejected_count: 0,
      smooth_rate: '100.0%',
      flagged_issues: 0,
      events: []
    };
  }
};

/**
 * Master Execution Dispatcher for Agent 2
 */
export const executeDbAnalytics = async (args, context = {}) => {
  const tenantId = context.tenantId;
  const timestamp = new Date().toLocaleTimeString();
  if (!tenantId) {
    return {
      dispatchedAgent: 'Kenny',
      timestamp,
      data: null,
      message: 'Authentication session required to access organization records.'
    };
  }
  const queryType = args.query_type || 'workforce_summary';

  let resultData = null;
  let formattedMessage = '';

  if (queryType === 'search_employee') {
    resultData = await searchEmployeeRoster(tenantId, args.employee_name);
    if (resultData.found) {
      const emp = resultData.matchedEmployee;
      formattedMessage = [
        `### 👤 Employee Profile: ${emp.name}`,
        ``,
        `* **Name:** **${emp.name}**`,
        `* **Passkey ID:** \`${emp.template_id}\``,
        `* **Department:** ${emp.department}`,
        `* **Door Access:** ${emp.status === 'ACTIVE' ? '🟢 **Active** (Authorized to unlock doors)' : '🔴 **Paused** (Access currently suspended)'}`,
        `* **Enrolled Stride Recordings:** ${emp.samples_count} walking samples`,
        `* **Member Since:** ${emp.enrolled_date}`
      ].join('\n');
    } else {
      formattedMessage = [
        `### 👤 Record Not Found`,
        ``,
        `I couldn't find an employee named **"${args.employee_name}"** in your team directory. There are currently **${resultData.totalEnrolledInOrg || 0} team members** registered in your organization.`
      ].join('\n');
    }
  } else if (queryType === 'daily_logs') {
    resultData = await getDailyAccessSummary(tenantId, args.filter);
    formattedMessage = [
      `### 🚪 Today's Door Access Summary`,
      ``,
      `* **Total Entries Today:** **${resultData.total_attempts}** attempts`,
      `* **Smooth Entry Rate:** **${resultData.smooth_rate}**`,
      `* **Flagged Issues for Review:** **${resultData.flagged_issues}**`,
      ``,
      resultData.events.length > 0 
        ? `#### Recent Door Activity:\n` + resultData.events.slice(0, 5).map(e => 
            `- **${e.time}** | **${e.employee_name}** at *${e.gate}* ➔ ${e.status === 'GRANTED' ? '🟢 Unlocked' : '🔴 Stopped'} (${e.reason})`
          ).join('\n')
        : `*No door entry attempts have been recorded yet today.*`
    ].join('\n');
  } else {
    // Default: Workforce summary
    resultData = await getWorkforceSummary(tenantId);
    formattedMessage = [
      `### 👥 Team Workforce Overview`,
      ``,
      `* **Total Registered Team Members:** **${resultData.total_employees}**`,
      `* **Active Passkeys:** **${resultData.active_count}** (Authorized)`,
      `* **Paused Passkeys:** **${resultData.paused_count}** (Suspended)`,
      ``,
      resultData.employees.length > 0 
        ? `#### Registered Team Members:\n` + resultData.employees.map(e => 
            `- **${e.name}** (\`${e.template_id}\`) — ${e.department} [${e.status === 'ACTIVE' ? 'Active' : 'Paused'}]`
          ).join('\n')
        : `*No employees have been added to your organization yet.*`
    ].join('\n');
  }

  return {
    dispatchedAgent: 'Kenny',
    timestamp,
    data: resultData,
    message: formattedMessage
  };
};
