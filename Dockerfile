FROM python:3.11-slim

# Install system dependencies including Icarus Verilog
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    iverilog \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory to backend so `app` is importable as a top-level package
WORKDIR /app/backend

# Install Python requirements
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the full repo so RTL and verification sources are available at runtime
COPY . /app

# Set default env variables (overridden at runtime by Railway / Docker)
ENV HOST=0.0.0.0
ENV PORT=8000
ENV CORS_ORIGINS=*
ENV SQLITE_DB_PATH=runs/sessions.db
ENV QUANTUMRISC_IVERILOG=iverilog
ENV QUANTUMRISC_VVP=vvp

EXPOSE 8000

# Run uvicorn with the app package from the backend directory
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
