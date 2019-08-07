#!/usr/bin/env bash

#
# This script is called as soon as the git clone has been done
#    - see kickin.sh
#    /!\ We must be in the same folder as the git clone
#

set -e

# Later on, this will be set by profile...
KIOSK_APP="$(dirname "$(dirname "$( realpath "$0" )")")"
export KIOSK_APP

# shellcheck source=./lib.sh
. "$KIOSK_APP"/bin/scripts/lib.sh

header "Store configuration into environment variables"
(
	echo "export KIOSK_DEV=\"$KIOSK_DEV\""
	echo "export KIOSK_APP=\"$KIOSK_APP\" "
	echo "export KIOSK_USER=\"$KIOSK_USER\" "
	echo "export NODE_ENV=\"$NODE_ENV\""
) > /etc/profile.d/kiosk-profile.sh

header "Ensure user $KIOSK_USER user exists"
if ! id "$KIOSK_USER" 2>/dev/null >/dev/null ; then
	debug "adding $KIOSK_USER user"
	useradd "$KIOSK_USER" --create-home --groups "audio,video,plugdev,netdev,dip,cdrom"

	restrictedToDev usermod --append --groups "vagrant" "$KIOSK_USER"
	
	# FIXME: usefull ? We create the user and it to groups
	# SRC_NAME=$(id -un 1000 )
	# SRC_GROUPS=$(id -Gn $SRC_NAME | sed "s/$SRC_NAME //g" | sed "s/ $SRC_NAME//g" | sed "s/ /,/g")
fi

##
## Call normal setup
##
"$KIOSK_APP"/bin/kiosk-setup.sh

##
## Configure newly installed packages
##    the packages are installed by kiosk-setup.sh
##

header "lightdm will start $KIOSK_USER user"
crudini --set /etc/lightdm/lightdm.conf "LightDM" "autologin-session" "kiosk"
# TODO: use non-root user ?
crudini --set /etc/lightdm/lightdm.conf "LightDM" "autologin-user" "root"

header "Redirect sound output to jack first card"
cp "$KIOSK_APP"/bin/files/asound.conf /etc/
chmod 640 /etc/asound.conf

header "Finished with success"
echo "For this changes to take effect, please restart the server"
