#!/usr/bin/make -f

default: dev

install:
	pipenv install --dev

dev:
	ENV=development pipenv run python -m app

prod:
	ENV=production pipenv run python -m app

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
	pipenv run black tests/

isort:
	pipenv run isort app/ tests/

flake8:
	pipenv run flake8 app/ tests/

lint: isort black flake8

clean:
	rm -rf .pytest_cache
	rm -rf .mypy_cache
	rm -rf .coverage
	rm -rf docs/coverage.xml
	rm -rf docs/audit.json

.PHONY: default install dev prod test coverage audit requirements black isort flake8 lint clean

.EXPORT_ALL_VARIABLES:
PIPENV_VERBOSITY = -1
