#!/usr/bin/env bash

set -e

KIOSK_ROOT="$(dirname "$(dirname "$(realpath "${BASH_SOURCE[0]}")")")"
export KIOSK_ROOT

apt install \
    ffmpeg exiv2 gettext-base \
    unclutter \
    build-essential \
    snapd

# curl -sL https://deb.nodesource.com/setup_current.x | bash -
# apt --yes install nodejs

snap install core
snap install node --classic

# remove the toastr warning about battery
# (we still have the lightnight bolt to warn about power)
apt remove lxplug-ptbatt

# Install the auto-login
jh-patch /etc/jehon/lightdm-autostart.conf
