#!/usr/bin/make -f

default: dev

install:
	poetry self add poetry-plugin-dotenv poetry-plugin-export
	poetry config warnings.export false
	poetry install

dev:
	poetry run uvicorn app.main:app --reload --port 5000

prod:
	poetry run uvicorn app.main:app --host 0.0.0.0 --port 5000

test:
	poetry run pytest

coverage:
	poetry run pytest --cov=. --cov-report term --cov-report xml:coverage.xml

requirements:
	poetry export -f requirements.txt --output requirements-cpu.txt --without dev
	poetry export -f requirements.txt --output requirements-dev.txt --only dev

lint:
	poetry run ruff check .
	poetry run ruff format .

clean:
	rm -rf .ruff_cache
	rm -rf .pytest_cache
	rm -rf .mypy_cache
	rm -rf .coverage
	rm -rf coverage.xml

.PHONY: default install dev prod test coverage requirements lint clean

.EXPORT_ALL_VARIABLES:
POETRY_VIRTUALENVS_IN_PROJECT = true
