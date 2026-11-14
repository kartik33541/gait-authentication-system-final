import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROD_DIR = os.path.join(BASE_DIR, "production")
APP_DIR = os.path.join(PROD_DIR, "app")

for _path in (APP_DIR, PROD_DIR):
    if _path not in sys.path:
        sys.path.insert(0, _path)

from app.flask_server import app  # noqa: E402,F401


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    app.run(host="0.0.0.0", port=port, threaded=True)

