import os
import sys
import threading
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROD_PATH = os.path.join(BASE_DIR, "production")
APP_PATH = os.path.join(PROD_PATH, "app")

# Ensure production paths are in sys.path
for _path in (PROD_PATH, APP_PATH):
    if _path not in sys.path:
        sys.path.insert(0, _path)

from flask_server import app as flask_app  # noqa: E402
from firestore_service import get_firestore_service  # noqa: E402


def run_flask():
    """Run Flask REST API server."""
    port = int(os.getenv("PORT", 7860))
    print(f"🚀 [Flask REST API] Running on port {port}...")
    flask_app.run(host="0.0.0.0", port=port, threaded=True)


# If running in a Gradio Space on Hugging Face
try:
    import gradio as gr

    # Start Flask API daemon in background
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    time.sleep(1)

    def get_system_status():
        fs = get_firestore_service()
        health = fs.health_status()
        return f"""
### 🛡️ GaitAuth Biometric Intelligence Engine
- **REST API Status:** ONLINE (Port 7860)
- **Model:** Siamese LSTM (256-D Embedding Space)
- **Vault Backend:** {health.get('vault_backend', 'Cloud_Firestore')}
- **Firestore Connected:** {'✅ Yes' if health.get('configured') else '❌ No'}
- **Project ID:** {health.get('project_id', 'vocalnav')}
- **Active Endpoints:**
  - `POST /predict` (Biometric verification & 1:1 matching)
  - `POST /api/enroll` (Biometric enrollment & feature extraction)
  - `POST /api/send-invite` (Automated employee passkey email dispatch)
  - `GET /api/health` (Cloud health & latency diagnostics)
"""

    with gr.Blocks(title="GaitAuth Biometric Engine", theme=gr.themes.Soft()) as demo:
        gr.Markdown("# 🚶 GaitAuth Biometric Backend")
        gr.Markdown("Zero-Trust Continuous Biometric Authentication Server")
        status_box = gr.Markdown(value=get_system_status())
        refresh_btn = gr.Button("🔄 Refresh Server Health")
        refresh_btn.click(fn=get_system_status, outputs=status_box)

    app = demo

except ImportError:
    # Direct Flask fallback if Gradio is not installed
    app = flask_app


if __name__ == "__main__":
    if "demo" in locals():
        demo.launch(server_name="0.0.0.0", server_port=int(os.getenv("PORT", 7860)))
    else:
        port = int(os.getenv("PORT", 7860))
        flask_app.run(host="0.0.0.0", port=port, threaded=True)