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
. "$(dirname "${BASH_SOURCE[0]}")"/scripts/lib.sh

pushd "$KIOSK_APP" >/dev/null

PKG=package.json
PKG_INST=var/package.json.installed
mkdir -p "$(dirname "$PKG_INST")"
touch "$PKG_INST"

# cat | md5sum ? avoid the filename to be shown in the output...
if [ "$(md5sum <"$PKG")" == "$(md5sum <"$PKG_INST")" ]; then
	header "Already up-to-date"
else
	header "Need an update"

	header_sub "** install **"
	# See https://docs.npmjs.com/misc/scripts
	if ! npm install --unsafe-perm; then
		echo "We are touching locked files, we need to stop the service before"
		systemctl stop display-manager

		npm install --unsafe-perm
	fi

	header_sub "** prune **"
	npm prune --unsafe-perm || true

	header "** done **"
	touch package-lock.json

	header "** mark it as new point **"
	cp -f "$PKG" "$PKG_INST"
fi

header "Restarting the service"
"$KIOSK_APP"/bin/kiosk-restart.sh
