#!/usr/bin/env bash

#
#
# In dev, when we push some code, we just want to be sure
# that the node_modules are up-to-date
#
# And then, restart the service
#
#
# SNAP: this should be done inside the snap
#

set -e



# shellcheck source=./scripts/lib.sh
. "$(dirname "$BASH_SOURCE" )"/scripts/lib.sh

pushd "$KIOSK_APP" > /dev/null

PKG=package.json
PKG_INST=var/package.json.installed

# cat | md5sum ? avoid the filename to be shown in the output...
if [ -r "$PKG_INST" ] && [ "$(cat "$PKG" | md5sum)" == "$(cat "$PKG_INST" | md5sum)" ]; then
	header "Already up-to-date"
else
	header "Need an update"

	header_sub "** install **"
	# See https://docs.npmjs.com/misc/scripts
	npm install --unsafe-perm

	header_sub "** prune **"
	npm prune --unsafe-perm || true

	header "** done **"
	touch package-lock.json

	header "** mark it as new point **"
	cp "$PKG" "$PKG_INST"
fi

header "Restarting the service"
"$KIOSK_APP"/bin/kiosk-restart.sh
