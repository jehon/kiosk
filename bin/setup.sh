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

pushd "$KIOSK_APP"

header "Update the code"
LCOMMIT="$(git rev-parse HEAD)"

header_sub "Dump the current status (for information only)"
git status

header_sub "In production: reset all local modifications"
restrictedToProd git reset --hard

header_sub "Pulling all"
if ! asKioskUser git pull --all --prune; then
    header "Remote branch has dissapear, looking for a new one..."

    ORIGIN=$(git branch --remotes --merged "HEAD" | grep -v HEAD)
    header "New origin: $ORIGIN"

    BRANCH="${ORIGIN/origin\/}"
    BRANCH="${BRANCH// /}"
    header "New branch: '$BRANCH'"
  
    header "Going on the new branch: $BRANCH"
    asKioskUser git checkout "$BRANCH"
    asKioskUser git pull

    header "On new branch: $BRANCH"
fi

NCOMMIT="$(git rev-parse HEAD)"

if [ "$LCOMMIT" == "$NCOMMIT" ] && [ -e "node_modules" ]; then
	# No change in the pull'ed commit
	# And we are already installed...
	exit 0
fi

header "Backend has changed, need to run setup again"
asKioskUser npm ci

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
