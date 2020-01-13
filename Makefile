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
kiosk-full-upgrade: kiosk-deploy \
	kiosk-control-restart-dm \
	kiosk-logs

#
#
# Check
#
#
kiosk-check-htop:
	ssh $(HOST) -t htop

kiosk-logs-lightdm:
	ssh $(HOST) journalctl -f -u lightdm

kiosk-logs:
	ssh $(HOST) tail -n 100 -f /tmp/kiosk-xsession.log

kiosk-logs-cycle:
	while true; do \
		make kiosk-logs \
		sleep 1s; \
	done

#
#
# Control
#
#
kiosk-control-reboot:
	ssh $(HOST) reboot

kiosk-control-restart-dm:
	ssh $(HOST) systemctl restart display-manager

kiosk-control-restart-browser:
	ssh $(HOST) su pi -c \"DISPLAY=:0 /usr/bin/xdotool key --clearmodifiers ctrl+F5\"

#
#
# Deploy
#
#
kiosk-deploy:
	rsync -rlti --delete "$(ROOT)/" "kiosk:$(TARGET)/" \
		--exclude .vagrant \
		--exclude "/node_modules"         --filter "protect /node_modules"      \
		--exclude "/media"                --filter "protect /media/"            \
		--exclude "/var"                  --filter "protect /var/"              \
		--exclude "tmp"                   --filter "protect tmp"                \

	ssh $(HOST) truncate --size 0 /tmp/kiosk-xsession.log

	ssh $(HOST) "$(TARGET)/bin/kiosk-upgrade-sources-dependencies.sh"
