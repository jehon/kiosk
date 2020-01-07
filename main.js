
const startServer = require('./server/server.js');

const getConfig = require('./server/server-config.js');
const browser = require('./server/core-browser.js');

const loggerFactory = require('./server/server-logger.js');
const logger = loggerFactory('core:main');

const { app: electronApp } = require('electron');
const port = getConfig('core.port');

electronApp.on('ready', () => {
	logger.debug('Elector: on ready fired');
	startServer(port).then((port) => {
		logger.info(`Server up and running on port ${port}`);
		browser.start(port);
	});
});

// Quit when all windows are closed.
electronApp.on('window-all-closed', () => electronApp.quit());
