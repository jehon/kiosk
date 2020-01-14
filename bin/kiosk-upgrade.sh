#!/usr/bin/env bash

#
# Upgrade the code base
#
# and then call the (new) kiosk-setup.sh script
#
#
# SNAP: this should be done inside the snap
#

set -e

KIOSK_APP="$(dirname "$(dirname "$BASH_SOURCE" )" )"

# shellcheck source=./scripts/lib.sh
. "$KIOSK_APP"/bin/scripts/lib.sh

pushd "$KIOSK_APP" > /dev/null

header "Update the code"
LCOMMIT="$(git rev-parse HEAD)"

header_sub "Dump the current status (for information only)"
git status

header_sub "In production: reset all local modifications"
restrictedToProd git reset --hard

header_sub "Pulling all"
if ! git pull --all --prune; then
    header "Remote branch has dissapear, looking for a new one..."

    ORIGIN=$(git branch --remotes --merged "HEAD" | grep -v HEAD)
    header "New origin: $ORIGIN"

    BRANCH="${ORIGIN/origin\/}"
    BRANCH="${BRANCH// /}"
    header "New branch: '$BRANCH'"
  
    header "Going on the new branch: $BRANCH"
    git checkout "$BRANCH"
    git pull

    header "On new branch: $BRANCH"
fi

NCOMMIT="$(git rev-parse HEAD)"

if [ "$LCOMMIT" != "$NCOMMIT" ] || [ ! -e "node_modules" ]; then
	# No change in the pull'ed commit
	# And we are already installed...

    # In Dev, this would go out here,
    # while perhaps, the latest package.json has changed
    #
    # So in dev, we will call the "kiosk-dev.sh"
    #
    # shellcheck source=./bin/kiosk-setup.sh
    "$KIOSK_APP"/bin/kiosk-setup.sh
fi
