#!/usr/bin/env bash

set -o errexit
set -o pipefail

export DEBIAN_FRONTEND=noninteractive 

find /etc/apt

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
apt_install firefox-esr xvfb jehon-service-kiosk