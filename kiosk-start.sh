#!/bin/bash

# @see man xset
# 15min to standby mode
# xset dpms 0 0 900
# xset +dpms

set -e

xset -dpms
xset s noblank
xset s off

KIOSK_ROOT="$(dirname "${BASH_SOURCE[0]}")"

pushd "$KIOSK_ROOT" || exit 255

(
	NODE_ENV="${NODE_ENV:-production}"
	export NODE_ENV

	echo "********** Starting session kiosk ************************"
	npm start -- \
		--trace-warnings \
		--remote-debugging-port=9222 \
		--inspect=9223

	# Could be: --inspect-break=9223

) 2>&1 | tee ~/kiosk.log
