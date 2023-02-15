#!/usr/bin/env make

#
#
# Default target
#
#
dev: dependencies dump test lint 
pull-request: clean test

#
#
# System variables
#
#
ROOT   ?= $(shell dirname $(abspath $(lastword $(MAKEFILE_LIST))))
TEST_CONFIG = tests/kiosk.yml

#
#
# Generic configuration
#
#

# https://ftp.gnu.org/old-gnu/Manuals/make-3.79.1/html_chapter/make_7.html
# https://stackoverflow.com/a/26936855/1954789
SHELL := /bin/bash
.SECONDEXPANSION:

NPM_BIN=$(shell npm root)/.bin
PATH := $(NPM_BIN):$(PATH)

dump:
	$(info ROOT:         $(ROOT))
	$(info PATH:         $(PATH))
	$(info TEST_CONFIG:  $(TEST_CONFIG))
	type firefox 2>/dev/null || echo "Firefox not found"
#
#
# Generic functions
#
#

# See https://coderwall.com/p/cezf6g/define-your-own-function-in-a-makefile
# 1: folder where to look
# 2: base file to have files newer than, to limit the length of the output
define recursive-dependencies
	$(shell \
		if [ -r "$(2)" ]; then \
			find "$(1)" -name tests_data -prune -o -name tmp -prune -o -newer "$(2)"; \
		else \
			echo "$(1)";\
		fi \
	)
endef

# See https://git-scm.com/docs/git-ls-files
# 1: folder
define git-files
	$(shell git ls-files --cached --modified --others --full-name "$(ROOT)/$(1)" )
endef

######################
#
# Runtime
#
######################

clean:
	rm -fr parts tmp
	rm -fr node_modules

.PHONY: start
start: start-pre
	bin/server.js -f $(TEST_CONFIG)

.PHONY: start-prod
start-prod: start-pre
	bin/server.js

.PHONY: start-pre
start-pre: build \
	stop-previous \
	var/photos/index.json \
	var/fire

var/photos/index.json: bin/photos-selector.js
	bin/photos-selector.js -f $(TEST_CONFIG)

var/fire: bin/fire-selector
	bin/fire-selector $(TEST_CONFIG)

stop-previous:
	jh-kill-by-port 5454

.PHONY: dependencies
dependencies: node_modules/.packages-installed.json

node_modules/.packages-installed.json: package.json
	npm ci
	$(NPM_BIN)/browserslist --update-db
	$(NPM_BIN)/importly < package-lock.json > "built/importmap.json"
	touch package-lock.json
	touch "$@"
	
.PHONY: build
build: built/index.html

built/index.html: $(shell find client packages common) package.json
	npm run build
	touch "$@"

.PHONY: test
test: dependencies
	karma start tests/client/karma.conf.cjs --single-run

.PHONY: test-client-continuously
test-client-continuously: dependencies
	karma start tests/client/karma.conf.cjs

.PHONY: lint
lint: dependencies
	eslint .
	stylelint **/*.css
	prettier --list-different .

.PHONY: lint-fix
lint-fix: dependencies
	lint . --fix

.PHONY: depcheck
depcheck:
	depcheck
