# Kiosk
[![Build Status](https://travis-ci.com/jehon/kiosk.svg?branch=master)](https://travis-ci.com/jehon/kiosk)

## Server

### Strange ???

npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"

TODO: mounter without fstab
TODO: https://snapcraft.io/docs/node-apps
TODO: configure the log rotation (! impact on makefile)

"javascript.validate.enable": false,

https://electronjs.org/docs/api/web-contents#event-login

# https://nodejs.org/dist/latest-v13.x/docs/api/esm.html
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

https://nodejs.org/dist/latest-v13.x/docs/api/modules.html#modules_module_createrequire_filename
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

Named exports of builtin modules are updated only by calling module.syncBuiltinESMExports().
