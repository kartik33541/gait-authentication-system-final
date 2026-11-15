from flask import Flask, request, jsonify
from datetime import datetime, timezone, timedelta
import hmac
import io
import json
import logging
import os
import sys
import threading
import time
import joblib
import numpy as np
import pandas as pd
import tensorflow as tf
import tensorflow.keras.backend as K
from dotenv import load_dotenv
from flask_cors import CORS
from sklearn.cluster import KMeans


# ================= FIX IMPORT PATH =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
REPO_ROOT = os.path.abspath(os.path.join(PROJECT_ROOT, ".."))

# Allow Python to see both production folder and app folder regardless of launch entrypoint.
for _path in (PROJECT_ROOT, BASE_DIR):
    if _path not in sys.path:
        sys.path.insert(0, _path)

from LSTM_engine.dataset_loader import extract_windows
from LSTM_engine.build_encoder import get_encoder
from gait_analyzer import (
    diagnose_gait_pattern,
    build_fallback_explanation,
    get_azure_openai_config,
)
from firestore_service import get_firestore_service


# ================= ENV =================
# Load workspace root .env first (shared with Kenny AI), then optional production/.env
load_dotenv(os.path.join(REPO_ROOT, ".env"))
load_dotenv(os.path.join(PROJECT_ROOT, ".env"), override=False)

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
logging.getLogger('werkzeug').setLevel(logging.ERROR)


# ================= PATHS =================
LSTM_DIR = os.path.join(PROJECT_ROOT, "LSTM_engine")

WEIGHTS_PATH = os.path.join(LSTM_DIR, "siamese_lstm.weights.h5")
VAULT_PATH = os.path.join(LSTM_DIR, "vault.json")
SCALER_PATH = os.path.join(PROJECT_ROOT, "scaler.pkl")


# ================= SECURITY =================
DEFAULT_DEV_API_KEY = "GAIT_SECURE_2026"
_configured_api_key = (os.getenv("GAIT_API_KEY") or "").strip()
USING_DEFAULT_DEV_KEY = not bool(_configured_api_key)
API_KEY = _configured_api_key or DEFAULT_DEV_API_KEY
SECURITY_THRESHOLD = 0.75

MIN_WALK_DURATION_MS = 7000
MAX_WALK_DURATION_MS = 120000
MIN_WALK_SAMPLES = 256
EXPECTED_EMBEDDING_DIM = 256
REQUIRED_CSV_COLUMNS = ("timestamp", "ax", "ay", "az", "wx", "wy", "wz")
MAX_AGE_MS = 300000


# ================= APP =================
app = Flask(__name__)
_ENCODER_LOCK = threading.Lock()

_raw_allowed_origins = (os.getenv("ALLOWED_ORIGINS") or "*").strip()
if _raw_allowed_origins == "*":
    ALLOWED_ORIGINS = "*"
else:
    ALLOWED_ORIGINS = [origin.strip().rstrip("/") for origin in _raw_allowed_origins.split(",") if origin.strip()]

CORS(
    app,
    resources={
        r"/*": {
            "origins": ALLOWED_ORIGINS,
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": [
                "Content-Type",
                "X-API-KEY",
                "X-TENANT-ID",
                "X-WORKSPACE-KEY",
                "X-TEMPLATE-ID",
                "X-EMPLOYEE-ID",
                "Authorization",
            ],
        }
    },
    supports_credentials=False,
)


# ================= UTIL =================
def l2_normalize(v):
    n = np.linalg.norm(v)
    return v / n if n > 0 else v


def euclidean_distance(vects):
    x, y = vects
    sum_square = K.sum(K.square(x - y), axis=1, keepdims=True)
    return K.sqrt(K.maximum(sum_square, K.epsilon()))


def denied_response(reason_code, message=None, score=0.0, status_code=200, extra_fields=None):
    """Build a uniform access-denied JSON payload with structured reason and human-readable message."""
    resolved_message = message or build_fallback_explanation(score, SECURITY_THRESHOLD, reason_code)
    payload = {
        "result": "ACCESS_DENIED",
        "reason": reason_code,
        "score": round(float(score), 4),
        "message": resolved_message,
    }
    if extra_fields:
        payload.update(extra_fields)
    return jsonify(payload), status_code


# ================= LOAD AI BRAIN =================
def get_loaded_encoder():

    input_shape = (256, 6)

    encoder = get_encoder(input_shape=input_shape, embedding_dim=256)

    input_a = tf.keras.layers.Input(shape=input_shape)
    input_b = tf.keras.layers.Input(shape=input_shape)

    out_a = encoder(input_a)
    out_b = encoder(input_b)

    dist = tf.keras.layers.Lambda(euclidean_distance)([out_a, out_b])

    full_model = tf.keras.models.Model(inputs=[input_a, input_b], outputs=dist)

    full_model.load_weights(WEIGHTS_PATH)

    return encoder


print("\n🧠 Loading Biometric Engine...")

GLOBAL_ENCODER = get_loaded_encoder()
SCALER = joblib.load(SCALER_PATH)
FIRESTORE_SERVICE = get_firestore_service()
_fs_health = FIRESTORE_SERVICE.health_status()

print("✅ Encoder loaded")
print("✅ Scaler loaded")
if _fs_health["configured"]:
    print(f"✅ Cloud Firestore connected (Project: {_fs_health['project_id']})")
