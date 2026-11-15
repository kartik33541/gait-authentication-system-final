/**
 * Shared client for communicating with the Flask Biometric ML Server.
 * Uses VITE_ML_API_URL when configured, defaulting to localhost:8000 for local development.
 */
export const getMlApiBaseUrl = () => {
  const configured = import.meta.env?.VITE_ML_API_URL;
  return (configured ? String(configured) : 'https://kartik33541-gaitauth-backend.hf.space').replace(/\/+$/, '');
};

export const getMlGatewayKey = () => {
  const configured = import.meta.env?.VITE_ML_GATEWAY_KEY;
  return (configured ? String(configured) : 'GAIT_SECURE_2026').trim();
};

export const getGatewayHeaders = (tenantId = '') => ({
  'Content-Type': 'application/json',
  'X-API-KEY': getMlGatewayKey(),
  ...(tenantId ? { 'X-TENANT-ID': tenantId } : {}),
});

export const checkBiometricServerHealth = async (timeoutMs = 2500) => {
  const baseUrl = getMlApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/health`, {
    method: 'GET',
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`Biometric server returned HTTP ${res.status}`);
  }
  const data = await res.json();
  if (data?.status !== 'ONLINE') {
    throw new Error(`Biometric server status is '${data?.status || 'UNKNOWN'}'`);
  }
  return data;
};

export const enrollEmployeeBiometrics = async ({
  tenantId,
  templateId,
  employeeName,
  csvFiles,
  mode = 'REPLACE',
  existingTemplates = null,
}) => {
  const baseUrl = getMlApiBaseUrl();
  let res;

  try {
    res = await fetch(`${baseUrl}/api/enroll`, {
      method: 'POST',
      headers: getGatewayHeaders(tenantId),
      body: JSON.stringify({
        tenant_id: tenantId,
        template_id: templateId,
        employee_name: employeeName,
        csv_files: csvFiles,
        mode,
        ...(existingTemplates ? { existing_templates: existingTemplates } : {}),
      }),
    });
  } catch (networkErr) {
    throw new Error(
      `Biometric ML server is offline or unreachable (${baseUrl}). Please ensure the Flask server is running and try again.`,
      { cause: networkErr }
    );
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok || data?.status !== 'SUCCESS' || !data?.master_templates) {
    throw new Error(data?.message || `Biometric enrollment failed (HTTP ${res.status}).`);
  }

  return data;
};

/**
 * Client-side inspect utility for preflight CSV diagnostics in the simulator.
 */
export const inspectWalkCsvText = (csvText) => {
  if (!csvText || typeof csvText !== 'string' || !csvText.trim()) {
    return { isValid: false, rows: 0, durationSec: 0, missingCols: ['ax', 'ay', 'az', 'wx', 'wy', 'wz'], isEpoch: false, error: 'Empty file' };
  }

  const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { isValid: false, rows: 0, durationSec: 0, missingCols: ['ax', 'ay', 'az', 'wx', 'wy', 'wz'], isEpoch: false, error: 'Contains no data rows' };
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const required = ['ax', 'ay', 'az', 'wx', 'wy', 'wz'];
  const missingCols = required.filter((col) => !headers.includes(col));
  const tsIdx = headers.indexOf('timestamp');

  let durationSec = 0;
  let isEpoch = false;

  if (tsIdx !== -1 && lines.length > 2) {
    const firstTs = parseFloat(lines[1].split(',')[tsIdx]);
    const lastTs = parseFloat(lines[lines.length - 1].split(',')[tsIdx]);
    if (Number.isFinite(firstTs) && Number.isFinite(lastTs) && lastTs >= firstTs) {
      durationSec = Math.round((lastTs - firstTs) / 1000);
      isEpoch = lastTs > 1500000000000;
    }
  }

  const rows = lines.length - 1;
  const isValid = missingCols.length === 0 && rows >= 256;

  return {
    isValid,
    rows,
    durationSec,
    missingCols,
    isEpoch,
    error: missingCols.length > 0 
      ? `Missing columns: ${missingCols.join(', ')}` 
      : rows < 256 
        ? `Contains only ${rows} rows (minimum 256 required)` 
        : null,
  };
};

/**
 * Rewrites CSV timestamps so the walk window is fresh (ending at current millisecond).
 * Preserves exact sensor accelerometer/gyroscope signals and cadence.
 */
export const refreshCsvTimestamps = (csvText) => {
  if (!csvText || typeof csvText !== 'string') return csvText;
  const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return csvText;

  const headers = lines[0].split(',').map((h) => h.trim());
  const tsIdx = headers.findIndex((h) => h.toLowerCase() === 'timestamp');
  const now = Date.now();
  const stepMs = 26; // ~38.4 Hz standard phone sampling
  const rowCount = lines.length - 1;
  const startTs = now - (rowCount * stepMs);

  const newLines = [lines[0]];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    const currentTs = startTs + ((i - 1) * stepMs);
    if (tsIdx !== -1 && parts.length > tsIdx) {
      parts[tsIdx] = String(currentTs);
      newLines.push(parts.join(','));
    } else {
      newLines.push(`${currentTs},${lines[i]}`);
    }
  }

  if (tsIdx === -1) {
    newLines[0] = `timestamp,${newLines[0]}`;
  }

  return newLines.join('\n');
};

/**
 * Trigger live 1:1 gait authentication on the Flask server with full outcome resolution.
 */
export const verifyEmployeeGait = async ({
  tenantId,
  templateId,
  csvData,
  isSimulation = true,
}) => {
  const baseUrl = getMlApiBaseUrl();
  let res;

  try {
    res = await fetch(`${baseUrl}/predict`, {
      method: 'POST',
      headers: getGatewayHeaders(tenantId),
      body: JSON.stringify({
        tenant_id: tenantId,
        template_id: templateId,
        csv_data: csvData,
        is_simulation: isSimulation,
      }),
    });
  } catch (networkErr) {
    throw new Error(
      `Biometric ML server is offline or unreachable (${baseUrl}). Please ensure the Flask server is running and try again.`,
      { cause: networkErr }
    );
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (res.status === 401) {
    throw new Error('Gateway Unauthorized (401): Missing or invalid X-API-KEY gateway passkey.');
  }

  if (!data || typeof data !== 'object') {
    throw new Error(`Biometric engine returned unexpected HTTP ${res.status}.`);
  }

  const isGranted = data.reason === 'GRANTED' || data.result === data.employee_name;

  return {
    granted: isGranted,
    result: data.result || (isGranted ? 'ACCESS GRANTED' : 'ACCESS DENIED'),
    reason: data.reason || (isGranted ? 'GRANTED' : `REJECTED_${res.status}`),
    message: data.message || (isGranted ? 'Access granted. Your walking pattern matches the registered profile.' : 'Access denied.'),
    score: typeof data.score === 'number' ? data.score : 0.0,
    threshold: typeof data.threshold === 'number' ? data.threshold : 0.75,
    strictnessMode: data.strictness_mode || 'BALANCED',
    nightStrictActive: Boolean(data.night_strict_active),
    windowsEvaluated: data.windows_evaluated || 0,
    matchedWindows: data.matched_windows || 0,
    logRecorded: Boolean(data.log_recorded),
    isSimulation: Boolean(data.is_simulation ?? isSimulation),
    responseTimeSec: typeof data.response_time_sec === 'number' ? data.response_time_sec : 0.0,
    httpStatus: res.status,
  };
};

/**
 * Dispatch automated employee passkey invite email via Flask backend.
 */
export const sendEmployeeInviteEmail = async ({
  tenantId,
  employeeId,
  employeeName,
  employeeEmail,
  companyName,
}) => {
  const baseUrl = getMlApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/send-invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': getMlGatewayKey(),
    },
    body: JSON.stringify({
      tenant_id: tenantId,
      employee_id: employeeId,
      employee_name: employeeName,
      employee_email: employeeEmail,
      company_name: companyName,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.status !== 'SENT') {
    throw new Error(data?.message || `Failed to send email invite (HTTP ${res.status}).`);
  }
  return data;
};

