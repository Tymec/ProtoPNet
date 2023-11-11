#!/usr/bin/make -f

default: dev

install:
	pipenv sync --dev

dev:
	pipenv run uvicorn app.main:app --reload --port 5000

prod:
	pipenv run uvicorn app.main:app --host 0.0.0.0 --port 5000

test:
	pipenv run pytest

coverage:
	pipenv run pytest --cov=. --cov-report term --cov-report xml:docs/coverage.xml

audit:
	pipenv check --audit-and-monitor --save-json docs/audit.json

requirements:
	pipenv requirements > requirements.txt
	pipenv requirements --dev-only > requirements-dev.txt

black:
	pipenv run black app/
	pipenv run black net/
	pipenv run black tests/

isort:
	pipenv run isort app/ net/ tests/

flake8:
	pipenv run flake8 app/ net/ tests/

lint: isort black flake8

clean:
	rm -rf .pytest_cache
	rm -rf .mypy_cache
	rm -rf .coverage
	rm -rf docs/coverage.xml
	rm -rf docs/audit.json

docker-build:
	docker build -t backend:latest .

docker-run:
	docker run --rm -p 5000:5000 backend:latest

docker-clean:
	docker rmi backend:latest

.PHONY: default install dev prod test coverage audit requirements black isort flake8 lint clean docker-build docker-run docker-clean

.EXPORT_ALL_VARIABLES:
PIPENV_VERBOSITY = -1
