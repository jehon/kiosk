#!/usr/bin/env bash

#
# This script is called as soon as the git clone has been done
#    - see kickin.sh
#    /!\ We must be in the same folder as the git clone
#
# SNAP: This script will always exist
#

set -e

# Later on, this will be set by profile...
KIOSK_APP="$(dirname "$(dirname "${BASH_SOURCE[0]}")")"
export KIOSK_APP

# shellcheck source=/dev/null
. "$KIOSK_APP"/bin/scripts/lib.sh

header "Store configuration into environment variables"
(
	echo "export KIOSK_DEV=\"$KIOSK_DEV\""
	echo "export KIOSK_APP=\"$KIOSK_APP\""
	echo "export KIOSK_USER=\"$KIOSK_USER\""
	echo "export NODE_ENV=\"$NODE_ENV\""
) >/etc/profile.d/kiosk-profile.sh

header "Ensure user $KIOSK_USER user exists"
if ! id "$KIOSK_USER" 2>/dev/null >/dev/null; then
	debug "adding $KIOSK_USER user"
	useradd "$KIOSK_USER" --create-home --groups "audio,video,plugdev,netdev,dip,cdrom,nopasswdlogin kiosk"
fi

##
## Call normal setup
##
"$KIOSK_APP"/bin/kiosk-setup.sh

##
## Configure newly installed packages
##    the packages are installed by kiosk-setup.sh
##

header "Install the frontend session"
cp etc/kiosk-xsession.conf /usr/share/xsessions/
chown root.root /usr/share/xsessions/kiosk.*

cp etc/kiosk-lightdm.conf /etc/lightdm.conf.d/

rm -f /etc/systemd/system/default.target
ln -s /lib/systemd/system/graphical.target /etc/systemd/system/default.target

header "Redirect sound output to jack first card"
cp "$KIOSK_APP"/bin/files/asound.conf /etc/
chmod 640 /etc/asound.conf

echo "arch=armv7l" >/root/.npmrc
echo "arch=armv7l" >/home/pi/.npmrc

mkdir -p /opt/kiosk/etc

header "Restarting the service"
"$KIOSK_APP"/bin/kiosk-restart.sh

header "Finished with success"
echo "For this changes to take effect, please restart the server"
