#!/usr/bin/env node

import startServer from './server/server.mjs';

import getConfig from './server/server-config.mjs';
import * as browser from './server/core-browser.mjs';

import loggerFactory from './server/server-logger.mjs';
const logger = loggerFactory('core:main');

startServer().then((port) => {
	logger.info(`Server up and running on port ${port}`);
	if (!getConfig('core.serverOnly', false)) {
		browser.start(port);
	} else {
		logger.info('Not launching the browser as requested');
	}
});
