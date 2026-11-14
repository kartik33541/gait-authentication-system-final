import json
import math
import os
import re
import threading
import time
from datetime import datetime, timezone

try:
    from zoneinfo import ZoneInfo
except ImportError:
    ZoneInfo = None

import requests
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2 import service_account

FIRESTORE_SCOPE = "https://www.googleapis.com/auth/datastore"
SAFE_ID_PATTERN = re.compile(r"^[A-Za-z0-9._-]+$")
STRICT_NIGHT_THRESHOLD = 0.85
DEFAULT_THRESHOLD = 0.75
DEFAULT_AUTO_NIGHT_STRICT = True
MODE_DEFAULT_THRESHOLDS = {
    "HIGH_THROUGHPUT": 0.65,
    "BALANCED": 0.75,
    "STRICT": 0.85,
}


def _assert_safe_id(value, label="identifier"):
    """Validate Firestore document IDs to prevent path traversal or empty keys."""
    cleaned = (value or "").strip()
    if not cleaned or not SAFE_ID_PATTERN.match(cleaned):
        raise ValueError(f"Invalid {label}: '{value}'")
    return cleaned


def decode_firestore_value(typed_val):
    """Convert a Firestore REST v1 typed value dictionary into a native Python object."""
    if not isinstance(typed_val, dict):
        return typed_val
    if "nullValue" in typed_val:
        return None
    if "stringValue" in typed_val:
        return typed_val["stringValue"]
    if "booleanValue" in typed_val:
        return bool(typed_val["booleanValue"])
    if "integerValue" in typed_val:
        return int(typed_val["integerValue"])
    if "doubleValue" in typed_val:
        return float(typed_val["doubleValue"])
    if "timestampValue" in typed_val:
        return typed_val["timestampValue"]
    if "arrayValue" in typed_val:
        values = typed_val["arrayValue"].get("values", [])
        return [decode_firestore_value(item) for item in values]
    if "mapValue" in typed_val:
        fields = typed_val["mapValue"].get("fields", {})
        return {k: decode_firestore_value(v) for k, v in fields.items()}
    return typed_val


def decode_firestore_doc(doc_json):
    """Flatten a Firestore REST v1 document resource into a Python dictionary."""
    if not doc_json or "fields" not in doc_json:
        doc_id = doc_json.get("name", "").rsplit("/", 1)[-1] if isinstance(doc_json, dict) else None
        return {"id": doc_id} if doc_id else {}

    decoded = {k: decode_firestore_value(v) for k, v in doc_json.get("fields", {}).items()}
    name = doc_json.get("name", "")
    if name:
        decoded["_doc_id"] = name.rsplit("/", 1)[-1]
    return decoded


def encode_firestore_value(value):
    """Encode a native Python value into a Firestore REST v1 typed value dictionary."""
    if value is None:
        return {"nullValue": None}
    if isinstance(value, bool):
        return {"booleanValue": value}
    if isinstance(value, int):
        return {"integerValue": str(value)}
    if isinstance(value, float):
        return {"doubleValue": value}
    if isinstance(value, datetime):
        utc_dt = value.astimezone(timezone.utc) if value.tzinfo else value.replace(tzinfo=timezone.utc)
        return {"timestampValue": utc_dt.isoformat().replace("+00:00", "Z")}
    if isinstance(value, (list, tuple)):
        return {"arrayValue": {"values": [encode_firestore_value(item) for item in value]}}
    if isinstance(value, dict):
        return {"mapValue": {"fields": {str(k): encode_firestore_value(v) for k, v in value.items()}}}
    return {"stringValue": str(value)}


def encode_firestore_fields(payload):
    """Wrap a Python dict into a Firestore REST v1 document body."""
    return {"fields": {str(k): encode_firestore_value(v) for k, v in payload.items()}}


def _resolve_policy_hour(policy_dict=None, local_hour=None):
    """Resolve current 0-23 hour using optional policy/env timezone or server clock."""
    if local_hour is not None:
        return int(local_hour) % 24

    tz_name = ""
    if isinstance(policy_dict, dict):
        tz_name = str(policy_dict.get("timezone") or "").strip()
    if not tz_name:
        tz_name = os.getenv("PERIMETER_TIMEZONE", "").strip()

    if tz_name and ZoneInfo is not None:
        try:
            return datetime.now(ZoneInfo(tz_name)).hour
        except Exception:
            pass
    return datetime.now().hour


