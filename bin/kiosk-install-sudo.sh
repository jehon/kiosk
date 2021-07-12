#!/usr/bin/env bash

apt install \
    ffmpeg exiv2 gettext-base \
    unclutter \
    gcc g++ make

curl -sL https://deb.nodesource.com/setup_16.x | bash -
apt --yes install nodejs
