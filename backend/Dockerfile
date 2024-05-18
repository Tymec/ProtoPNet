FROM python:3.12-slim AS builder

# Set environment variables
ENV POETRY_VERSION="1.8.2"
ENV POETRY_HOME="/opt/poetry"
ENV POETRY_CACHE_DIR="/cache/poetry"
ENV POETRY_VIRTUALENVS_IN_PROJECT=true

# Create cache directory
RUN mkdir -p /cache/poetry

# Install dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends gcc

# Install Poetry
RUN pip install poetry==${POETRY_VERSION}

# Set the working directory
WORKDIR /build

# Copy the project files
ADD pyproject.toml poetry.lock ./

# Validate the project
RUN poetry check

# Install project dependencies
RUN --mount=type=cache,target=/cache/poetry poetry install --only main --no-root

# Second stage
FROM python:3.12-slim as runner

# Set correct locale
ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8
# This prevents Python from writing out pyc files
ENV PYTHONDONTWRITEBYTECODE 1
# This prevents Python from buffering stdout and stderr
ENV PYTHONUNBUFFERED 1
# Enable Python tracebacks on segfaults
ENV PYTHONFAULTHANDLER 1

# Copy virtual environment
COPY --from=builder /build/.venv /app/.venv

# Copy project files
COPY . /app

# Set working directory
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 appuser
RUN adduser --system --uid 1001 appuser
USER appuser

# Finalize
EXPOSE 5000
ENTRYPOINT ["./.venv/bin/python", "-m", "uvicorn"]
CMD ["app.main:app", "--proxy-headers", "--host", "0.0.0.0", "--port", "5000"]
