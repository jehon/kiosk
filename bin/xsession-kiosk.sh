#!/bin/bash

# @see man xset
# 15min to standby mode
# xset dpms 0 0 900

# xset +dpms

xset -dpms
xset s noblank
xset s off

KIOSK_APP="$(dirname "$(dirname "${BASH_SOURCE[0]}")")"
mkdir -p "$KIOSK_APP/tmp"

truncate --size 0 "$KIOSK_APP"/tmp/kiosk-xsession.log
(
	echo "********** Checking setup ************************"
	"$KIOSK_APP"/bin/kiosk-upgrade-sources-dependencies.sh

	echo "********** Starting session kiosk ************************"
	pushd "$KIOSK_APP" || exit 1 >/dev/null
	npm start
) 2>&1 | tee "$KIOSK_APP"/tmp/kiosk-xsession.log
