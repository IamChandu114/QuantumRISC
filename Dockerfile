FROM python:3.11-slim

# Install system dependencies including Icarus Verilog
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    iverilog \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy project
COPY backend /app/backend
COPY rtl /app/rtl
COPY verification /app/verification

# Environment variables
ENV HOST=0.0.0.0
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV QUANTUMRISC_REPO_ROOT=/app
ENV IVERILOG_PATH=iverilog
ENV VVP_PATH=vvp
ENV CORS_ORIGINS=https://quantum-risc.vercel.app
ENV SQLITE_DB_PATH=runs/sessions.db

# Render provides PORT at runtime; 8000 remains the local default.
EXPOSE 8000

# Start server
CMD ["sh", "-c", "cd /app/backend && python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
