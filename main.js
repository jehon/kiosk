#!/usr/bin/env node

const startServer = require('./server/server.js');

const { getConfig } = require('./server/server-config.js');
const browser = require('./server/core-browser.js');

const loggerFactory = require('./server/server-logger.js');
const logger = loggerFactory('core:main');

startServer().then((port) => {
	logger.info(`Server up and running on port ${port}`);
	if (!getConfig('core.serverOnly', false)) {
		browser.start(port);
	} else {
		logger.info('Not launching the browser as requested');
	}
});
