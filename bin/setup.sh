#!/usr/bin/env bash

set -e

if [ -z "$KIOSK_APP" ]; then
	echo "KIOSK_APP is not set. This is abnormal. Quitting" >&2
	exit 1
fi

. "$KIOSK_APP"/bin/lib.sh

header "Enforce minimal dependencies"
header_sub "updating indexes"
apt --yes update

header_sub "Requiring production packages: $CFG_MIN_APT"
apt install --yes $CFG_MIN_APT

restrictedToDev header_sub "Install development packages: $CFG_DEV_APT"
restrictedToDev apt --yes install $CFG_DEV_APT

header_sub "Ensure nodejs with version $CFG_MIN_NODE_VERSION is present"
install_nodejs() {
	local MAJ_VERSION=${CFG_MIN_NODE_VERSION/.*}
	debug "Installing nodejs $MAJ_VERSION"
	curl -sL https://deb.nodesource.com/setup_${MAJ_VERSION}.x | bash -
	apt --yes install nodejs
}

if ! type nodejs > /dev/null; then
	debug "Nodejs not found on system"
	install_nodejs
else
	nodeVersion=$(node --version 2>&1 | tr -d 'v')
	if is_version2_sufficient "$CFG_MIN_NODE_VERSION" "$nodeVersion" ; then
		debug "Installed version is ok: $nodeVersion"
	else
		debug "Nodejs found on system is too old: $nodeVersion"
		install_nodejs
	fi
fi

header "Install the frontend session"
cp "$KIOSK_APP/bin/files/xsessions/kiosk.desktop" "/usr/share/xsessions"
cp "$KIOSK_APP/bin/files/xsessions/kiosk.sh" "/usr/share/xsessions"
chown root.root /usr/share/xsessions/kiosk.*
chmod 644 /usr/share/xsessions/kiosk.*

#
#
# Checkpoint: 
#  - the base system is operationnal
#  - kiosk is already hooked into the system
#                  
#

# header_sub "Fix permissions for $KIOSK_APP"
# TODO !!!!
# chown -R $KIOSK_USER "$KIOSK_APP"
# chmod -R ug+rwX $KIOSK_APP


header "Installing server dependencies"
pushd "$KIOSK_APP" >/dev/null

# Must run as user KIOSK_USER, because as root, compiled plugins are not available (why?)
asKioskUser npm install
asKioskUser npm prune
# chmod 775 -R node_modules
popd >/dev/null

header "Set the hostname"
"$KIOSK_APP"/bin/scripts/change-hostname.sh

exit 0
