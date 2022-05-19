#!/usr/bin/env bash

set -o errexit
set -o pipefail

# shellcheck source=/usr/bin/jh-lib
. jh-lib

export KIOSK_ROOT="$JH_SWD"
echo "Root folder is $KIOSK_ROOT"
pushd "$KIOSK_ROOT" || exit 255

header_begin "npm install"
npm install --only=prod --allow-root --unsafe-perm
header_end


ok "Done"
