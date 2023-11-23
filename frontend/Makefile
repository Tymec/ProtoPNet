#!/usr/bin/make -f

default: dev

install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build
	pnpm preview

preview:
	pnpm build
	pnpm preview

test:
	pnpm test

eslint:
	pnpm lint

format:
	pnpm format

lint: eslint format

clean:
	rm -rf dist/	

.PHONY: default install dev preview build test eslint format lint
