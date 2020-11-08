# Kiosk

[![Build Status](https://travis-ci.com/jehon/kiosk.svg?branch=master)](https://travis-ci.com/jehon/kiosk)

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
