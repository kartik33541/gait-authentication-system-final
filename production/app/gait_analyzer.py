import os
import threading
import requests

DEFAULT_AZURE_ENDPOINT = "https://danie-mmwa1qhz-polandcentral.openai.azure.com"
DEFAULT_AZURE_API_VERSION = "2025-03-01-preview"
DEFAULT_AZURE_DEPLOYMENT = "gpt-5.4-nano"

# Global key rotation lock and index for Gemini
_gemini_lock = threading.Lock()
_gemini_key_index = 0

FALLBACK_REASON_MESSAGES = {
    "GRANTED": "Access granted. Your walking pattern matches the registered profile.",
    "STATIC_DEVICE": "Access denied. Insufficient physical walking movement was detected (stationary or manually shaken phone).",
    "INVALID_DURATION": "Access denied. The walk recording duration fell outside the required verification window.",
    "REPLAY_ATTACK": "Access denied. The walking sample expired and failed freshness verification.",
    "DATA_TOO_SHORT": "Access denied. The walk recording did not capture enough continuous steps to verify identity.",
    "ACCESS_PAUSED": "Access denied. Your door passkey has been temporarily paused by an administrator.",
    "EMERGENCY_LOCKDOWN": "Access denied. The facility perimeter is currently under emergency lockdown.",
    "PERIMETER_INACTIVE": "Access denied. This organization's biometric security perimeter is currently inactive.",
    "GAIT_MISMATCH": "Access denied. The walking rhythm did not meet the required match confidence for this profile.",
    "MISSING_IDENTITY_CLAIM": "Access denied. Both company passkey (tenant_id) and employee template ID (template_id) are required for 1:1 verification.",
    "TENANT_NOT_FOUND": "Access denied. The specified company organization (tenant_id) was not found.",
    "EMPLOYEE_NOT_FOUND": "Access denied. No enrolled biometric profile matched that template ID within this company.",
    "INVALID_TEMPLATES": "Access denied. The stored biometric profile is missing or corrupted and requires re-enrollment with live walk captures.",
    "INVALID_CSV_FORMAT": "Access denied. The uploaded payload could not be parsed as valid CSV sensor data.",
    "INVALID_CSV_SCHEMA": "Access denied. Walking data must contain clean numeric columns: timestamp, ax, ay, az, wx, wy, wz.",
    "VAULT_UNAVAILABLE": "Verification unavailable. Cloud Firestore identity storage is currently unconfigured or unreachable.",
}


def get_gemini_api_keys():
    """Retrieve all configured Google Gemini API keys from environment variables."""
    keys = []
    primary = (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("VITE_GEMINI_API_KEY")
        or ""
    ).strip()
    backup = (
        os.getenv("GEMINI_API_KEY_BACKUP")
        or os.getenv("GEMINI_API_KEY_2")
        or os.getenv("VITE_GEMINI_API_KEY_BACKUP")
        or os.getenv("VITE_GEMINI_API_KEY_2")
        or ""
    ).strip()
    combined = (
        os.getenv("GEMINI_API_KEYS")
        or os.getenv("VITE_GEMINI_API_KEYS")
        or ""
    ).strip()

    if combined:
        for k in combined.split(","):
            clean = k.strip()
            if clean and clean not in keys:
                keys.append(clean)
    if primary and primary not in keys:
        keys.append(primary)
    if backup and backup not in keys:
        keys.append(backup)

    return keys


def toggle_next_gemini_key():
    """Advance the global Gemini key index to the backup key."""
    global _gemini_key_index
    with _gemini_lock:
        keys = get_gemini_api_keys()
        if len(keys) > 1:
            _gemini_key_index = (_gemini_key_index + 1) % len(keys)
            print(f"🔄 [Backend AI Audit] Toggled to Gemini key index #{_gemini_key_index + 1} of {len(keys)}")
        return _gemini_key_index


def get_ai_provider_info():
    """Return descriptive status of the active AI audit engine."""
    gemini_keys = get_gemini_api_keys()
    if gemini_keys:
        pool_type = f"Dual-Key Pool Active ({len(gemini_keys)} keys)" if len(gemini_keys) > 1 else "Single-Key Active"
        return f"Google_Gemini_2.5_Flash ({pool_type})"
    
    azure_cfg = get_azure_openai_config()
    if azure_cfg["is_configured"]:
        return f"Azure_OpenAI_{azure_cfg['deployment']}"
    
    return "Deterministic_Fallback"


def get_azure_openai_config(override_api_key=None):
    """Resolve Azure OpenAI credentials from environment variables matching Kenny AI."""
    api_key = (
        override_api_key
        or os.getenv("AZURE_OPENAI_API_KEY")
        or os.getenv("VITE_AZURE_OPENAI_API_KEY")
        or ""
    ).strip()
    endpoint = (
        os.getenv("AZURE_OPENAI_ENDPOINT")
        or os.getenv("VITE_AZURE_OPENAI_ENDPOINT")
        or DEFAULT_AZURE_ENDPOINT
    ).strip()
    api_version = (
        os.getenv("AZURE_OPENAI_API_VERSION")
        or os.getenv("VITE_AZURE_OPENAI_API_VERSION")
        or DEFAULT_AZURE_API_VERSION
    ).strip()
    deployment = (
        os.getenv("AZURE_OPENAI_DEPLOYMENT")
        or os.getenv("VITE_AZURE_OPENAI_DEPLOYMENT")
        or DEFAULT_AZURE_DEPLOYMENT
    ).strip()

    return {
        "api_key": api_key,
        "endpoint": endpoint,
        "api_version": api_version,
        "deployment": deployment,
        "is_configured": bool(api_key and endpoint),
    }


