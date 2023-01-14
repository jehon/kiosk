#!/usr/bin/env bash

export DEBIAN_FRONTEND=noninteractive 

apt update

apt install -y firefox xvfb jehon-service-kiosk
