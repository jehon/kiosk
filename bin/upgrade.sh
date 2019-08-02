#!/usr/bin/env bash

#
# Upgrade the code base
#
# and then call the (new) setup.sh script
#
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

    # In Dev, this would go out here,
    # while perhaps, the latest package.json has changed
    #
    # So in dev, we will call the "update-dev.sh"
    #
	exit 0
fi

# shellcheck source=./bin/setup.sh
"$KIOSK_APP"/bin/setup.sh
