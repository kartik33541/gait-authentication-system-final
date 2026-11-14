import os
import requests

DEFAULT_AZURE_ENDPOINT = "https://danie-mmwa1qhz-polandcentral.openai.azure.com"
DEFAULT_AZURE_API_VERSION = "2025-03-01-preview"
DEFAULT_AZURE_DEPLOYMENT = "gpt-5.4-nano"

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
    """Generate a concise, jargon-free explanation of a gait check via Azure OpenAI (gpt-5.4-nano)."""
    cfg = get_azure_openai_config(override_api_key=api_key)
    if not cfg["is_configured"]:
        return build_fallback_explanation(score, threshold, reason_code)

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
        res = requests.post(url, headers=headers, json=payload, timeout=10)
        res.raise_for_status()
        data = res.json()
        text = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )
        return text or build_fallback_explanation(score, threshold, reason_code)
    except Exception:
        return build_fallback_explanation(score, threshold, reason_code)
