#!/usr/bin/env bash

set -e

#
#
# Protect against running in bare metal dev machine
#
#
if [ ! -z "$JH_IS_REAL" ]; then
	echo "Your are on the real hardware, this script should not run in that config." >&2
	echo "Bailing out" >&2
	exit 255
fi

#
#
# Configs
#
#

if [ -x /etc/profile.d/kiosk-profile.sh ]; then
	. /etc/profile.d/kiosk-profile.sh
else
    # Default values
    KIOSK_APP="$(dirname "$(dirname "$( realpath "$0" )")")"
    export KIOSK_APP

    KIOSK_USER="${KIOSK_USER:-kiosk}"
    export KIOSK_USER

    NODE_ENV="${NODE_ENV:-production}"
    export NODE_ENV
fi

CFG_MIN_APT=""
# System wide
CFG_MIN_APT="$CFG_MIN_APT wget apt-transport-https" # Required by nodejs install 
CFG_MIN_APT="$CFG_MIN_APT gcc g++ make" # Build of native extensions
#CFG_MIN_APT="$CFG_MIN_APT " # 

# Kiosk specific
CFG_MIN_APT="$CFG_MIN_APT lightdm jq crudini xdotool" # System kiosk
CFG_MIN_APT="$CFG_MIN_APT exiv2 libexiv2-dev" # Extension image fast ?
CFG_MIN_APT="$CFG_MIN_APT cifs-utils" # Package 'shares'
#CFG_MIN_APT="$CFG_MIN_APT " # 
if [ "$(lsb_release -i -s)" == "Ubuntu" ]; then
	CFG_MIN_APT="$CFG_MIN_APT chromium-bsu"

else
	CFG_MIN_APT="$CFG_MIN_APT chromium"
fi

export CFG_MIN_APT

CFG_DEV_APT="htop exiftran exif gnupg2 less xvfb libgtk2.0-0 libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2"
export CFG_DEV_APT

CFG_MIN_NODE_VERSION="12.1"
export CFG_MIN_NODE_VERSION


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
# Debug
#
#

highlight() {
    echo -e "!!!!! \\e[41m $1 \\e[00m !!!!!"
}
 
debug() {
	if [ ! -z "$DEBUG" ]; then
		echo "$(color "38;5;11")[DEBUG] $@ $(color)"
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
	((HEADER_INDEX+=1))
	echo "$(color "01;36")** [$HEADER_INDEX] $@ $(color)"
	HEADER_SUB_INDEX=0
}

header_sub() {
	((HEADER_SUB_INDEX+=1))
	echo "$(color "01;35")** $HEADER_INDEX.$HEADER_SUB_INDEX $@ $(color)"
}

#
#
# Environment
#
#
restrictedToDev() {
    if [ ! -z "$KIOSK_DEV" ]; then
        "$@"
        return $?
    fi
    return 0
}

restrictedToProd() {
    if [ -z "$KIOSK_DEV" ]; then
        "$@"
        return $?
    fi
    return 0
}

asKioskUser() {
    runuser -u "$KIOSK_USER" -- "$@"
}

#
#
# Version comparison
#
#
is_version2_sufficient () {
    if [[ "$1" == "$2" ]] ; then
        return 0
    fi
    local IFS=.
    local i ver1=($1) ver2=($2)
    # fill empty fields in ver1 with zeros
    for ((i="${#ver1[@]}"; i<${#ver2[@]}; i++)) ; do
        ver1[i]=0
    done
    for ((i=0; i<${#ver1[@]}; i++)) ; do
        if [[ -z "${ver2[i]}" ]] ; then
            # fill empty fields in ver2 with zeros
            ver2[i]=0
        fi
        if ((10#${ver1[i]} > 10#${ver2[i]})) ; then
			# Oups, version 2 is lower than version 1
            return 1
        fi
        if ((10#${ver1[i]} < 10#${ver2[i]})) ; then
            return 0
        fi
    done
    return 0
}

#
#
# Initialization debug
#
#

debug "Debug mode is enabled"
debug "KIOSK_DEV  is $KIOSK_DEV"
debug "KIOSK_APP  is $KIOSK_APP"
debug "KIOSK_USER is $KIOSK_USER"
debug "NODE_ENV   is $NODE_ENV"