else:
    print(f"⚠️ Cloud Firestore unconfigured: {_fs_health['error']}")
if USING_DEFAULT_DEV_KEY:
    print("⚠️ Using default dev GAIT_API_KEY; set GAIT_API_KEY in env for cloud deployments.")
print("🚀 Secure Biometric Server Running\n")


def _has_valid_gateway_key(req):
    """Verify request X-API-KEY in constant time without tenant-header or prefix bypasses."""
    client_key = (req.headers.get("X-API-KEY") or "").strip()
    if not client_key or not API_KEY:
        return False
    return hmac.compare_digest(client_key, API_KEY)


def _handle_connectivity_ping(raw_text):
    """Preserve Android server connectivity ping response in memory without writing disk files."""
    print("\n🧪 SERVER CONNECTIVITY TEST")
    print("-" * 40)
    print(f"Signal Received : {raw_text}")
    print("Status          : SERVER ONLINE")
    print("=" * 60)
    return jsonify({
        "result": "SERVER_TEST_RECEIVED",
        "message": "Biometric server online and ready for gait authentication.",
    }), 200


def _parse_predict_request(req):
    """Extract only (tenant_id, template_id, csv_text) from JSON or raw CSV + headers."""
    raw_text = req.get_data(as_text=True) or ""
    stripped = raw_text.lstrip()
    looks_like_json = req.is_json or stripped.startswith("{")

    if looks_like_json:
        try:
            payload = json.loads(raw_text)
        except json.JSONDecodeError:
            return denied_response("INVALID_CSV_FORMAT", "Invalid JSON payload. Expected {tenant_id, template_id, csv_data}.", status_code=400), None

        if not isinstance(payload, dict):
            return denied_response("INVALID_CSV_FORMAT", "JSON request body must be an object with tenant_id, template_id, and csv_data.", status_code=400), None

        tenant_id = str(payload.get("tenant_id") or req.headers.get("X-TENANT-ID") or req.headers.get("X-WORKSPACE-KEY") or "").strip()
        template_id = str(payload.get("template_id") or payload.get("employee_id") or req.headers.get("X-TEMPLATE-ID") or req.headers.get("X-EMPLOYEE-ID") or "").strip()
        raw_csv = payload.get("csv_data") if payload.get("csv_data") is not None else payload.get("csv")
        csv_text = raw_csv if isinstance(raw_csv, str) else ("" if raw_csv is None else str(raw_csv))
        is_simulation = bool(payload.get("is_simulation", False) or req.headers.get("X-SIMULATION", "").lower() in ("true", "1"))
    else:
        if not raw_text.strip():
            return denied_response("EMPTY", "Request payload is empty. Walking sensor data is required.", status_code=400), None

        # Check connectivity ping before claim/CSV validation so existing Android ping works untouched.
        if "," not in raw_text:
            return _handle_connectivity_ping(raw_text), None

        csv_text = raw_text
        tenant_id = str(req.headers.get("X-TENANT-ID") or req.headers.get("X-WORKSPACE-KEY") or "").strip()
        template_id = str(req.headers.get("X-TEMPLATE-ID") or req.headers.get("X-EMPLOYEE-ID") or "").strip()
        is_simulation = req.headers.get("X-SIMULATION", "").lower() in ("true", "1")

    if not tenant_id or not template_id:
        return denied_response("MISSING_IDENTITY_CLAIM", status_code=400), None

    if not csv_text.strip():
        return denied_response("EMPTY", "Request payload is empty. Walking sensor data is required.", status_code=400), None

    return None, (tenant_id, template_id, csv_text, is_simulation)


def _validate_and_normalize_templates(raw_templates):
    """Validate 256-D finite vectors from Firestore and defensively normalize to unit L2 norm."""
    if not isinstance(raw_templates, dict):
        return {}

    unit_templates = {}
    for key in sorted(raw_templates.keys()):
        vec = raw_templates[key]
        if not isinstance(vec, (list, tuple, np.ndarray)):
            continue
        arr = np.asarray(vec, dtype=np.float32)
        if arr.ndim != 1 or arr.shape[0] != EXPECTED_EMBEDDING_DIM:
            continue
        if not np.isfinite(arr).all():
            continue
        norm_val = float(np.linalg.norm(arr))
        if norm_val <= 1e-8:
            continue
        unit_templates[str(key)] = arr / norm_val
    return unit_templates


REASON_LABELS = {
    "GRANTED": "Biometric cadence matched active vault",
    "GAIT_MISMATCH": "Walking pattern mismatch",
    "EMERGENCY_LOCKDOWN": "Emergency lockdown active",
    "PERIMETER_INACTIVE": "Security perimeter inactive",
    "ACCESS_PAUSED": "Access paused by admin",
    "EMPLOYEE_NOT_FOUND": "Unregistered employee passkey",
    "INVALID_TEMPLATES": "Missing or invalid biometric template",
    "STATIC_DEVICE": "Stationary or artificial walk detected",
    "REPLAY_ATTACK": "Expired replay recording blocked",
    "DATA_TOO_SHORT": "Insufficient walk steps captured",
    "INVALID_DURATION": "Walk recording duration out of range",
    "INVALID_CSV_FORMAT": "Malformed sensor payload format",
    "INVALID_CSV_SCHEMA": "Missing or corrupted sensor columns",
}


