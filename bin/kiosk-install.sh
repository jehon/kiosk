#!/usr/bin/env bash

set -e

# shellcheck source=./kiosk-lib.sh
. bin/kiosk-lib.sh

header "Install the autostart feature on login"
DESKTOP_NAME="$HOME/.config/autostart/kiosk.desktop"
mkdir -p "$(dirname "$DESKTOP_NAME")"
envsubst <"$KIOSK_APP"/etc/kiosk.desktop >"$DESKTOP_NAME"
