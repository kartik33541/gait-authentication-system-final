FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TF_CPP_MIN_LOG_LEVEL=3 \
    PORT=7860

WORKDIR /app

# Install runtime Python dependencies first for better layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy only the production server, LSTM engine, and fitted scaler.
COPY wsgi.py app.py ./
COPY production/app ./production/app
COPY production/LSTM_engine ./production/LSTM_engine
COPY production/scaler.pkl ./production/scaler.pkl

# Run under a non-privileged user (Hugging Face default UID 1000)
RUN useradd -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen(f'http://127.0.0.1:{os.getenv(\"PORT\", \"7860\")}/api/health', timeout=4).read()" || exit 1

CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-7860} --workers 1 --threads 4 --timeout 120 wsgi:app"]

