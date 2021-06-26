#!/bin/bash

# @see man xset
# 15min to standby mode
xset +dpms
# xset dpms 0 0 900

KIOSK_APP="$(dirname "$(dirname "${BASH_SOURCE[0]}")")"
mkdir -p "$KIOSK_APP/tmp"

(
	echo "********** Starting session kiosk ************************"
	pushd "$KIOSK_APP" || exit 1 >/dev/null
	npm start
) 2>&1 | tee "$KIOSK_APP"/tmp/kiosk-xsession.log
