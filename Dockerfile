FROM python:3.11-slim

# Install system dependencies, including Icarus Verilog compiler and runtime
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    iverilog \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy repository source code
COPY . .

# Set default env variables (can be overridden at runtime)
ENV HOST=0.0.0.0
ENV PORT=8000
ENV CORS_ORIGINS=*
ENV SQLITE_DB_PATH=runs/sessions.db
ENV QUANTUMRISC_IVERILOG=iverilog
ENV QUANTUMRISC_VVP=vvp

EXPOSE 8000

# Run uvicorn server
CMD ["python", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
