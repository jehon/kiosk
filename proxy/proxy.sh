#!/usr/bin/env bash

SWD="$( dirname "$0" )"
TP=tinyproxy


$TP -d -c webcam.conf
