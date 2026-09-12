FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends iverilog \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend /app/backend
COPY rtl /app/rtl
COPY verification /app/verification

ENV HOST=0.0.0.0
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV QUANTUMRISC_REPO_ROOT=/app
ENV IVERILOG_PATH=iverilog
ENV VVP_PATH=vvp
ENV CORS_ORIGINS=https://quantum-risc.vercel.app
ENV SQLITE_DB_PATH=runs/sessions.db

EXPOSE 8000

CMD ["sh", "-c", "cd /app/backend && python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