def evaluate_policy_threshold(policy_dict, local_hour=None):
    """Compute effective gate threshold, normalized base threshold, mode, and night state."""
    policy = policy_dict if isinstance(policy_dict, dict) else {}

    raw_mode = str(policy.get("strictness_mode") or "BALANCED").strip().upper()
    strictness_mode = raw_mode if raw_mode in MODE_DEFAULT_THRESHOLDS else "BALANCED"
    mode_default = MODE_DEFAULT_THRESHOLDS[strictness_mode]

    raw_threshold = policy.get("threshold", mode_default)
    if isinstance(raw_threshold, bool):
        base_threshold = mode_default
    else:
        try:
            base_threshold = float(raw_threshold)
        except (TypeError, ValueError):
            base_threshold = mode_default

    if not math.isfinite(base_threshold) or not (0.50 <= base_threshold <= 0.99):
        base_threshold = mode_default

    raw_auto_night = policy.get("auto_night_strict")
    auto_night = DEFAULT_AUTO_NIGHT_STRICT if raw_auto_night is None else bool(raw_auto_night)

    hour = _resolve_policy_hour(policy, local_hour=local_hour)
    is_night_window = hour >= 20 or hour < 8
    effective_threshold = (
        max(base_threshold, STRICT_NIGHT_THRESHOLD) if (auto_night and is_night_window) else base_threshold
    )
    night_strict_active = bool(auto_night and is_night_window and effective_threshold >= STRICT_NIGHT_THRESHOLD)

    return {
        "strictness_mode": strictness_mode,
        "base_threshold": round(base_threshold, 4),
        "effective_threshold": round(effective_threshold, 4),
        "auto_night_strict": auto_night,
        "night_strict_active": night_strict_active,
    }


def resolve_effective_threshold(policy_dict, local_hour=None):
    """Apply tenant strictness setting and automated 8 PM - 8 AM strict night override."""
    return evaluate_policy_threshold(policy_dict, local_hour=local_hour)["effective_threshold"]


class _VersionedTemplateCache:
    """Thread-safe in-memory cache for biometric templates keyed by calibration version."""

    def __init__(self, ttl_seconds=60):
        self._ttl = ttl_seconds
        self._lock = threading.Lock()
        self._store = {}

    def get(self, tenant_id, employee_id, version_stamp):
        key = (tenant_id, employee_id)
        now = time.time()
        with self._lock:
            entry = self._store.get(key)
            if not entry:
                return None
            if entry["expires_at"] < now or entry["version"] != version_stamp:
                self._store.pop(key, None)
                return None
            return entry["templates"]

    def put(self, tenant_id, employee_id, version_stamp, templates):
        key = (tenant_id, employee_id)
        with self._lock:
            self._store[key] = {
                "version": version_stamp,
                "expires_at": time.time() + self._ttl,
                "templates": templates,
            }

    def invalidate(self, tenant_id, employee_id):
        with self._lock:
            self._store.pop((tenant_id, employee_id), None)

    def size(self):
        with self._lock:
            return len(self._store)


