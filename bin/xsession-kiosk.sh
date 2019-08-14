#!/bin/bash

# @see man xset
# 15min to standby mode
xset +dpms
# xset dpms 0 0 900

# shellcheck disable=SC1091
# . /etc/profile.d/kiosk-profile.sh

# fixCrash() {
# 	sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' "$1"
# 	sed -i 's/"exit_type":"Crashed"/"exit_type":"None"/' "$1"
# }

# fixCrash "$HOME/.config/chromium/Default/Preferences"
# fixCrash "$HOME/.config/chromium/Local State"

(
	echo "********** Starting session kiosk ************************"
	pushd /opt/web/www > /dev/null
	/usr/bin/node --experimental-modules main.js 2>&1 | tee /tmp/kiosk.log &
	PID=$!
	echo "Found id: $PID"

	echo "Waiting 10 seconds"
	sleep 10s

	H=$(xrandr | grep "\*" | cut -d' ' -f4 | cut -d'x' -f2)
	W=$(xrandr | grep "\*" | cut -d' ' -f4 | cut -d'x' -f1)

	echo "Launching chromium"
	/usr/bin/chromium-browser \
		--kiosk \
		--window-position=0,0 \
		"--window-size=$W,$H" \
		--start-maximized \
		"http://127.0.0.1:3000"

	echo "Launched: $?"

	echo "Killing server $PID:"
	kill -9 $PID
) | tee -a /tmp/kiosk-xsession.log
