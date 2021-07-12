#!/usr/bin/env bash

set -e

KIOSK_APP="$(dirname "$(dirname "$(realpath "${BASH_SOURCE[0]}")")")"
export KIOSK_APP

pushd "$KIOSK_APP" >/dev/null || exit 255

# shellcheck source=./kiosk-lib.sh
. bin/kiosk-lib.sh

header "Install the autostart feature on login"
DESKTOP_NAME="$HOME/.config/autostart/kiosk.desktop"
mkdir -p "$(dirname "$DESKTOP_NAME")"
envsubst <"$KIOSK_APP"/etc/kiosk.desktop >"$DESKTOP_NAME"
