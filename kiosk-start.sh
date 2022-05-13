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

	mkdir -p "tmp"
	mkdir -p "var"
	mkdir -p "etc"

	echo "********** Checking setup ************************"
	PKG=package.json
	PKG_INST=var/package.json.installed
	mkdir -p "$(dirname "$PKG_INST")"
	touch "$PKG_INST"

	# cat | md5sum ? avoid the filename to be shown in the output...
	if [ "$(md5sum <"$PKG")" == "$(md5sum <"$PKG_INST")" ]; then
		echo "* Already up-to-date"
	else
		echo "* Need an update"

		echo "* ** install **"
		npm install --unsafe-perm

		echo "* ** prune **"
		npm prune --unsafe-perm || true
	fi
	echo "* ** done **"
	touch package-lock.json
	cp -f "$PKG" "$PKG_INST"

	echo "********** Starting session kiosk ************************"
	npm start -- \
		--trace-warnings \
		--remote-debugging-port=9222 \
		--inspect=9223

	# Could be: --inspect-break=9223

) 2>&1 | tee ~/kiosk.log
