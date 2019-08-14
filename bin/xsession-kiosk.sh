#!/bin/bash

# @see man xset
# 15min to standby mode
xset +dpms
# xset dpms 0 0 900

shellcheck disable=SC1091
. /etc/profile.d/kiosk-profile.sh

fixCrash() {
	sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' "$1"
	sed -i 's/"exit_type":"Crashed"/"exit_type":"None"/' "$1"
}

fixCrash "$HOME/.config/chromium/Default/Preferences"
fixCrash "$HOME/.config/chromium/Local State"

(
	echo "********** Starting session kiosk ************************"
	pushd "$KIOSK_APP" > /dev/null
	/usr/bin/node --experimental-modules main.js
) 2>&1 | tee -a /tmp/kiosk-xsession.log
