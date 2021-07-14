#!/usr/bin/env bash

apt install \
    ffmpeg exiv2 gettext-base \
    unclutter \
    gcc g++ make

# remove the toastr warning about battery
# (we still have the lightnight bolt to warn about power)
apt remove lxplug-ptbatt

curl -sL https://deb.nodesource.com/setup_16.x | bash -
apt --yes install nodejs
