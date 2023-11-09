FROM python:3.11-slim as builder

# Setup environment
ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONFAULTHANDLER 1

# Tell pipenv to create venv in the current directory
ENV PIPENV_VENV_IN_PROJECT=1

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends gcc

# Install pipenv
RUN pip install pipenv

# Copy Pipfile and Pipfile.lock
RUN mkdir -v -p /build
ADD Pipfile Pipfile.lock /build

# Set working directory
WORKDIR /build

# Install packages specified in Pipfile.lock
RUN pipenv sync --dev

FROM python:3.11-slim as runner

# Set correct locale
ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8

# This prevents Python from writing out pyc files
ENV PYTHONDONTWRITEBYTECODE 1

# This prevents Python from buffering stdout and stderr
ENV PYTHONUNBUFFERED 1

# Enable Python tracebacks on segfaults
ENV PYTHONFAULTHANDLER 1

# Copy venv from builder
RUN mkdir -v -p /app
COPY --from=builder /build/.venv/ /app/.venv

# Set working directory
WORKDIR /app

# Copy source code
COPY . /app

# Create user
RUN useradd --system --no-create-home appuser

# Finalize
EXPOSE 5000
USER appuser
ENTRYPOINT ["./.venv/bin/python", "-m", "uvicorn"]
CMD ["app.main:app", "--host", "0.0.0.0", "--port", "5000"]
