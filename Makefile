#!/usr/bin/env make

#
#
# Default target
#
#
auto:

#
#
# Generic configuration
#
#
SSH_HOST ?= kiosk
SSH_USER ?= kiosk
SSH_TARGET ?= kiosk
CONFIG ?= $(JH_SECRETS_FOLDER)/crypted/kiosk/kiosk.yml

# https://ftp.gnu.org/old-gnu/Manuals/make-3.79.1/html_chapter/make_7.html
# https://stackoverflow.com/a/26936855/1954789
SHELL := /bin/bash
.SECONDEXPANSION:

PATH := $(shell npm bin):$(PATH)

#
#
# System variables
#
#
ROOT   ?= $(shell dirname $(abspath $(lastword $(MAKEFILE_LIST))))

dump:
	$(info ROOT:       $(ROOT))
	$(info PATH:       $(PATH))
	$(info SSH_HOST:   $(SSH_HOST))
	$(info SSH_USER:   $(SSH_USER))
	$(info SSH_TARGET: $(SSH_TARGET))

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

setup-computer:
	sudo apt -y install exiv2
	mkdir -p etc/
	if [ -r $(CONFIG) ]; then
		ln -f -s $(CONFIG) etc/
	fi

setup-computer-test:
	type exiv2
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
start: build
	electron .

.PHONY: start-dev-with-prod-config
start-dev-with-prod-config: build
	clear
	electron . -f etc/kiosk.yml --dev-mode

.PHONY: start-dev-with-test-config
start-dev-with-test-config: build
	clear
	DEBUG="kiosk:loggers,$$DEBUG" electron . -f tests/kiosk.yml --dev-mode

.PHONY: start-dev-with-test-config-brk
start-dev-with-test-config-brk: build
	clear
	electron --inpect-brk --trace-uncaught . -f tests/kiosk.yml --dev-mode


.PHONY: build
build: dependencies
	mkdir -p tmp

.PHONY: dependencies
dependencies: node_modules/.dependencies
node_modules/.dependencies: package.json package-lock.json
	npm ci
	cd node_modules && patch -p1 < ../patch-spectron.patch
	touch package-lock.json
	touch node_modules/.dependencies

# dependencies-generate-patch:
# 	(diff -x package.json -x package-lock.json -rubB node_modules/ node_modules.bak/ || true) > modules.patch

.PHONY: test
test: test-server test-client test-app

.PHONY: test-server
test-server: build
	xvfb-run -a jasmine --config=tests/server/jasmine.json

.PHONY: test-client
test-client: build
	karma start tests/client/karma.conf.cjs --single-run

.PHONY: test-client-continuously
test-client-continuously: build
	karma start tests/client/karma.conf.cjs

.PHONY: test-app
test-app: build
	rm -fr tmp/app
	mkdir -p tmp/app
	xvfb-run --server-args="-screen 0 1024x768x24" ./spectron.cjs

.PHONY: lint
lint:
	eslint .
	stylelint **/*.css

.PHONY: lint-fix
lint-fix:
	eslint . --fix

.PHONY: depcheck
depcheck:
	depcheck

#
#
# Full
#
#
full-upgrade: dump \
	deploy \
	remote-restart-dm \
	remote-logs

#
#
# Check
#
#
remote-htop:
	ssh $(SSH_HOST) -t htop

remote-logs-lightdm:
	ssh $(SSH_HOST) journalctl -f -u lightdm

remote-logs:
	ssh $(SSH_HOST) tail -n 1000 -f $(SSH_TARGET)/tmp/kiosk.log

remote-logs-cycle:
	while true; do \
		make remote-logs \
		sleep 1s; \
	done

#
#
# Control
#
#
remote-reboot:
	ssh $(SSH_HOST) reboot

remote-restart-dm:
	ssh $(SSH_HOST) systemctl restart display-manager

#
#
# Deploy
#
#
deploy: dump build
# Wait for the remote to be ready (ping && ssh ok - see github.com/jehon/packages/usr/bin/jh-ssh-ping)
	type jh-ssh-ping >/dev/null 2>&1 && jh-ssh-ping -w "kiosk" || true

	rsync --itemize-changes --recursive --perms --times --links --delete "$(ROOT)/" "$(SSH_USER)@$(SSH_HOST):$(SSH_TARGET)/" \
		--exclude "/node_modules"         --filter "protect /node_modules"      \
		--exclude "/var"                  --filter "protect /var/"              \
		--exclude "tmp"                   --filter "protect tmp"                \
		--exclude "etc/kiosk.yml"         --filter "protect etc/kiosk.yml"      \
		--exclude ".nfs*"

	scp $(CONFIG) $(SSH_USER)@$(SSH_HOST):$(SSH_TARGET)/etc/kiosk.yml

	ssh root@$(SSH_HOST) systemctl restart display-manager
