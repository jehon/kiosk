#!/usr/bin/env bash

apt install \
    ffmpeg exiv2 gettext-base \
    unclutter \
    build-essential \
    snapd

# remove the toastr warning about battery
# (we still have the lightnight bolt to warn about power)
apt remove lxplug-ptbatt

# curl -sL https://deb.nodesource.com/setup_current.x | bash -
# apt --yes install nodejs

snap install core
snap install node --classic