def _format_confidence_pct(raw_score, is_biometric=False):
    """Format confidence score as a clean non-negative dashboard percentage string."""
    if not is_biometric:
        return "0%"
    clamped = max(0.0, min(1.0, float(raw_score)))
    return f"{clamped * 100.0:.1f}%"


def _record_access_log(
    tenant_id,
    template_id,
    reason_code,
    is_granted=False,
    employee_name=None,
    score=0.0,
    is_biometric_score=False,
    walk_energy=0.0,
    ai_diagnosis="",
    threshold=None,
    strictness_mode=None,
    night_strict_active=None,
    is_simulation=False,
):
    """Persist valid-tenant /predict outcome into Firestore access_logs without breaking gate response."""
    if not tenant_id or not FIRESTORE_SERVICE.is_configured:
        return False

    status_label = "GRANTED" if is_granted else "DENIED"
    incident_status = "RESOLVED" if is_granted else "UNRESOLVED"
    human_reason = REASON_LABELS.get(reason_code, reason_code)
    conf_str = _format_confidence_pct(score, is_biometric=is_biometric_score)

    entry = {
        "employee_id": template_id or "UNKNOWN",
        "employee_name": employee_name or template_id or "Unidentified Employee",
        "status": status_label,
        "incident_status": incident_status,
        "confidence_score": conf_str,
        "walk_energy": round(float(walk_energy or 0.0), 2),
        "reason": human_reason,
        "reason_code": reason_code,
        "ai_diagnosis": ai_diagnosis or build_fallback_explanation(
            score, threshold or SECURITY_THRESHOLD, reason_code
        ),
        "gate_id": "GATE-01",
    }
    if is_simulation:
        entry["is_simulation"] = True
        entry["expires_at"] = (datetime.now(timezone.utc) + timedelta(minutes=2)).isoformat().replace("+00:00", "Z")

    if threshold is not None:
        entry["threshold"] = float(threshold)
    if strictness_mode:
        entry["strictness_mode"] = strictness_mode
    if night_strict_active is not None:
        entry["night_strict_active"] = bool(night_strict_active)

    try:
        FIRESTORE_SERVICE.write_access_log(tenant_id, entry)
        return True
    except Exception as exc:
        print(f"⚠️ Telemetry access_log write skipped cleanly: {exc}")
        return False


def _deny_and_log(
    reason_code,
    identity_meta,
    message=None,
    score=0.0,
    is_biometric_score=False,
    walk_energy=0.0,
    status_code=200,
    is_simulation=False,
):
    """Build denial JSON response and persist telemetry log for an authenticated tenant."""
    resolved_message = message or build_fallback_explanation(
        score,
        identity_meta.get("threshold", SECURITY_THRESHOLD),
        reason_code,
    )
    _record_access_log(
        tenant_id=identity_meta["tenant_id"],
        template_id=identity_meta.get("template_id"),
        reason_code=reason_code,
        is_granted=False,
        employee_name=identity_meta.get("employee_name"),
        score=score,
        is_biometric_score=is_biometric_score,
        walk_energy=walk_energy,
        ai_diagnosis=resolved_message,
        threshold=identity_meta.get("threshold"),
        strictness_mode=identity_meta.get("strictness_mode"),
        night_strict_active=identity_meta.get("night_strict_active"),
        is_simulation=is_simulation,
    )
    extra = dict(identity_meta)
    extra["is_simulation"] = is_simulation
    return denied_response(
        reason_code,
        message=resolved_message,
        score=score,
        status_code=status_code,
        extra_fields=extra,
    )


def _enforce_org_governance(org_policy, tenant_id, template_id):
    """Fail fast on organization lockdown or inactive perimeter before employee lookup or ML."""
    policy_meta = {
        "tenant_id": org_policy["tenant_id"],
        "template_id": template_id,
        "threshold": org_policy.get("effective_threshold", SECURITY_THRESHOLD),
        "strictness_mode": org_policy.get("strictness_mode", "BALANCED"),
        "night_strict_active": bool(org_policy.get("night_strict_active", False)),
    }
    if org_policy.get("emergency_lockdown"):
        print("🚨 Access blocked: Perimeter under EMERGENCY LOCKDOWN")
        return _deny_and_log("EMERGENCY_LOCKDOWN", policy_meta, status_code=403)

    if not org_policy.get("active_perimeter", True):
        print("🚫 Access blocked: Organization perimeter INACTIVE")
        return _deny_and_log("PERIMETER_INACTIVE", policy_meta, status_code=403)

    return None


def _enforce_employee_governance(org_policy, employee):
    """Fail closed unless employee passkey status is explicitly ACTIVE before template/ML work."""
    emp_status = str(employee.get("status") or "").strip().upper()
    if emp_status == "ACTIVE":
        return None

    print(f"🚫 Access blocked: Employee status is '{emp_status or 'UNKNOWN'}'")
    custom_msg = None if emp_status == "PAUSED" else (
        f"Access denied. Employee passkey status is '{emp_status or 'INACTIVE'}' and requires ACTIVE authorization."
    )
    return _deny_and_log(
        "ACCESS_PAUSED",
        identity_meta={
            "tenant_id": employee["tenant_id"],
            "template_id": employee["employee_id"],
            "employee_name": employee.get("name"),
            "employee_status": emp_status or "INACTIVE",
            "threshold": org_policy.get("effective_threshold", SECURITY_THRESHOLD),
            "strictness_mode": org_policy.get("strictness_mode", "BALANCED"),
            "night_strict_active": bool(org_policy.get("night_strict_active", False)),
        },
        message=custom_msg,
        status_code=403,
    )


