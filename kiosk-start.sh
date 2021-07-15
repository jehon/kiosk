#!/bin/bash

# @see man xset
# 15min to standby mode
# xset dpms 0 0 900
# xset +dpms

xset -dpms
xset s noblank
xset s off

# https://maggick.fr/2016/12/building-a-kiosk-computer-with-chrome.html
openbox-session &

KIOSK_ROOT="$(dirname "${BASH_SOURCE[0]}")"

pushd "$KIOSK_ROOT" || exit 255

(
	# shellcheck source=bin/kiosk-lib.sh
	. bin/kiosk-lib.sh

	mkdir -p "tmp"
	mkdir -p "var"
	mkdir -p "etc"

	# shellcheck source=bin/kiosk-lib.sh
	. bin/kiosk-lib.sh

	header "********** Checking setup ************************"
	PKG=package.json
	PKG_INST=var/package.json.installed
	mkdir -p "$(dirname "$PKG_INST")"
	touch "$PKG_INST"

	# cat | md5sum ? avoid the filename to be shown in the output...
	if [ "$(md5sum <"$PKG")" == "$(md5sum <"$PKG_INST")" ]; then
		header_sub "Already up-to-date"
	else
		header_sub "Need an update"

		header_sub "** install **"
		# See https://docs.npmjs.com/misc/scripts
		if ! npm install --unsafe-perm; then
			echo "We are touching locked files, we need to stop the service before"
			systemctl stop display-manager

			npm install --unsafe-perm
		fi

		header_sub "** prune **"
		npm prune --unsafe-perm || true

	fi
	header_sub "** done **"
	touch package-lock.json
	cp -f "$PKG" "$PKG_INST"

	echo "********** Starting session kiosk ************************"
	npm start

) 2>&1 | tee tmp/kiosk.log
