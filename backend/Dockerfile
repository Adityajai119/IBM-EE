# Multi-stage Docker build for production optimization
FROM python:3.11-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    nodejs \
    npm \
    openjdk-17-jdk \
    rustc \
    php \
    ruby \
    golang-go \
    && rm -rf /var/lib/apt/lists/*

# Install TypeScript compiler
RUN npm install -g typescript ts-node

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install Python dependencies
COPY requirements.txt requirements-test.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim as production

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    ENVIRONMENT=production

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    nodejs \
    npm \
    openjdk-17-jdk \
    rustc \
    php \
    ruby \
    golang-go \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g typescript ts-node

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv

# Create non-root user for security
RUN groupadd -r devsensei && useradd -r -g devsensei devsensei

# Create application directory
WORKDIR /app

# Create necessary directories
RUN mkdir -p logs uploads static vector_db && \
    chown -R devsensei:devsensei /app

# Copy application code
COPY --chown=devsensei:devsensei . .

# Switch to non-root user
USER devsensei

# Create volume mounts for persistent data
VOLUME ["/app/logs", "/app/vector_db", "/app/uploads"]

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/monitoring/health || exit 1

# Default command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]

# Development stage (for docker-compose.dev.yml)
FROM production as development

ENV ENVIRONMENT=development

# Install development dependencies
USER root
RUN pip install --no-cache-dir pytest pytest-asyncio pytest-cov black flake8 mypy

USER devsensei

# Override command for development (with reload)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
