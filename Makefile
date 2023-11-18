#!/usr/bin/make -f

backend:
	$(MAKE) -C backend $(filter-out $@,$(MAKECMDGOALS))

frontend:
	$(MAKE) -C frontend $(filter-out $@,$(MAKECMDGOALS))

install:
	$(MAKE) -C backend install
	$(MAKE) -C frontend install

test:
	$(MAKE) -C backend test
	$(MAKE) -C frontend test

%:
	@true

.PHONY: backend frontend install test clean
