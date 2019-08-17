#!/usr/bin/node --experimental-modules

import start from './server/server.mjs';

import getConfig from './server/server-api-config.mjs';
import * as browser from './server/browser.js';

import loggerFactory from './common/logger.js';
const logger = loggerFactory('main');

start().then((port) => {
	logger.startup(`Server up and running on port ${port}`);
	if (!getConfig('cmdLine.server-only', false)) {
		browser.start(port);
	} else {
		logger.startup('Not launching the browser as requested');
	}
});
