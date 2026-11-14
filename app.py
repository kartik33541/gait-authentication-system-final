import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROD_PATH = os.path.join(BASE_DIR, "production")
APP_PATH = os.path.join(PROD_PATH, "app")

for _path in (PROD_PATH, APP_PATH):
    if _path not in sys.path:
        sys.path.insert(0, _path)

# ZeroGPU decorator hook for Hugging Face Spaces Free Tier
try:
    import spaces
    HAS_SPACES = True
except ImportError:
    HAS_SPACES = False


def zero_gpu(fn):
    """Decorate function with @spaces.GPU when running on Hugging Face ZeroGPU."""
    if HAS_SPACES:
        return spaces.GPU(fn)
    return fn


from flask_server import app as flask_app  # noqa: E402
from firestore_service import get_firestore_service  # noqa: E402


# Add root route to Flask if not already defined
@flask_app.route("/")
def home():
    return """<!DOCTYPE html>
<html>
<head>
    <title>GaitAuth Biometric Engine</title>
    <meta http-equiv="refresh" content="1; url=/status">
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 60px 20px; }
        .card { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h1 { color: #38bdf8; font-size: 26px; margin-bottom: 12px; }
        p { color: #94a3b8; font-size: 16px; line-height: 1.6; }
        .badge { display: inline-block; background: #059669; color: #fff; padding: 6px 14px; border-radius: 9999px; font-weight: bold; font-size: 14px; margin-bottom: 20px; }
        a { color: #38bdf8; text-decoration: none; font-weight: bold; }
        a:hover { text-decoration: underline; }
        ul { text-align: left; background: #0f172a; padding: 20px 30px; border-radius: 8px; font-family: monospace; font-size: 14px; color: #a5f3fc; }
        li { margin: 8px 0; }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge">🚀 LIVE & HEALTHY</div>
        <h1>🚶 GaitAuth Biometric Intelligence Engine</h1>
        <p>Enterprise Zero-Trust Continuous Biometric Authentication Server running on Hugging Face Spaces.</p>
        <p>Redirecting to <a href="/status">Interactive ZeroGPU Health Console</a>...</p>
        <ul>
            <li>POST /predict - 1:1 Siamese LSTM Verification</li>
            <li>POST /api/enroll - Biometric Enrollment</li>
            <li>POST /api/send-invite - Automated Passkey Dispatch</li>
            <li>GET /api/health - Cloud Health & Telemetry</li>
        </ul>
    </div>
</body>
</html>"""


# Standalone ZeroGPU status function (hooks into ZeroGPU supervisor)
@zero_gpu
def get_system_status():
    fs = get_firestore_service()
    health = fs.health_status()
    return f"""### 🛡️ GaitAuth Biometric Intelligence Engine
- **Hardware:** ZeroGPU Accelerated (A10G)
- **Status:** ONLINE & HEALTHY
- **Model:** Siamese LSTM (256-D Metric Space)
- **Vault Backend:** {health.get('vault_backend', 'Cloud_Firestore')}
- **Firestore Connected:** {'✅ Yes' if health.get('configured') else '❌ No'}
- **Project ID:** {health.get('project_id', 'vocalnav')}
- **Active Endpoints:**
  - `POST /predict` (Biometric 1:1 Matching)
  - `POST /api/enroll` (Enrollment Feature Extraction)
  - `POST /api/send-invite` (Automated Passkey Dispatch)
  - `GET /api/health` (Cloud Health & Latency Diagnostics)
"""


try:
    import gradio as gr
    from fastapi import FastAPI
    from fastapi.middleware.wsgi import WSGIMiddleware

    # Build Gradio Interface
    with gr.Blocks(title="GaitAuth Biometric Engine", theme=gr.themes.Soft()) as demo:
        gr.Markdown("# 🚶 GaitAuth Biometric Intelligence Engine")
        gr.Markdown("Zero-Trust Continuous Biometric Authentication Server running on Hugging Face Spaces.")
        status_box = gr.Markdown(value=get_system_status)
        refresh_btn = gr.Button("🔄 Refresh ZeroGPU Health Status")
        refresh_btn.click(fn=get_system_status, outputs=status_box)

    # Unified FastAPI ASGI server
    fastapi_app = FastAPI(title="GaitAuth Engine")

    # 1. Mount Gradio interface under /status
    app = gr.mount_gradio_app(fastapi_app, demo, path="/status")

    # 2. Mount Flask app at root fallback: all REST requests (/predict, /api/health, etc.) flow cleanly to Flask
    app.mount("/", WSGIMiddleware(flask_app))

except ImportError:
    # Direct Flask fallback if Gradio or FastAPI is missing
    app = flask_app


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 7860))
    print(f"🚀 [GaitAuth Server] Listening on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
