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

# https://ftp.gnu.org/old-gnu/Manuals/make-3.79.1/html_chapter/make_7.html
# https://stackoverflow.com/a/26936855/1954789
SHELL := /bin/bash
.SECONDEXPANSION:

#
#
# System variables
#
#
ROOT   ?= $(shell dirname $(abspath $(lastword $(MAKEFILE_LIST))))
HOST   ?= kiosk
TARGET ?= /opt/web/www
# TARGET := /opt/kiosk

dump:
	$(info ROOT:   $(ROOT))
	$(info HOST:   $(HOST))
	$(info TARGET: $(TARGET))

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
remote-ssh:
	ssh $(HOST) -X -t "cd $(TARGET) && exec bash --login"

remote-ssh-pi:
	ssh pi@$(HOST) -X -t "cd $(TARGET) && exec bash --login"

remote-htop:
	ssh $(HOST) -t htop

remote-logs-lightdm:
	ssh $(HOST) journalctl -f -u lightdm

remote-logs:
	ssh $(HOST) tail -n 100 -f /tmp/kiosk-xsession.log

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
	ssh $(HOST) reboot

remote-restart-dm:
	ssh $(HOST) systemctl restart display-manager

#
#
# Deploy
#
#
deploy: dump
	npm run build

	rsync -rlti --delete "$(ROOT)/" "kiosk:$(TARGET)/" \
		--exclude .vagrant \
		--exclude "/node_modules"         --filter "protect /node_modules"      \
		--exclude "/media"                --filter "protect /media/"            \
		--exclude "/var"                  --filter "protect /var/"              \
		--exclude "tmp"                   --filter "protect tmp"                \

	ssh $(HOST) chmod -R a+rwX "$(TARGET)"
	ssh $(HOST) chmod -R a+x   "$(TARGET)/bin"

	ssh $(HOST) truncate --size 0 /tmp/kiosk-xsession.log

	ssh $(HOST) "$(TARGET)/bin/kiosk-upgrade-sources-dependencies.sh"
