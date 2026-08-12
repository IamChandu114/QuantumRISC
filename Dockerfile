FROM python:3.11-slim

# Install system dependencies, including Icarus Verilog compiler and runtime
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    iverilog \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

<<<<<<< HEAD
WORKDIR /app

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy repository source code
COPY . .
=======
# Set working directory to backend so imports use package root 'app'
WORKDIR /app/backend

# Install Python requirements
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code into the image
COPY backend .
>>>>>>> 21caa7f8a36c1701825d02a8f0fcb2560459c4b2

# Set default env variables (can be overridden at runtime)
ENV HOST=0.0.0.0
ENV PORT=8000
ENV CORS_ORIGINS=*
ENV SQLITE_DB_PATH=runs/sessions.db
ENV QUANTUMRISC_IVERILOG=iverilog
ENV QUANTUMRISC_VVP=vvp

EXPOSE 8000

<<<<<<< HEAD
# Run uvicorn server
CMD ["python", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
=======
# Run uvicorn server using app.main when backend is the working directory.
# Use shell form (sh -c) so $PORT environment variable is expanded at runtime.
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
>>>>>>> 21caa7f8a36c1701825d02a8f0fcb2560459c4b2
