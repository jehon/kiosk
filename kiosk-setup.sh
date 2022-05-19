#!/usr/bin/env bash

set -o errexit
set -o pipefail

# shellcheck source=/usr/bin/jh-lib
. jh-lib

export KIOSK_ROOT="$JH_SWD"
echo "Root folder is $KIOSK_ROOT"
pushd "$KIOSK_ROOT" || exit 255

header_begin "stop display manager"
systemctl stop display-manager
header_end

if diff package.json node_modules/.packages-installed.json 2>/dev/null >/dev/null ; then
    header_begin "npm install"
    npm install --only=prod --allow-root --unsafe-perm=true
    header_end
else
    ok "Dependencies are not changed"
fi

header_begin "restart display manager"
systemctl restart display-manager
header_end

ok "Done"
