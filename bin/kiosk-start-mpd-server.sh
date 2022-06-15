#!/usr/bin/env bash

clear

jh-kill-by-port 6600

cat > /etc/default/mpd <<-EOF
    bind_to_address         "/var/run/mpd.socket"
    bind_to_address         "localhost"
EOF

/usr/bin/mpd --no-daemon /etc/default/mpd
