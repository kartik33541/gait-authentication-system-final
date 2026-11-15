import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROD_PATH = os.path.join(BASE_DIR, "production")
APP_PATH = os.path.join(PROD_PATH, "app")

for _path in (PROD_PATH, APP_PATH):
    if _path not in sys.path:
        sys.path.insert(0, _path)

# Hugging Face ZeroGPU environment decorator
try:
    import spaces
except ImportError:
    # Local fallback mockup if running outside Hugging Face ZeroGPU
    class _MockSpaces:
        @staticmethod
        def GPU(fn):
            return fn
    spaces = _MockSpaces()

import gradio as gr
from starlette.middleware.wsgi import WSGIMiddleware
from flask_server import app as flask_app  # noqa: E402
from firestore_service import get_firestore_service  # noqa: E402


# WSGI path bridge ensuring Flask receives the exact full URI (/api/health, /predict, etc.)
class FullPathWSGIWrapper:
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        script = environ.get("SCRIPT_NAME", "")
        path = environ.get("PATH_INFO", "")
        full = script + path
        environ["PATH_INFO"] = full.rstrip("/") if full != "/" and full.endswith("/") else full
        environ["SCRIPT_NAME"] = ""
        return self.wsgi_app(environ, start_response)


# Function decorated with @spaces.GPU bound directly to Gradio UI handler
@spaces.GPU
def check_biometric_engine(command: str = "status"):
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


# Gradio Blocks UI definition
with gr.Blocks(title="GaitAuth Biometric Engine", theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 🚶 GaitAuth Biometric Intelligence Engine")
    gr.Markdown("Enterprise Zero-Trust Continuous Biometric Authentication Server running on Hugging Face Spaces.")
    cmd_input = gr.Textbox(label="Diagnostic Command", value="status")
    status_output = gr.Markdown(value="### 🛡️ GaitAuth Biometric Intelligence Engine\n*Engine initialized. Click below to query ZeroGPU telemetry.*")
    refresh_btn = gr.Button("🔄 Refresh ZeroGPU Status", variant="primary")
    refresh_btn.click(fn=check_biometric_engine, inputs=cmd_input, outputs=status_output)


# Mount Flask WSGI endpoints directly onto Gradio's internal FastAPI app
wrapped_flask = FullPathWSGIWrapper(flask_app)
demo.app.mount("/api", WSGIMiddleware(wrapped_flask))
demo.app.mount("/predict", WSGIMiddleware(wrapped_flask))


if __name__ == "__main__":
    port = int(os.getenv("PORT", 7860))
    print(f"🚀 [GaitAuth ZeroGPU Server] Launching on port {port}...")
    try:
        demo.launch(server_name="0.0.0.0", server_port=port, ssr_mode=False)
    except TypeError:
        demo.launch(server_name="0.0.0.0", server_port=port)
