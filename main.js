
const { app } = require('electron');

const browser = require('./server/core-browser.js');
const logger = require('./server/server-logger.js')('core:main');
const { loadServerFiles } = require('./server/server-packages');

app.on('ready', () => {
	logger.debug('Elector: on ready fired');
	loadServerFiles()
		.then(() => browser.start());
});

// Quit when all windows are closed.
app.on('window-all-closed', () => app.quit());
