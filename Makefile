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

#
#
# Generic configuration
#
#
KIOSK_CONFIG ?= $(ROOT)/etc/kiosk.yml

# https://ftp.gnu.org/old-gnu/Manuals/make-3.79.1/html_chapter/make_7.html
# https://stackoverflow.com/a/26936855/1954789
SHELL := /bin/bash
.SECONDEXPANSION:

NPM_BIN=$(shell npm root)/.bin
PATH := $(NPM_BIN):$(PATH)

dump:
	$(info ROOT:         $(ROOT))
	$(info PATH:         $(PATH))
	$(info KIOSK_CONFIG: $(KIOSK_CONFIG))
	echo $$PATH
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

computer-setup:
	sudo apt -y install exiftool chromium-browser
	mkdir -p etc/
	if [ -r "$(KIOSK_CONFIG)" ]; then \
		ln -f -s $(KIOSK_CONFIG) etc/; \
	fi
	type exiftool
# chromium must be not a snap because jenkins run out of home folder
	type chromium || type chromium-browser

######################
#
# Runtime
#
######################

clean:
	rm -fr parts tmp
	rm -fr node_modules

.PHONY: start
start: build stop-previous
	DEBUG="kiosk:loggers,$$DEBUG" node ./server/server.js -f tests/kiosk.yml --dev-mode 2>&1 | grep -v ":ERROR:"

.PHONY: start-prod
start-prod: build stop-previous
	node ./server/server.js -f etc/kiosk.yml --dev-mode 2>&1 | grep -v ":ERROR:"

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
build:
	npm run build

.PHONY: test
test: test-server test-client
	echo "ok"

.PHONY: test-server
test-server: build
	xvfb-run -a jasmine --config=tests/server/jasmine.json

.PHONY: test-client
test-client: dependencies
	karma start tests/client/karma.conf.cjs --single-run

.PHONY: test-client-continuously
test-client-continuously: dependencies
	karma start tests/client/karma.conf.cjs

.PHONY: lint
lint: dependencies
	eslint .
	stylelint **/*.css

.PHONY: lint-fix
lint-fix: dependencies
	lint . --fix

.PHONY: depcheck
depcheck:
	depcheck
