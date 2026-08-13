FROM python:3.11-slim

# Install system dependencies including Icarus Verilog
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    iverilog \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app/backend

# Install Python requirements
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app

# Environment variables
ENV HOST=0.0.0.0
ENV CORS_ORIGINS=*
ENV SQLITE_DB_PATH=runs/sessions.db
ENV QUANTUMRISC_IVERILOG=iverilog
ENV QUANTUMRISC_VVP=vvp

# Railway will provide PORT automatically
EXPOSE 8080

# Start server
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]   