def build_fallback_explanation(score, threshold, reason_code=None):
    """Return a clear deterministic explanation when the LLM client is unavailable."""
    if reason_code and reason_code in FALLBACK_REASON_MESSAGES:
        return FALLBACK_REASON_MESSAGES[reason_code]
    if score >= threshold:
        return FALLBACK_REASON_MESSAGES["GRANTED"]
    return FALLBACK_REASON_MESSAGES["GAIT_MISMATCH"]


def _call_gemini_api(prompt):
    """Execute diagnostic prompt against Google Gemini with automatic dual-key rotation."""
    keys = get_gemini_api_keys()
    if not keys:
        return None

    global _gemini_key_index
    models_to_try = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    
    for _ in range(len(keys)):
        with _gemini_lock:
            current_key = keys[_gemini_key_index % len(keys)]
            key_num = (_gemini_key_index % len(keys)) + 1

        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={current_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "systemInstruction": {
                    "parts": [
                        {
                            "text": "You are the security diagnostics assistant for GaitAuth. Explain access decisions clearly in 2 concise sentences without developer jargon."
                        }
                    ]
                },
                "generationConfig": {
                    "temperature": 0.4,
                    "maxOutputTokens": 300,
                },
            }

            try:
                res = requests.post(url, headers=headers, json=payload, timeout=8)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                        if text:
                            return text
                else:
                    print(f"⚠️ [Backend AI Audit] Gemini {model} on key #{key_num} returned HTTP {res.status_code}")
            except Exception as err:
                print(f"⚠️ [Backend AI Audit] Gemini error on key #{key_num}: {err}")

        # If all models failed on this key, rotate to backup key
        toggle_next_gemini_key()

    return None


def _call_azure_openai_api(prompt, api_key=None):
    """Execute diagnostic prompt against Azure OpenAI as secondary fallback."""
    cfg = get_azure_openai_config(override_api_key=api_key)
    if not cfg["is_configured"]:
        return None

    clean_endpoint = cfg["endpoint"].rstrip("/")
    if "/openai/v1" in clean_endpoint:
        url = f"{clean_endpoint}/chat/completions?api-version={cfg['api_version']}"
    else:
        url = (
            f"{clean_endpoint}/openai/deployments/{cfg['deployment']}"
            f"/chat/completions?api-version={cfg['api_version']}"
        )

    headers = {
        "Content-Type": "application/json",
        "api-key": cfg["api_key"],
        "Authorization": f"Bearer {cfg['api_key']}",
    }

    payload = {
        "model": cfg["deployment"],
        "messages": [
            {
                "role": "system",
                "content": "You are the security diagnostics assistant for GaitAuth. Explain access decisions clearly in 2 concise sentences without developer jargon.",
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.4,
        "max_completion_tokens": 300,
    }

    try:
        res = requests.post(url, headers=headers, json=payload, timeout=8)
        res.raise_for_status()
        data = res.json()
        return (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )
    except Exception as err:
        print(f"⚠️ [Backend AI Audit] Azure OpenAI failed: {err}")
        return None


def diagnose_gait_pattern(
    api_key=None,
    energy=0.0,
    variance=0.0,
    score=0.0,
    threshold=0.75,
    confidence_distribution="N/A",
    reason_code=None,
    employee_name=None,
):
    """Generate a concise, jargon-free explanation of a gait check via Gemini (Dual-Key) or Azure OpenAI."""
    if isinstance(confidence_distribution, list):
        confidence_distribution = ", ".join(f"{v:.3f}" for v in confidence_distribution)

    outcome = "GRANTED" if (reason_code == "GRANTED" or (reason_code is None and score >= threshold)) else "DENIED"
    subject_line = f"Employee: {employee_name}" if employee_name else "Employee: Verification Check"
    reason_line = f"System Flag: {reason_code}" if reason_code else f"System Flag: {outcome}"

    prompt = f"""Analyze this contactless walking access event and write a clear, helpful 2-sentence explanation for a facility manager and employee.

{subject_line}
Outcome: {outcome}
{reason_line}
Match Confidence: {score:.4f} (Required Threshold: {threshold})
Walking Intensity (Energy): {energy:.4f} (< 1.0 = stationary/shaken; 1.5 - 2.8 = natural walk; > 3.0 = rushing/running)
Stride Consistency (Variance): {variance:.6f} (< 0.002 = very steady; 0.002 - 0.008 = normal; > 0.008 = irregular steps)
Segment Scores: {confidence_distribution}

Rules:
- Use plain, everyday English (zero technical jargon like LSTM, embeddings, vectors, tensors, variance numbers, or covariance).
- If GRANTED, confirm that the natural walking rhythm matched smoothly.
- If DENIED, clearly explain the likely physical reason (e.g., stationary device, rushed/irregular stride, or mismatch against registered walk profile)."""

    # 1. Primary: Google Gemini Dual-Key Auto-Rotation Pool
    text = _call_gemini_api(prompt)
    if text:
        return text

    # 2. Secondary: Azure OpenAI (if configured)
    use_azure = (os.getenv("USE_AZURE_OPENAI") or os.getenv("VITE_USE_AZURE_OPENAI") or "").lower() == "true"
    if use_azure:
        text = _call_azure_openai_api(prompt, api_key=api_key)
        if text:
            return text

    # 3. Fallback: Deterministic Security Messages
    return build_fallback_explanation(score, threshold, reason_code)
