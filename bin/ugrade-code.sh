#!/usr/bin/env bash

set -e

. "$KIOSK_APP"/bin/lib.sh

if [ $(whoami) != "$KIOSK_USER" ]; then
    echo "You must run this script as $KIOSK_USER"
    exit 255
fi

pushd "$KIOSK_APP"

LCOMMIT="$(git rev-parse HEAD)"

header "Dump the current status (for information only)"
git status

header "In production: reset all local modifications"
restrictedToProd git reset --hard

header "Pulling all"
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

if [ "$LCOMMIT" != "$NCOMMIT" ]; then
    header "Backend has changed, need to run setup again"
    header "TODO: To be done as root"
    # "$KIOSK_APP"/bin/setup.sh
    
    header "TODO: reboot the service"
fi