def _resolve_scoped_employee(tenant_id, template_id):
    """Fetch organization and employee template record scoped strictly to (tenant_id, template_id)."""
    if not FIRESTORE_SERVICE.is_configured:
        return denied_response("VAULT_UNAVAILABLE", status_code=503), None

    try:
        org_policy = FIRESTORE_SERVICE.get_organization_policy(tenant_id)
        if org_policy is None:
            return denied_response(
                "TENANT_NOT_FOUND",
                status_code=404,
                extra_fields={"tenant_id": tenant_id, "template_id": template_id},
            ), None

        org_err = _enforce_org_governance(org_policy, tenant_id, template_id)
        if org_err is not None:
            return org_err, None

        employee = FIRESTORE_SERVICE.get_employee_record(tenant_id, template_id)
        if employee is None:
            return _deny_and_log(
                "EMPLOYEE_NOT_FOUND",
                identity_meta={
                    "tenant_id": org_policy["tenant_id"],
                    "template_id": template_id,
                    "threshold": org_policy.get("effective_threshold", SECURITY_THRESHOLD),
                    "strictness_mode": org_policy.get("strictness_mode", "BALANCED"),
                    "night_strict_active": bool(org_policy.get("night_strict_active", False)),
                },
                status_code=404,
            ), None
    except ValueError as ve:
        return denied_response(
            "MISSING_IDENTITY_CLAIM",
            f"Access denied. Invalid company passkey or template ID format: {ve}",
            status_code=400,
        ), None
    except Exception as exc:
        return denied_response(
            "VAULT_UNAVAILABLE",
            f"Biometric vault lookup failed: {exc}",
            status_code=503,
        ), None

    emp_err = _enforce_employee_governance(org_policy, employee)
    if emp_err is not None:
        return emp_err, None

    unit_templates = _validate_and_normalize_templates(employee.get("master_templates"))
    if not unit_templates:
        return _deny_and_log(
            "INVALID_TEMPLATES",
            identity_meta={
                "tenant_id": employee["tenant_id"],
                "template_id": employee["employee_id"],
                "employee_name": employee.get("name"),
                "threshold": org_policy.get("effective_threshold", SECURITY_THRESHOLD),
                "strictness_mode": org_policy.get("strictness_mode", "BALANCED"),
                "night_strict_active": bool(org_policy.get("night_strict_active", False)),
            },
            status_code=422,
        ), None

    return None, {
        "org_policy": org_policy,
        "employee": employee,
        "unit_templates": unit_templates,
    }


def _validate_and_prepare_csv(csv_text, identity_meta, active_threshold=SECURITY_THRESHOLD):
    """Run all Hole 1-4 CSV/signal validations safely before bandpass smoothing and LSTM inference."""
    try:
        df = pd.read_csv(io.StringIO(csv_text.strip()))
    except (pd.errors.ParserError, pd.errors.EmptyDataError, UnicodeDecodeError, ValueError):
        return _deny_and_log("INVALID_CSV_FORMAT", identity_meta, status_code=400), None

    if df.empty:
        return _deny_and_log("INVALID_CSV_FORMAT", identity_meta, status_code=400), None

    df.columns = [str(col).strip() for col in df.columns]
    missing_cols = [col for col in REQUIRED_CSV_COLUMNS if col not in df.columns]
    if missing_cols:
        return _deny_and_log(
            "INVALID_CSV_SCHEMA",
            identity_meta,
            message=f"Access denied. Missing required sensor columns: {', '.join(missing_cols)}.",
            status_code=400,
        ), None

    for col in REQUIRED_CSV_COLUMNS:
        df[col] = pd.to_numeric(df[col], errors="coerce")
        if not np.isfinite(df[col].to_numpy(dtype=np.float64)).all():
            return _deny_and_log(
                "INVALID_CSV_SCHEMA",
                identity_meta,
                message=f"Access denied. Sensor column '{col}' contains empty or non-numeric values.",
                status_code=400,
            ), None

    ts = df["timestamp"].astype(np.float64)
    if (ts.diff().dropna() < 0).any():
        return _deny_and_log(
            "INVALID_DURATION",
            identity_meta,
            message="Access denied. Sensor timestamps moved backwards or were out of order.",
            status_code=400,
        ), None

    duration_ms = float(ts.iloc[-1] - ts.iloc[0])
    print(f"\n⏱ Recording Duration : {duration_ms:.0f} ms")
    if not (MIN_WALK_DURATION_MS <= duration_ms <= MAX_WALK_DURATION_MS):
        print("🚫 Invalid recording duration")
        return _deny_and_log(
            "INVALID_DURATION",
            identity_meta,
            message=f"Access denied. Walk duration ({duration_ms / 1000.0:.1f}s) must be between {MIN_WALK_DURATION_MS // 1000}s and {MAX_WALK_DURATION_MS // 1000}s.",
            status_code=400,
        ), None

    last_timestamp = float(ts.iloc[-1])
    if last_timestamp > 1500000000000:
        age = int(time.time() * 1000) - last_timestamp
        if age > MAX_AGE_MS:
            print("🚫 Replay attack detected")
            return _deny_and_log("REPLAY_ATTACK", identity_meta, status_code=200), None

    acc_mag = np.sqrt(df["ax"] ** 2 + df["ay"] ** 2 + df["az"] ** 2)
    walk_energy = float(acc_mag.std())
    print(f"📊 Walk Energy        : {walk_energy:.4f}")

    # Pre-filter sample guard guarantees scipy.signal.filtfilt (padlen=21) and WINDOW_SIZE=256 never crash.
    if len(df) < MIN_WALK_SAMPLES:
        return _deny_and_log(
            "DATA_TOO_SHORT",
            identity_meta,
            walk_energy=0.0 if not np.isfinite(walk_energy) else walk_energy,
            status_code=400,
        ), None

    if not np.isfinite(walk_energy) or walk_energy < 1.0:
        print("🧍 Static device detected")
        safe_energy = 0.0 if not np.isfinite(walk_energy) else walk_energy
        explanation = diagnose_gait_pattern(
            energy=safe_energy,
            variance=0.0,
            score=0.0,
            threshold=active_threshold,
            confidence_distribution="No physical movement",
            reason_code="STATIC_DEVICE",
            employee_name=identity_meta.get("employee_name"),
        )
        return _deny_and_log(
            "STATIC_DEVICE",
            identity_meta,
            message=explanation,
            score=0.0,
            walk_energy=safe_energy,
            status_code=200,
        ), None

    df_ml = df[["ax", "ay", "az", "wx", "wy", "wz"]].astype(np.float32)
    windows = extract_windows(df_ml, SCALER)
    if len(windows) == 0:
        return _deny_and_log("DATA_TOO_SHORT", identity_meta, walk_energy=walk_energy, status_code=400), None

    return None, {
        "windows": windows,
        "walk_energy": walk_energy,
        "duration_ms": duration_ms,
    }


