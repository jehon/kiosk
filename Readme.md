# Kiosk

## Setup

### Burn an SD Card

Use the raspberry-pi OS image (desktop)

### Install required packages (production)

sudo bin/kiosk-install-sudo.sh

### Git checkout
git checkout the project to the home of the user that will run the kiosk

ex:

```
cd $HOME
git clone https://github.com/jehon/kiosk.git
cd kiosk
```

### Install

To allow kiosk to run at login (of the user), please run:

```
bin/kiosk-install.sh
```

### Start

```
kiosk-start.sh
```

### Configure

Create a kiosk.yml in the etc subfolder

## Logs

checks: 
sudo tail -n 100 -f /var/log/lightdm/lightdm.log
sudo tail -n 100 -f /var/log/lightdm/x-0.log
tail -n 100 -f .xsession-errors
tail -n 100 -f kiosk/tmp/kiosk.log

# Developping

You are more than welcome to contribute to this project.

According to your setup, you will have to change in the Makefile (see on the top the variables).

## Apt

You will also need to install additionnal packages, but the list is not maintained (sorry).

It includes:
- chromium
- make
- xvfb

# Current problems (TODO)

## Electron install on rasbian (not present anymore?)

-> See https://github.com/electron/electron/issues/20723

In $HOME/.npmrc

```lang=ini
arch=armv7l
```

## TODO: common.es6 build

We need to have the dev dependencies to build up the common.es6 versions of common's


## Use mir-kiosk ?

https://forum.snapcraft.io/t/introducing-wpe-webkit-mir-kiosk-snap/12044/8


Good to know! FYI: You can activate the remote inspector 11 with snap set wpe-webkit-mir-kiosk devmode=true. When enabled, open any WebKitGTK browser (e.g. GNOME Web / Epiphany) and visit inspector://ip-or-hostname-of-your-device-running-wpe:8080.


https://discourse.ubuntu.com/t/install-mir-kiosk-and-chromium-mir-kiosk-under-ubuntu-18-04-server/13108

debug:
https://forum.snapcraft.io/t/introducing-wpe-webkit-mir-kiosk-snap/12044/16


At first install mir-kiosk:
sudo snap install mir-kiosk

Then chromium-mir-kiosk, please note to add the “devmode” flas, otherwise the screen will remain black:
sudo snap install chromium-mir-kiosk --beta --devmode

At last, don’t forget to daemonize mir-kiosk to start after boot:
sudo snap set mir-kiosk daemon=true

To customize the startup url for chromium use:
sudo snap set chromium-mir-kiosk url="https://yoururl.com"


https://ubuntu.com/tutorials/electron-kiosk#5-deploying-on-a-device


## Ubuntu image and autologin ?

Edit /etc/pam.d/lightdm and remove nopasswdlogin from this line:
auth    sufficient      pam_succeed_if.so user ingroup nopasswdlogin

## Memory consumption

http://seenaburns.com/debugging-electron-memory-usage/

