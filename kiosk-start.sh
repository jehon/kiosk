#!/bin/bash

(
	set -e

	# @see man xset
	# 15min to standby mode
	# xset dpms 0 0 900
	# xset +dpms

	xset -dpms
	xset s noblank
	xset s off

	export KIOSK_ROOT="$(dirname "${BASH_SOURCE[0]}")"
	echo "Root folder is $KIOSK_ROOT"
	pushd "$KIOSK_ROOT" || exit 255

	NODE_ENV="${NODE_ENV:-production}"
	export NODE_ENV

	echo "********** Starting session kiosk ************************"
	npm start -- \
		--trace-warnings \
		--remote-debugging-port=9222 \
		--inspect=9223

	# Could be: --inspect-break=9223

) 2>&1 | tee ~/kiosk.log