class EnterpriseFirestoreService:
    """Stateless, multi-tenant Cloud Firestore client powered by a Firebase Service Account."""

    def __init__(self, repo_root=None, production_root=None, cache_ttl_seconds=60):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.production_root = production_root or os.path.abspath(os.path.join(base_dir, ".."))
        self.repo_root = repo_root or os.path.abspath(os.path.join(self.production_root, ".."))

        self._lock = threading.Lock()
        self._session = requests.Session()
        self._credentials = None
        self._project_id = None
        self._init_error = None
        self._cache = _VersionedTemplateCache(ttl_seconds=cache_ttl_seconds)

        self._load_credentials()

    def _resolve_credential_path(self, raw_path):
        if not raw_path:
            return None
        if os.path.isabs(raw_path) and os.path.exists(raw_path):
            return raw_path
        for root in (self.repo_root, self.production_root):
            candidate = os.path.abspath(os.path.join(root, raw_path))
            if os.path.exists(candidate):
                return candidate
        return None

    def _load_credentials(self):
        """Load Firebase Service Account credentials from env JSON or local secret file."""
        try:
            raw_json = (os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON") or "").strip()
            if raw_json:
                info = json.loads(raw_json)
                creds = service_account.Credentials.from_service_account_info(
                    info, scopes=[FIRESTORE_SCOPE]
                )
            else:
                env_path = (
                    os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
                    or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
                    or os.path.join("production", "secrets", "firebase-service-account.json")
                ).strip()
                resolved_path = self._resolve_credential_path(env_path)
                if not resolved_path:
                    self._init_error = f"Service account file not found (checked '{env_path}')"
                    return
                creds = service_account.Credentials.from_service_account_file(
                    resolved_path, scopes=[FIRESTORE_SCOPE]
                )

            self._credentials = creds
            self._project_id = creds.project_id or os.getenv("FIREBASE_PROJECT_ID")
            self._init_error = None if self._project_id else "Missing project_id in service account"
        except Exception as exc:
            self._credentials = None
            self._init_error = f"Credential load failure: {exc}"

    def reload_credentials(self):
        """Re-read environment configuration and reload credentials."""
        with self._lock:
            self._load_credentials()

    @property
    def is_configured(self):
        return bool(self._credentials and self._project_id)

    def _base_url(self):
        if not self.is_configured:
            raise RuntimeError(self._init_error or "Firestore service account is not configured.")
        return f"https://firestore.googleapis.com/v1/projects/{self._project_id}/databases/(default)/documents"

    def _auth_headers(self):
        with self._lock:
            if not self._credentials.valid or not self._credentials.token:
                self._credentials.refresh(GoogleAuthRequest())
            token = self._credentials.token
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

    def _request(self, method, doc_path, params=None, json_body=None, timeout=8):
        url = f"{self._base_url()}/{doc_path.lstrip('/')}"
        res = self._session.request(
            method=method,
            url=url,
            headers=self._auth_headers(),
            params=params,
            json=json_body,
            timeout=timeout,
        )
        if res.status_code == 404:
            return None
        if not res.ok:
            raise RuntimeError(f"Firestore {method} {doc_path} failed (HTTP {res.status_code}): {res.text[:250]}")
        return res.json()

    def health_status(self):
        """Return safe configuration diagnostics without exposing key material."""
        return {
            "configured": self.is_configured,
            "vault_backend": "Cloud_Firestore" if self.is_configured else "Unconfigured",
            "project_id": self._project_id,
            "cache_entries": self._cache.size(),
            "error": self._init_error,
        }

    def get_organization_policy(self, tenant_id):
        """Read live organization security settings (always uncached for instant lockdown response)."""
        safe_tenant = _assert_safe_id(tenant_id, "tenant_id")
        doc_json = self._request("GET", f"organizations/{safe_tenant}")
        if not doc_json:
            return None

        org = decode_firestore_doc(doc_json)
        policy = org.get("security_policy") or {}
        eval_policy = evaluate_policy_threshold(policy)

        return {
            "tenant_id": safe_tenant,
            "company_name": org.get("company_name", "Organization Workspace"),
            "active_perimeter": bool(org.get("active_perimeter", True)),
            "emergency_lockdown": bool(org.get("emergency_lockdown", False)),
            "strictness_mode": eval_policy["strictness_mode"],
            "configured_threshold": eval_policy["base_threshold"],
            "effective_threshold": eval_policy["effective_threshold"],
            "auto_night_strict": eval_policy["auto_night_strict"],
            "night_strict_active": eval_policy["night_strict_active"],
            "total_employees": org.get("total_employees", 0),
        }

    def get_employee_record(self, tenant_id, employee_id):
        """Read employee status live and return version-verified cached biometric templates."""
        safe_tenant = _assert_safe_id(tenant_id, "tenant_id")
        safe_emp = _assert_safe_id(employee_id, "employee_id")

        doc_json = self._request("GET", f"organizations/{safe_tenant}/employees/{safe_emp}")
        if not doc_json:
            self._cache.invalidate(safe_tenant, safe_emp)
            return None

        emp = decode_firestore_doc(doc_json)
        version_stamp = emp.get("last_calibrated_at") or emp.get("enrolled_at") or "v1"

        cached_templates = self._cache.get(safe_tenant, safe_emp, version_stamp)
        if cached_templates is None:
            raw_templates = emp.get("master_templates") or {}
            # Normalize templates structure into clean dict of float lists
            parsed = {}
            if isinstance(raw_templates, dict):
                for key, vec in raw_templates.items():
                    if isinstance(vec, list) and vec:
                        parsed[key] = [float(x) for x in vec]
            elif isinstance(raw_templates, list):
                for idx, vec in enumerate(raw_templates):
                    if isinstance(vec, list) and vec:
                        parsed[f"t{idx + 1}"] = [float(x) for x in vec]

            if parsed:
                self._cache.put(safe_tenant, safe_emp, version_stamp, parsed)
            cached_templates = parsed

        return {
            "tenant_id": safe_tenant,
            "employee_id": safe_emp,
            "template_id": emp.get("template_id", safe_emp),
            "name": emp.get("name", "Enrolled Employee"),
            "status": str(emp.get("status", "ACTIVE")).upper(),
            "readings_count": emp.get("readings_count", 0),
            "last_calibrated_at": emp.get("last_calibrated_at"),
            "enrolled_at": emp.get("enrolled_at"),
            "master_templates": cached_templates,
        }

    def list_tenant_employees(self, tenant_id, page_size=100):
        """List all employees belonging exclusively to one company tenant."""
        safe_tenant = _assert_safe_id(tenant_id, "tenant_id")
        employees = []
        page_token = None

        while True:
            params = {"pageSize": page_size}
            if page_token:
                params["pageToken"] = page_token
            res = self._request("GET", f"organizations/{safe_tenant}/employees", params=params)
            if not res:
                break

            for doc_json in res.get("documents", []):
                decoded = decode_firestore_doc(doc_json)
                emp_id = decoded.get("template_id") or decoded.get("_doc_id")
                employees.append({
                    "employee_id": emp_id,
                    "name": decoded.get("name", "Enrolled Employee"),
                    "status": str(decoded.get("status", "ACTIVE")).upper(),
                    "readings_count": decoded.get("readings_count", 0),
                    "master_templates": decoded.get("master_templates") or {},
                })

            page_token = res.get("nextPageToken")
            if not page_token:
                break

        return employees

    def list_organizations(self, page_size=25):
        """List registered organization workspaces (metadata only) for diagnostics."""
        res = self._request("GET", "organizations", params={"pageSize": page_size})
        if not res:
            return []

        orgs = []
        for doc_json in res.get("documents", []):
            decoded = decode_firestore_doc(doc_json)
            orgs.append({
                "tenant_id": decoded.get("tenant_id") or decoded.get("_doc_id"),
                "company_name": decoded.get("company_name", "Organization"),
                "total_employees": decoded.get("total_employees", 0),
                "emergency_lockdown": bool(decoded.get("emergency_lockdown", False)),
            })
        return orgs

    def save_employee_templates(self, tenant_id, employee_id, name, master_templates, readings_count=None):
        """Persist or update an employee's biometric templates in Cloud Firestore and refresh cache."""
        safe_tenant = _assert_safe_id(tenant_id, "tenant_id")
        safe_emp = _assert_safe_id(employee_id, "employee_id")
        now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        payload = {
            "name": name or safe_emp,
            "template_id": safe_emp,
            "tenant_id": safe_tenant,
            "status": "ACTIVE",
            "master_templates": master_templates,
            "last_calibrated_at": now_iso,
        }
        if readings_count is not None:
            payload["readings_count"] = int(readings_count)

        mask_params = [("updateMask.fieldPaths", field) for field in payload.keys()]
        res = self._request(
            "PATCH",
            f"organizations/{safe_tenant}/employees/{safe_emp}",
            params=mask_params,
            json_body=encode_firestore_fields(payload),
        )
        self._cache.invalidate(safe_tenant, safe_emp)
        return res

    def invalidate_employee_cache(self, tenant_id, employee_id):
        """Evict cached templates for an employee immediately after recalibration."""
        if tenant_id and employee_id:
            self._cache.invalidate(tenant_id.strip(), employee_id.strip())

    def write_access_log(self, tenant_id, log_entry):
        """Write a door verification or security audit event into organizations/{tenant_id}/access_logs."""
        safe_tenant = _assert_safe_id(tenant_id, "tenant_id")
        now_utc = datetime.now(timezone.utc)

        ts_value = log_entry.get("timestamp")
        if not isinstance(ts_value, datetime):
            ts_value = now_utc

        payload = {
            "tenant_id": safe_tenant,
            "employee_id": str(log_entry.get("employee_id", "UNKNOWN")),
            "employee_name": str(log_entry.get("employee_name", "Unknown")),
            "status": str(log_entry.get("status", "DENIED")).upper(),
            "incident_status": str(log_entry.get("incident_status", "UNRESOLVED")).upper(),
            "confidence_score": str(log_entry.get("confidence_score", "0%")),
            "walk_energy": round(float(log_entry.get("walk_energy", 0.0)), 2),
            "reason": str(log_entry.get("reason", "Verification check")),
            "reason_code": str(log_entry.get("reason_code", "VERIFICATION")),
            "ai_diagnosis": str(log_entry.get("ai_diagnosis", "")),
            "gate_id": str(log_entry.get("gate_id", "GATE-01")),
            "timestamp": ts_value,
        }
        if log_entry.get("threshold") is not None:
            payload["threshold"] = float(log_entry["threshold"])
        if log_entry.get("strictness_mode"):
            payload["strictness_mode"] = str(log_entry["strictness_mode"])
        if "night_strict_active" in log_entry:
            payload["night_strict_active"] = bool(log_entry["night_strict_active"])
        if log_entry.get("is_simulation"):
            payload["is_simulation"] = True
        if log_entry.get("expires_at"):
            payload["expires_at"] = str(log_entry["expires_at"])

        return self._request(
            "POST",
            f"organizations/{safe_tenant}/access_logs",
            json_body=encode_firestore_fields(payload),
        )


_GLOBAL_FIRESTORE_SERVICE = None
_SERVICE_INIT_LOCK = threading.Lock()


def get_firestore_service():
    """Return the shared singleton EnterpriseFirestoreService instance."""
    global _GLOBAL_FIRESTORE_SERVICE
    with _SERVICE_INIT_LOCK:
        if _GLOBAL_FIRESTORE_SERVICE is None:
            _GLOBAL_FIRESTORE_SERVICE = EnterpriseFirestoreService()
    return _GLOBAL_FIRESTORE_SERVICE

