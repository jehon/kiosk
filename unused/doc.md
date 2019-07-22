
# Kiosk

## Todo

### Packaging

- it uses jh-apply-specials -> patch
- it uses some configuration's from jehon-env-common ?

### Configuration ?

- Live <= json (= overwrite Hard config temporary)
- Hard <= json
- Backend from above json <= though !

- config description:
  - group...key = value / type
  - type: string / protected / int / listOf
- route to store all that -> synchronized !!!

- listeners => adapt in the system
  - define the listeners
  - specify listening on (bla.bla / bla.* / ... )
  - launch them when trigger is started
  - triggers dependancies ?
  ==> No: that need to be done by routes in express.js !!!

### Modularization

Each module could define hooks:

- base system
- configuration
  - config page -> camera, photojs (-> samba module)
  - config storage mechanism
  - server-side: manage patching the system accordingly (per module)
  - cron ? from webpage ?
  - tempConfig ?
- define the module to be downloaded
  - install it in packages.json
  - find it back
- server.js
- web pages (-> auto register - autocofigure already ok)
  - auto-register: need some mechanism on server side (once at script install)
- documentation


### Camera

See https://www.raspberrypi.org/forums/viewtopic.php?t=21632
-> raspi-config

rpi-update
# https://www.raspberrypi.org/forums/viewtopic.php?t=68247#p873819
modprobe bcm2835-v4l2
==> /etc/modules

record:  /proc/asound/card1/pcm0c/
play:    /proc/asound/card1/pcm0p/
https://learn.adafruit.com/usb-audio-cards-with-a-raspberry-pi?view=all

