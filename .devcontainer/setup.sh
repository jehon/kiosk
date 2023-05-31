#!/usr/bin/env bash

set -o errexit
set -o pipefail

export DEBIAN_FRONTEND=noninteractive

ls -l /etc/apt/sources.list.d

apt_install() {
    apt install --yes --quiet "$@"
}

apt update
apt_install ca-certificates

apt update
apt_install jehon

apt update
apt_install jehon-os-debian

apt update
apt_install jehon-hardware-docker

apt update
apt_install xvfb jehon-service-kiosk \
    firefox-esr \
    chromium \
    ffmpeg exiftool gettext-base \
    build-essential \
    imagemagick-6.q16 \
    python3 python3-yaml jq
