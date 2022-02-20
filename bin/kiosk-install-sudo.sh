#!/usr/bin/env bash

set -e

KIOSK_ROOT="$(dirname "$(dirname "$(realpath "${BASH_SOURCE[0]}")")")"
export KIOSK_ROOT

export DEBIAN_FRONTEND=noninteractive

apt install -y \
    ffmpeg exiv2 gettext-base \
    unclutter \
    build-essential \
    snapd \
    mpd

snap install core
# snap install node --classic

#
# We still need the native package (why? npm install did fail otherwise)
#
curl -sL https://deb.nodesource.com/setup_current.x | bash -
apt --yes install nodejs

# remove the toastr warning about battery
# (we still have the lightnight bolt to warn about power)
apt remove -y lxplug-ptbatt

# Install the auto-login
jh-patch /etc/jehon/lightdm-autostart.conf

# Configure MPD
cp -f etc/mpd.conf /etc/mpd.conf

echo "ok"
