#!/usr/bin/env bash

#
# This script serve as the "base" setup / upgrade /... script
#
# It is called:
#  - by initialize
#       INITIAL=1
#       for the initial setup
#
#  - by the upgrade mechanism
#       -z INITIAL
#       in dev, the git pull --hard is disabled
#       in prod, git reset --hard will reset the folder
#

set -e

# KIOSK_APP should be set by profile, or by initialize
if [ -z "$KIOSK_APP" ]; then
	echo "KIOSK_APP is not set. This is abnormal. Quitting" >&2
	exit 1
fi

# shellcheck source=./lib.sh
. "$KIOSK_APP"/bin/lib.sh

header "Set variables"
CFG_MIN_APT=()
# System wide
CFG_MIN_APT=("${CFG_MIN_APT[@]}" wget apt-transport-https) # Required by nodejs install 
CFG_MIN_APT=("${CFG_MIN_APT[@]}" gcc g++ make) # Build of native extensions
#CFG_MIN_APT=("${CFG_MIN_APT[@]}" ) # 

# Kiosk specific
CFG_MIN_APT=("${CFG_MIN_APT[@]}" lightdm jq crudini xdotool) # System kiosk
CFG_MIN_APT=("${CFG_MIN_APT[@]}" exiv2 libexiv2-dev) # Extension image fast ?
CFG_MIN_APT=("${CFG_MIN_APT[@]}" cifs-utils) # Package 'shares'
#CFG_MIN_APT=("${CFG_MIN_APT[@]}" )

if [ "$(lsb_release -i -s)" == "Ubuntu" ]; then
	CFG_MIN_APT=("${CFG_MIN_APT[@]}" chromium-bsu)
else
	CFG_MIN_APT=("${CFG_MIN_APT[@]}" chromium)
fi

export CFG_MIN_APT

CFG_DEV_APT=(htop exiftran exif gnupg2 less xvfb libgtk2.0-0 libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2)
export CFG_DEV_APT

CFG_MIN_NODE_VERSION="12.1"
export CFG_MIN_NODE_VERSION

header "Enforce minimal dependencies"
header_sub "updating indexes"
apt --yes update

header_sub "Requiring production packages: $CFG_MIN_APT"
apt install --yes "${CFG_MIN_APT[@]}"

restrictedToDev header_sub "Install development packages: $CFG_DEV_APT"
restrictedToDev apt --yes install "${CFG_DEV_APT[@]}"

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

header "Installing cron to update kiosk daily"
ln -fs "$KIOSK_APP"/bin/upgrade.sh /etc/cron.daily/kiosk-update

#
#
# Checkpoint: 
#  - the base system is operationnal
#  - kiosk is already hooked into the system
#                  
#

header_sub "Fix permissions for $KIOSK_APP"
chown -R "$KIOSK_USER" "$KIOSK_APP"
chmod -R ug+rwX "$KIOSK_APP"

header "Installing server dependencies"
pushd "$KIOSK_APP" >/dev/null

# Must run as user KIOSK_USER, because as root, compiled plugins are not available (why?)
asKioskUser npm install
asKioskUser npm prune
popd >/dev/null

header "Set the hostname"
"$KIOSK_APP"/bin/scripts/change-hostname.sh

header "Restarting the service"
"$KIOSK_APP"/bin/restart.sh

exit 0
