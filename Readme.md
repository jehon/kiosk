# Kiosk

## Setup

run kickstart.sh

### Explained

use the ubuntu server image for raspberry-pi
change the password of the ubuntu setup by ssh on it

run setup-kiosk (package folder)
  go on the server and clone repository

run bin/kiosk-initialize.sh

copy config to /opt/kiosk/etc/


## Server

### Strange ?

npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"

TODO: mounter without fstab
TODO: https://snapcraft.io/docs/node-apps
TODO: configure the log rotation (! impact on makefile)

### https://nodejs.org/dist/latest-v13.x/docs/api/esm.html

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

https://nodejs.org/dist/latest-v13.x/docs/api/modules.html#modules_module_createrequire_filename
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

Named exports of builtin modules are updated only by calling module.syncBuiltinESMExports().

## Current problems

### TODO: electron install on rasbian

-> See https://github.com/electron/electron/issues/20723

In /root/.npmrc

```lang=ini
arch=armv7l
```

### TODO: common.es6 build

We need to have the dev dependencies to build up the common.es6 versions of common's

## ESLint: TODO
remove
    "template-curly-spacing": "off",

add:
    "indent": [
      "error",
      "tab",
      {
        "SwitchCase": 1

	  }
    ],


# mir-kiosk




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



####


The solution

Edit /etc/pam.d/lightdm and remove nopasswdlogin from this line:

auth    sufficient      pam_succeed_if.so user ingroup nopasswdlogin
