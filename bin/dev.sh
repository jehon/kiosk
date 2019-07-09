#!/usr/bin/env bash

set -e

KIOSK_APP="$(dirname "$(dirname "$( realpath "$0" )")")"
KIOSK_USER="$( id -un 1000 )"

export KIOSK_DEV="true"
export KIOSK_USER
export KIOSK_APP
export NODE_ENV="development"

. "$KIOSK_APP"/bin/lib.sh

header "Store (dev) configuration into environment variables"
(
	echo "export KIOSK_DEV=\"$KIOSK_DEV\""
	echo "export KIOSK_APP=\"$KIOSK_APP\" "
	echo "export KIOSK_USER=\"$KIOSK_USER\" "
	echo "export NODE_ENV=\"$NODE_ENV\""
) > /etc/profile.d/kiosk-profile.sh

DEV_NODE_STORAGE="/home/vagrant_node_modules"
header "Mount the vagrant modules from bind"
umount "$KIOSK_APP/node_modules" 2>/dev/null || true

header "Create the storage $DEV_NODE_STORAGE"
mkdir -p "$DEV_NODE_STORAGE"
chown -R $KIOSK_USER "$DEV_NODE_STORAGE"
chmod -R ug+rwX "$DEV_NODE_STORAGE"

header "Mount the storage to $KIOSK_APP/node_modules"
mkdir -p "$KIOSK_APP/node_modules"
mount --bind "$DEV_NODE_STORAGE" "$KIOSK_APP"/node_modules -o user

# TODO: add mount-bind config to fstab for usage on reboot !
#  and then, remove "run always" from vagrant