def _score_1to1_walk(embeddings, unit_templates, threshold):
    """Compare each walk window against only the claimed employee's templates using Median consensus."""
    template_vectors = list(unit_templates.values())
    clip_scores = [
        max(float(np.dot(emb, t_vec)) for t_vec in template_vectors)
        for emb in embeddings
    ]
    return {
        "score": float(np.median(clip_scores)),
        "mean_score": float(np.mean(clip_scores)),
        "clip_scores": clip_scores,
        "windows_evaluated": len(clip_scores),
        "matched_windows": sum(1 for s in clip_scores if s >= threshold),
    }


# ================= ROUTE =================
@app.route("/", methods=["GET"])
def index():
    return """<!DOCTYPE html>
<html>
<head>
    <title>GaitAuth Biometric Engine</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0b0f19; color: #f8fafc; text-align: center; padding: 60px 20px; }
        .card { max-width: 640px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 36px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
        h1 { color: #38bdf8; font-size: 26px; margin: 12px 0; }
        p { color: #94a3b8; font-size: 15px; line-height: 1.6; }
        .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; padding: 6px 14px; border-radius: 9999px; font-weight: bold; font-size: 13px; }
        .dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; }
        .endpoints { text-align: left; background: #0b0f19; border: 1px solid #1e293b; padding: 20px 24px; border-radius: 10px; margin-top: 24px; font-family: monospace; font-size: 13px; color: #7dd3fc; }
        .method { color: #34d399; font-weight: bold; }
        .method-get { color: #60a5fa; font-weight: bold; }
        li { margin: 8px 0; list-style: none; }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge"><div class="dot"></div> ML BACKEND ONLINE</div>
        <h1>🚶 GaitAuth Biometric Intelligence Engine</h1>
        <p>Enterprise Zero-Trust Continuous Biometric Authentication Server running on Cloud Infrastructure.</p>
        <div class="endpoints">
            <ul>
                <li><span class="method">POST</span> /predict &mdash; Siamese LSTM 1:1 Verification</li>
                <li><span class="method">POST</span> /api/enroll &mdash; Biometric Template Enrollment</li>
                <li><span class="method">POST</span> /api/send-invite &mdash; Automated Passkey Dispatch</li>
                <li><span class="method-get">GET</span>  /api/health &mdash; Real-Time Diagnostics</li>
            </ul>
        </div>
    </div>
</body>
</html>"""


