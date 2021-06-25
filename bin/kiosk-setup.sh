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
#
# SNAP: this should be done inside the snap
#

set -e

KIOSK_APP="$(dirname "$(dirname "$BASH_SOURCE")")"

# shellcheck source=../bin/scripts/lib.sh
. "$KIOSK_APP"/bin/scripts/lib.sh

header "Set variables"
CFG_MIN_APT=()
# System wide
CFG_MIN_APT=("${CFG_MIN_APT[@]}" wget apt-transport-https) # Required by nodejs install
CFG_MIN_APT=("${CFG_MIN_APT[@]}" gcc g++ make)             # Build of native extensions

# Kiosk specific
CFG_MIN_APT=("${CFG_MIN_APT[@]}" lightdm jq crudini xdotool unclutter) # System kiosk
CFG_MIN_APT=("${CFG_MIN_APT[@]}" exiv2 libexiv2-dev)                   # Extension image fast ?
CFG_MIN_APT=("${CFG_MIN_APT[@]}" cifs-utils)                           # Package 'shares'
CFG_MIN_APT=("${CFG_MIN_APT[@]}" ffmpeg)                               # Package 'camera'

case "$(lsb_release -i -s)" in
"Debian")
	CFG_MIN_APT=("${CFG_MIN_APT[@]}" chromium)
	;;
*)
	CFG_MIN_APT=("${CFG_MIN_APT[@]}" chromium-browser)
	;;
esac

export CFG_MIN_APT

CFG_DEV_APT=(htop exiftran exif gnupg2 less xvfb libgtk2.0-0 libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2)
export CFG_DEV_APT

CFG_MIN_NODE_VERSION="16"
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
	local MAJ_VERSION=${CFG_MIN_NODE_VERSION/.*/}
	debug "Installing nodejs $MAJ_VERSION"
	curl -sL https://deb.nodesource.com/setup_${MAJ_VERSION}.x | bash -
	apt --yes install nodejs
}

if ! type nodejs >/dev/null 2>&1; then
	debug "Nodejs not found on system"
	install_nodejs
else
	nodeVersion=$(node --version 2>&1 | tr -d 'v')
	if is_version2_sufficient "$CFG_MIN_NODE_VERSION" "$nodeVersion"; then
		debug "Installed version is ok: $nodeVersion"
	else
		debug "Nodejs found on system is too old: $nodeVersion"
		install_nodejs
	fi
fi

#
#
# Enforce some folders
#
#
mkdir -p "$KIOSK_APP/var"
mkdir -p "$KIOSK_APP/etc"
chmod a+rwX "$KIOSK_APP/var"
chmod a+rwX "$KIOSK_APP/etc"

#
#
# Checkpoint:
#  - the base system is operationnal
#  - kiosk is already hooked into the system
#
#

header "Installing server dependencies"
pushd "$KIOSK_APP" >/dev/null
"$KIOSK_APP"/bin/kiosk-upgrade-sources-dependencies.sh
popd >/dev/null

exit 0
