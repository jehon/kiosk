#!/usr/bin/env bash

set -e

#
#
# This script should be called for a very first install
# by anybody
#
#

if ! type git 2>/dev/null >/dev/null ; then
    DEBIAN_FRONTEND=noninteractive apt-get -y install git
fi

# Go where to install it (/opt/kiosk)

git clone https://github.com/jehon/kiosk.git

cd kiosk || exit 255

chmod +x ./bin/*

./bin/kiosk-initialize.sh
