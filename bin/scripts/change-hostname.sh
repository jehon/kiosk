#!/usr/bin/env bash

set -e 

KIOSK_APP="$(dirname "$(dirname "$(dirname "$( realpath "$0" )")")")"

. "$KIOSK_APP"/bin/lib.sh

KIOSK_APP="$(dirname "$(dirname "$(dirname "$( realpath "$0" )")")")"

O_HN="$(hostname)"
O_HN="${O_HN/.*}"
N_HN=$( "$KIOSK_APP/bin/scripts/read-kiosk-config.mjs" "core.hostname" "kiosk" )

debug "Old hostname: $O_HN"
debug "New hostname: $N_HN"

if [ -z "$O_HN" ]; then
    echo "No old hostname found" >&2
    exit 1
fi

if [ -z "$N_HN" ]; then
    exit 1
    echo "No new hostname found from config" >&2
fi

debug "Set hostname to $N_HN"
echo $N_HN > /etc/hostname

debug "Set hosts from $O_HN to $N_HN"
sed -i "s/$O_HN/$N_HN/g" /etc/hosts

echo "!! You need to reboot for this change to take effect !!"