@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        return ("", 204)

    if not _has_valid_gateway_key(request):
        print("🚫 Unauthorized /predict request")
        return denied_response(
            "UNAUTHORIZED",
            "Unauthorized gateway request. Missing or invalid API key.",
            status_code=401,
        )

    start_time = time.time()

    print("\n" + "=" * 60)
    print("📥 AUTHENTICATION REQUEST RECEIVED")
    print("=" * 60)

    try:
        err_resp, parsed = _parse_predict_request(request)
        if err_resp is not None:
            return err_resp
        tenant_id, template_id, csv_text, is_simulation = parsed

        err_resp, emp_ctx = _resolve_scoped_employee(tenant_id, template_id)
        if err_resp is not None:
            return err_resp

        org_policy = emp_ctx["org_policy"]
        employee = emp_ctx["employee"]
        unit_templates = emp_ctx["unit_templates"]
        active_threshold = float(org_policy.get("effective_threshold", SECURITY_THRESHOLD))
        strictness_mode = org_policy.get("strictness_mode", "BALANCED")
        night_strict_active = bool(org_policy.get("night_strict_active", False))

        identity_meta = {
            "tenant_id": employee["tenant_id"],
            "template_id": employee["employee_id"],
            "employee_name": employee.get("name"),
            "threshold": active_threshold,
            "strictness_mode": strictness_mode,
            "night_strict_active": night_strict_active,
        }

        err_resp, signal_data = _validate_and_prepare_csv(
            csv_text, identity_meta, active_threshold=active_threshold
        )
        if err_resp is not None:
            return err_resp

        windows_arr = np.array(signal_data["windows"], dtype=np.float32)
        with _ENCODER_LOCK:
            embeddings = GLOBAL_ENCODER.predict(windows_arr, verbose=0)
        embeddings = np.array([l2_normalize(e) for e in embeddings])
        step_variance = float(np.mean(np.var(embeddings, axis=0)))

        match_stats = _score_1to1_walk(embeddings, unit_templates, active_threshold)
        best_score = match_stats["score"]
        is_granted = best_score >= active_threshold

        employee_name = employee.get("name") or template_id
        if is_granted:
            status = "ACCESS GRANTED"
            result = employee_name
            reason_code = "GRANTED"
        else:
            status = "ACCESS DENIED"
            result = "ACCESS_DENIED"
            reason_code = "GAIT_MISMATCH"

        print("\n🧠 1:1 GAIT AUTHENTICATION RESULT")
        print("-" * 40)
        print(f"Tenant / Template   : {employee['tenant_id']} / {employee['employee_id']} ({employee_name})")
        print(f"Policy / Threshold  : {strictness_mode} ({active_threshold}, NightStrict={night_strict_active})")
        print(f"Median Similarity   : {best_score:.4f} (Clips: {[round(s, 4) for s in match_stats['clip_scores']]})")
        print(f"Simulation Test     : {is_simulation}")
        print(f"Decision            : {status}")

        explanation = diagnose_gait_pattern(
            energy=signal_data["walk_energy"],
            variance=step_variance,
            score=best_score,
            threshold=active_threshold,
            confidence_distribution=match_stats["clip_scores"][:10],
            reason_code=reason_code,
            employee_name=employee_name if is_granted else None,
        )

        print("\n🤖 AI Explanation")
        print(explanation)
        print("=" * 60)

        log_recorded = _record_access_log(
            tenant_id=employee["tenant_id"],
            template_id=employee["employee_id"],
            reason_code=reason_code,
            is_granted=is_granted,
            employee_name=employee_name,
            score=best_score,
            is_biometric_score=True,
            walk_energy=signal_data["walk_energy"],
            ai_diagnosis=explanation,
            threshold=active_threshold,
            strictness_mode=strictness_mode,
            night_strict_active=night_strict_active,
            is_simulation=is_simulation,
        )

        return jsonify({
            "result": result,
            "reason": reason_code,
            "tenant_id": employee["tenant_id"],
            "template_id": employee["employee_id"],
            "employee_name": employee_name,
            "score": round(best_score, 4),
            "threshold": active_threshold,
            "strictness_mode": strictness_mode,
            "night_strict_active": night_strict_active,
            "windows_evaluated": match_stats["windows_evaluated"],
            "matched_windows": match_stats["matched_windows"],
            "log_recorded": log_recorded,
            "is_simulation": is_simulation,
            "message": explanation,
            "response_time_sec": round(time.time() - start_time, 3),
        }), 200

    except Exception as e:
        print(f"🔥 Server Error: {e}")
        return jsonify({"result": "ERROR"}), 500


ENROLL_MOTION_COLUMNS = ("ax", "ay", "az", "wx", "wy", "wz")


def _extract_enroll_motion_windows(csv_text, label="Recording"):
    """Validate uploaded enrollment CSV strictly before bandpass filtering and window extraction."""
    if not csv_text or not isinstance(csv_text, str) or not csv_text.strip():
        return f"{label} is empty.", []

    try:
        df = pd.read_csv(io.StringIO(csv_text.strip()))
    except (pd.errors.ParserError, pd.errors.EmptyDataError, UnicodeDecodeError, ValueError):
        return f"{label} could not be parsed as valid CSV data.", []

    if df.empty:
        return f"{label} contains zero data rows.", []

    df.columns = [str(col).strip() for col in df.columns]
    missing_cols = [c for c in ENROLL_MOTION_COLUMNS if c not in df.columns]
    if missing_cols:
        return (
            f"{label} is missing required motion sensor columns: {', '.join(missing_cols)}.",
            [],
        )

    for col in ENROLL_MOTION_COLUMNS:
        df[col] = pd.to_numeric(df[col], errors="coerce")
        if not np.isfinite(df[col].to_numpy(dtype=np.float64)).all():
            return f"{label} contains empty or non-numeric values in '{col}'.", []

    # Guard scipy.signal.filtfilt (padlen=21) and WINDOW_SIZE=256 up front.
    if len(df) < MIN_WALK_SAMPLES:
        return (
            f"{label} only has {len(df)} samples; at least {MIN_WALK_SAMPLES} samples (~7s of walking) are required.",
            [],
        )

    acc_mag = np.sqrt(df["ax"] ** 2 + df["ay"] ** 2 + df["az"] ** 2)
    walk_energy = float(acc_mag.std())
    if not np.isfinite(walk_energy) or walk_energy < 1.0:
        return (
            f"{label} appears stationary or non-walking (energy={0.0 if not np.isfinite(walk_energy) else walk_energy:.2f} < 1.0). Please upload a natural walk recording.",
            [],
        )

    df_ml = df[list(ENROLL_MOTION_COLUMNS)].astype(np.float32)
    windows = extract_windows(df_ml, SCALER)
    if len(windows) == 0:
        return f"{label} could not produce valid 256-sample walking windows.", []

    return None, windows


