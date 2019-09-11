#!/usr/bin/node --experimental-modules

import start from './server/server.mjs';

import getConfig from './server/server-config.mjs';
import * as browser from './server/core-browser.js';

import loggerFactory from './server/server-logger.js';
const logger = loggerFactory('core:main');

start().then((port) => {
	logger.info(`Server up and running on port ${port}`);
	if (!getConfig('core.serverOnly', false)) {
		browser.start(port);
	} else {
		logger.info('Not launching the browser as requested');
	}
});
