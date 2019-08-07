#!/usr/bin/env bash

#
#
# In dev, when we push some code, we just want to be sure
# that the node_modules are up-to-date
#
# And then, restart the service
#

set -e



# shellcheck source=./lib.sh
. "$(dirname "$BASH_SOURCE" )"/scripts/lib.sh

pushd "$KIOSK_APP" > /dev/null

if [ -r package-lock.json ] && [ package-lock.json -nt package.json ]; then
	header "Already up-to-date"
	exit 0
fi

header "Need an update"
header_sub "** install **"
# See https://docs.npmjs.com/misc/scripts
npm install --unsafe-perm

header_sub "** prune **"
npm prune --unsafe-perm || true

header "** done **"
touch package-lock.json

header "** apply patches **"
"$KIOSK_APP"/apply-patches.sh

header "Restarting the service"
"$KIOSK_APP"/bin/kiosk-restart.sh
