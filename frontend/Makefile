#!/usr/bin/make -f

default: dev

install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

test:
	pnpm test

eslint:
	pnpm lint

format:
	pnpm format

lint: eslint format

clean:
	rm -rf dist/	

.PHONY: default install dev build test eslint format lint