def _filter_directional_outliers(raw_embeddings):
    """Remove directional stumble outliers via cosine agreement to median centroid instead of vector norm."""
    emb = np.array([l2_normalize(e) for e in raw_embeddings], dtype=np.float32)
    if len(emb) <= 5:
        return emb, 0

    centroid = l2_normalize(np.median(emb, axis=0))
    if float(np.linalg.norm(centroid)) <= 1e-8:
        centroid = l2_normalize(np.mean(emb, axis=0))

    sims = np.dot(emb, centroid)
    median_sim = float(np.median(sims))
    mad = float(np.median(np.abs(sims - median_sim)))
    cutoff = max(0.35, min(median_sim - max(0.15, 2.5 * mad), 0.75))

    kept_mask = sims >= cutoff
    kept = emb[kept_mask]
    if len(kept) < 3:
        top_count = max(3, int(np.ceil(len(emb) * 0.6)))
        top_indices = np.argsort(sims)[-top_count:]
        kept = emb[top_indices]

    return kept, int(len(emb) - len(kept))


# ================= ENROLL ROUTE =================
@app.route("/api/enroll", methods=["POST", "OPTIONS"])
def enroll_employee():
    if request.method == "OPTIONS":
        return ("", 204)

    if not _has_valid_gateway_key(request):
        print("🚫 Unauthorized /api/enroll request")
        return jsonify({
            "status": "ERROR",
            "reason": "UNAUTHORIZED",
            "message": "Unauthorized gateway request. Missing or invalid API key.",
        }), 401

    try:
        data = request.get_json(force=True, silent=True)
        if not isinstance(data, dict):
            return jsonify({"status": "ERROR", "message": "Invalid JSON payload. Expected enrollment object."}), 400

        template_id = str(data.get("template_id") or "EMP-001").strip()
        tenant_id = str(data.get("tenant_id") or request.headers.get("X-TENANT-ID") or "").strip()
        employee_name = str(data.get("employee_name") or template_id).strip()
        csv_files = data.get("csv_files", [])
        enroll_mode = str(data.get("mode") or "REPLACE").strip().upper()
        existing_templates = data.get("existing_templates")
        persist_to_cloud = bool(data.get("persist", False))

        if not isinstance(csv_files, list) or len(csv_files) == 0:
            return jsonify({"status": "ERROR", "message": "At least one walking CSV recording is required."}), 400

        all_windows = []
        for idx, csv_text in enumerate(csv_files):
            err_msg, windows = _extract_enroll_motion_windows(csv_text, label=f"Recording #{idx + 1}")
            if err_msg:
                return jsonify({"status": "ERROR", "message": err_msg}), 400
            all_windows.extend(windows)

        if len(all_windows) == 0:
            return jsonify({"status": "ERROR", "message": "Recordings too short to extract 256-sample windows."}), 400

        windows_arr = np.array(all_windows, dtype=np.float32)
        with _ENCODER_LOCK:
            raw_emb = GLOBAL_ENCODER.predict(windows_arr, verbose=0)
        emb, outliers_removed = _filter_directional_outliers(raw_emb)
        retained_new_windows = int(len(emb))

        if enroll_mode == "APPEND" and isinstance(existing_templates, dict):
            existing_unit = _validate_and_normalize_templates(existing_templates)
            if existing_unit:
                old_vecs = np.array(list(existing_unit.values()), dtype=np.float32)
                repeats = max(1, min(4, round(len(emb) / len(old_vecs))))
                emb = np.vstack([np.repeat(old_vecs, repeats, axis=0), emb])

        num_templates = 3
        templates_map = {}

        if len(emb) >= num_templates:
            kmeans = KMeans(n_clusters=num_templates, n_init=10, random_state=42)
            labels = kmeans.fit_predict(emb)
            for cid in range(num_templates):
                c_emb = emb[labels == cid]
                if len(c_emb) > 0:
                    centroid = l2_normalize(np.mean(c_emb, axis=0))
                    templates_map[f"t{cid + 1}"] = [round(float(v), 6) for v in centroid]
        else:
            mean_vec = l2_normalize(np.mean(emb, axis=0))
            for cid in range(num_templates):
                templates_map[f"t{cid + 1}"] = [round(float(v), 6) for v in mean_vec]

        if tenant_id:
            FIRESTORE_SERVICE.invalidate_employee_cache(tenant_id, template_id)
            if persist_to_cloud and FIRESTORE_SERVICE.is_configured:
                FIRESTORE_SERVICE.save_employee_templates(
                    tenant_id=tenant_id,
                    employee_id=template_id,
                    name=employee_name,
                    master_templates=templates_map,
                    readings_count=len(csv_files),
                )

        return jsonify({
            "status": "SUCCESS",
            "mode": enroll_mode,
            "template_id": template_id,
            "master_templates": templates_map,
            "total_windows": len(all_windows),
            "retained_windows": retained_new_windows,
            "outliers_removed": outliers_removed,
        }), 200

    except Exception as e:
        print(f"🔥 Enroll Error: {e}")
        return jsonify({"status": "ERROR", "message": str(e)}), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    llm_cfg = get_azure_openai_config()
    fs_health = FIRESTORE_SERVICE.health_status()
    return jsonify({
        "status": "ONLINE",
        "service": "Gait Biometric Engine",
        "model": "Siamese_LSTM_256D",
        "llm_provider": f"Azure_OpenAI_{llm_cfg['deployment']}" if llm_cfg["is_configured"] else "Fallback",
        "vault_backend": fs_health["vault_backend"],
        "firestore_configured": fs_health["configured"],
        "firebase_project": fs_health["project_id"],
        "cache_entries": fs_health["cache_entries"],
        "timestamp": time.time()
    }), 200


