#!/usr/bin/env bash

# From udev:
#  - DEVNAME

DEV="$DEVNAME"
MOUNTPOINT="$(kiosk-get-mountpoint.sh "$DEV")"

{
	echo "****"
	echo "$(date) Change dev:$DEV mountpoint:$MOUNTPOINT"
	ls ${DEV}
	ls ${DEV}*
	ls /dev/sd*
	echo "----"
	env 
} >> /tmp/kiosk-smartcard.log

/opt/web/www/bin/kiosk-send-message.js \
	-o 'udev' \
	-t 'filesystem.change' \
	-v "$MOUNTPOINT" \
	-i "$DEV"
