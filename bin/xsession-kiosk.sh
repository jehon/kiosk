#!/bin/bash

# @see man xset
# 15min to standby mode
xset +dpms
# xset dpms 0 0 900

# shellcheck disable=SC1091
. /etc/profile.d/kiosk-profile.sh

(
	echo "********** Starting session kiosk ************************"
	pushd "$KIOSK_APP" > /dev/null
	npm run start
) 2>&1 | tee /tmp/kiosk-xsession.log
