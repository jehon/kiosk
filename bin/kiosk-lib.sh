#!/usr/bin/env bash

set -e

# Default values
KIOSK_APP="$(dirname "$(dirname "$(realpath "${BASH_SOURCE[0]}")")")"
export KIOSK_APP

NODE_ENV="${NODE_ENV:-production}"
export NODE_ENV

#
#
# Colors
#
#

# shellcheck disable=SC2034
COLORS=""
if [ "$BASH" ]; then
    COLORS="yes"
fi
export COLORS

color() {
    if [ -z "$COLORS" ]; then
        return
    fi

    if [ -z "$1" ]; then
        echo -en "\e[00m"
    else
        echo -en "\e[$1m"
    fi
}

#
#
# Headers
#
#

HEADER_INDEX=0
HEADER_SUB_INDEX=0
header() {
    ((HEADER_INDEX += 1))
    echo "$(color "01;36")** [$HEADER_INDEX] $* $(color)"
    HEADER_SUB_INDEX=0
}

header_sub() {
    ((HEADER_SUB_INDEX += 1))
    echo "$(color "01;35")** $HEADER_INDEX.$HEADER_SUB_INDEX $* $(color)"
}