@app.route("/api/send-invite", methods=["POST", "OPTIONS"])
def send_employee_invite():
    """Dispatch automated email invite with employee facility passkey and 1-click mobile setup link."""
    if request.method == "OPTIONS":
        return "", 204

    data = request.get_json(silent=True) or {}
    tenant_id = str(data.get("tenant_id") or "").strip()
    employee_id = str(data.get("employee_id") or "").strip()
    employee_name = str(data.get("employee_name") or "Team Member").strip()
    employee_email = str(data.get("employee_email") or "").strip().lower()
    company_name = str(data.get("company_name") or "GaitAuth Facility").strip()

    if not employee_email or "@" not in employee_email:
        return jsonify({"status": "ERROR", "message": "A valid recipient email address is required"}), 400
    if not tenant_id or not employee_id:
        return jsonify({"status": "ERROR", "message": "tenant_id and employee_id are required"}), 400

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_pass = os.getenv("SMTP_APP_PASSWORD", "").strip().replace(" ", "")
    sender_name = os.getenv("SMTP_SENDER_NAME", "GaitAuth Smart Access").strip()
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

    if not smtp_user or not smtp_pass:
        print("⚠️ [Email Invite Warning] SMTP_USER or SMTP_APP_PASSWORD not set in environment.")
        return jsonify({
            "status": "ERROR",
            "message": "Email service is not configured on the server (missing SMTP credentials)."
        }), 500

    setup_url = f"{frontend_url}/setup?tenant={tenant_id}&emp={employee_id}"

    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"[Action Required] Set up your contactless GaitAuth passkey for {company_name}"
    msg["From"] = f"{sender_name} <{smtp_user}>"
    msg["To"] = employee_email

    plain_text = f"""Hello {employee_name},

{company_name} has enrolled you in the GaitAuth contactless entry system.
You can unlock company turnstiles and security doors simply by walking naturally with your phone in your pocket.

YOUR FACILITY PASSKEY:
* Company ID: {tenant_id}
* Badge ID:   {employee_id}

COMPLETE YOUR 30-SECOND MOBILE SETUP HERE:
{setup_url}

INSTRUCTIONS:
1. Open the setup link above on your Android smartphone.
2. Download the GaitAuth APK (3.7 MB).
3. Tap 'Copy Passkey' and paste it when you open the app.
"""

    html_text = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090d; color: #f5f5fa; padding: 24px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #13131a; padding: 36px; border-radius: 16px; border: 1px solid #272733;">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
      <h2 style="color: #a477ff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">GaitAuth Smart Access</h2>
    </div>

    <p style="font-size: 15px; color: #f5f5fa; margin-top: 0;">Hello <strong>{employee_name}</strong>,</p>
    <p style="font-size: 14px; color: #a8a8b8; line-height: 1.6;">
      <strong>{company_name}</strong> has enrolled you in the GaitAuth contactless entry system.
      You can now unlock company turnstiles and security doors simply by walking naturally with your phone in your pocket.
    </p>

    <div style="background: #1c1c26; padding: 20px; border-radius: 12px; border: 1px solid #2d2d3d; margin: 24px 0;">
      <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em; color: #a477ff; margin-bottom: 12px;">Your Facility Passkey</div>
      <div style="font-family: monospace; font-size: 14px; color: #ffffff; margin-bottom: 8px;">
        <span style="color: #a8a8b8;">Company ID:</span> <strong>{tenant_id}</strong>
      </div>
      <div style="font-family: monospace; font-size: 14px; color: #ffffff;">
        <span style="color: #a8a8b8;">Badge ID:</span>   <strong>{employee_id}</strong>
      </div>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="{setup_url}" style="background: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
        Complete 30-Second Mobile Setup &rarr;
      </a>
    </div>

    <div style="border-top: 1px solid #232330; padding-top: 20px; font-size: 12px; color: #707085; line-height: 1.5;">
      <strong>Quick Instructions:</strong><br/>
      1. Tap the setup button above on your Android phone.<br/>
      2. Download the GaitAuth APK (3.7 MB).<br/>
      3. Tap 'Copy Passkey' and paste it in the app on first launch.
    </div>
  </div>
</body>
</html>"""

    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(html_text, "html"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=12) as s:
            s.ehlo()
            s.starttls()
            s.ehlo()
            s.login(smtp_user, smtp_pass)
            s.send_message(msg)

        print(f"📧 [Email Invite] Dispatched to {employee_email} ({employee_id}) successfully.")
        return jsonify({
            "status": "SENT",
            "message": f"Invitation email sent to {employee_email} successfully!",
            "recipient": employee_email,
            "tenant_id": tenant_id,
            "employee_id": employee_id
        }), 200
    except Exception as err:
        print(f"🔥 [Email Invite Error] Failed to send to {employee_email}: {err}")
        return jsonify({
            "status": "ERROR",
            "message": f"Failed to deliver email: {str(err)}"
        }), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    app.run(host="0.0.0.0", port=port, threaded=True)


