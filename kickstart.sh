#!/usr/bin/env bash

#
#
# This script should be called for a very first install
# by anybody
#
#

if ! type git 2>/dev/null >/dev/null ; then
    DEBIAN_FRONTEND=noninteractive apt-get -y install git
fi

git clone git@github.com:jehon/kiosk.git .

chmod +x ./bin/*

./bin/initialize.sh
