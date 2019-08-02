#!/usr/bin/node --experimental-modules

import start from './server/server.mjs';

import * as browser from './server/browser.js';

start().then((port) => {
	browser.start(port);
});
