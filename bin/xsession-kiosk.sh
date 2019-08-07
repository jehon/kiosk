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

# H=$(xrandr | grep "\*" | cut -d' ' -f4 | cut -d'x' -f2)
# W=$(xrandr | grep "\*" | cut -d' ' -f4 | cut -d'x' -f1)

# ( 
	pushd /opt/web/www > /dev/null
	/opt/web/www/main.mjs
	popd
# ) >> /var/log/kiosk.log 2>> /var/log/kiosk.err

	# --window-position=0,0 \
	# "--window-size=$W,$H" \
	# --start-maximized \

/usr/bin/chromium-browser \
	--kiosk \
	http://127.0.0.1:3000
