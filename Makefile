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

PATH := $(shell npm bin):$(PATH)

dump:
	$(info ROOT:         $(ROOT))
	$(info PATH:         $(PATH))
	$(info KIOSK_CONFIG: $(KIOSK_CONFIG))

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
	jh-kill-by-port 4545

.PHONY: build
build: dependencies browserslist \
		externals/mpd/README.md \
		externals/websockify/README.md \
		tmp/importmap.json
	mkdir -p tmp

externals/%/README.md:
	git submodule init
	git submodule update

.PHONY: dependencies
dependencies: node_modules/.packages-installed.json
node_modules/.packages-installed.json: package.json package-lock.json
	npm ci
	touch package-lock.json
	touch "$@"

.PHONY: browserslist
browserslist:
	$(shell npm bin)/browserslist --update-db

tmp/importmap.json:
	mkdir -p "$(dir $@)"
	$(shell npm bin)/importly < package-lock.json > "$@"

.PHONY: test
test: test-server test-client
	echo "ok"

.PHONY: test-server
test-server: build
	xvfb-run -a jasmine --config=tests/server/jasmine.json

.PHONY: test-client
test-client: build
	karma start tests/client/karma.conf.cjs --single-run

.PHONY: test-client-continuously
test-client-continuously: build
	karma start tests/client/karma.conf.cjs

.PHONY: lint
lint: dependencies
	lint .
	stylelint **/*.css

.PHONY: lint-fix
lint-fix: dependencies
	lint . --fix

.PHONY: depcheck
depcheck:
	depcheck
