#!/usr/bin/env bash

set -e 

KIOSK_APP="$(dirname "$(dirname "$(dirname "$( realpath "$0" )")")")"

. "$KIOSK_APP"/bin/lib.sh

KIOSK_APP="$(dirname "$(dirname "$(dirname "$( realpath "$0" )")")")"

NHOSTNAME=$( "$KIOSK_APP/bin/scripts/read-kiosk-config.mjs" "core.hostname" "kiosk" )

debug "Set hostname to $NHOSTNAME"

if [ -z "$NHOSTNAME" ]; then
    exit 1
    echo "No new hostname found from config" >&2
fi

hostnamectl set-icon-name video-display
hostnamectl set-hostname "$NHOSTNAME"

echo "!! You need to reboot for this change to take effect !!"
