#!/usr/bin/make -f

default: dev

install:
	pipenv install --dev

dev:
	pipenv run uvicorn app.main:app --reload --port 5000

prod:
	pipenv run uvicorn app.main:app --host 0.0.0.0 --port 5000

test:
	pipenv run pytest

coverage:
	pipenv run pytest --cov=. --cov-report term --cov-report xml:coverage.xml

audit:
	pipenv check --audit-and-monitor --save-json audit.json

requirements:
	pipenv requirements > requirements-cpu.txt
	pipenv requirements --dev-only > requirements-dev.txt

black:
	pipenv run black .

isort:
	pipenv run isort .

flake8:
	pipenv run flake8 app/ net/ tests/

lint: isort black flake8

clean:
	rm -rf .pytest_cache
	rm -rf .mypy_cache
	rm -rf .coverage
	rm -rf coverage.xml
	rm -rf audit.json

.PHONY: default install dev prod test coverage audit requirements black isort flake8 lint clean

.EXPORT_ALL_VARIABLES:
PIPENV_VERBOSITY = -1
