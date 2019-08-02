#!/usr/bin/env

#
#
# In dev, when we push some code, we just want to be sure
# that the node_modules are up-to-date
#
# And then, restart the service
#

set -e

# KIOSK_APP should be set by profile, or by initialize
if [ -z "$KIOSK_APP" ]; then
	echo "KIOSK_APP is not set. This is abnormal. Quitting" >&2
	exit 1
fi

# shellcheck source=./lib.sh
. "$KIOSK_APP"/bin/lib.sh

pushd "$KIOSK_APP"

if [ -r package-lock.json ] && [ package-lock.json -nt package.json ]; then
	header "Already up-to-date"
	exit 0
fi

header "Need an update"
header_sub "** install **"
asKioskUser npm install

header_sub "** prune **"
asKioskUser npm prune || true

header "** done **"
touch package-lock.json

header "Restarting the service"
"$KIOSK_APP"/bin/restart.sh
