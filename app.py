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
from flask_server import app as flask_app  # noqa: E402
from firestore_service import get_firestore_service  # noqa: E402


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


if __name__ == "__main__":
    from starlette.requests import Request
    from starlette.responses import Response

    port = int(os.getenv("PORT", 7860))
    print(f"🚀 [GaitAuth ZeroGPU Server] Launching on port {port}...")
    server_app, _, _ = demo.launch(server_name="0.0.0.0", server_port=port, prevent_thread_lock=True)

    flask_client = flask_app.test_client()

    @server_app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], include_in_schema=False)
    @server_app.api_route("/predict", methods=["GET", "POST", "OPTIONS"], include_in_schema=False)
    @server_app.api_route("/predict/", methods=["GET", "POST", "OPTIONS"], include_in_schema=False)
    async def forward_to_flask(request: Request):
        if request.method == "OPTIONS":
            return Response(status_code=200, headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*"
            })
        body = await request.body()
        url_path = request.url.path.rstrip("/") or "/"
        query_string = request.url.query
        headers = {k: v for k, v in request.headers.items() if k.lower() not in ("host", "content-length")}
        
        resp = flask_client.open(
            url_path,
            method=request.method,
            headers=headers,
            data=body,
            query_string=query_string
        )
        res_headers = dict(resp.headers)
        res_headers["Access-Control-Allow-Origin"] = "*"
        res_headers["Access-Control-Allow-Headers"] = "*"
        return Response(
            content=resp.get_data(),
            status_code=resp.status_code,
            headers=res_headers
        )

    print("✅ [GaitAuth ZeroGPU Server] Direct REST API Bridge mounted.")
    demo.block_thread()
