
const { app } = require('electron');

const browser = require('./core-browser.js');
const logger = require('./server-logger.js')('core:main');
const { loadServerFiles } = require('./server-packages');

app.on('ready', () => {
	logger.debug('Elector: on ready fired');
	loadServerFiles()
		.then(() => browser.start());
});

// Quit when all windows are closed.
app.on('window-all-closed', () => app.quit());

// https://electronjs.org/docs/tutorial/security
app.on('web-contents-created', (event, contents) => {
	// https://electronjs.org/docs/tutorial/security#12-disable-or-limit-navigation
	contents.on('will-navigate', (event, _navigationUrl) => event.preventDefault());

	// https://electronjs.org/docs/tutorial/security#13-disable-or-limit-creation-of-new-windows
	contents.on('new-window', async (event, _navigationUrl) => event.preventDefault());

	// https://electronjs.org/docs/tutorial/security#16-filter-the-remote-module
	app.on('remote-get-builtin', (event, _webContents, _moduleName) => event.preventDefault());
	app.on('remote-get-global', (event, _webContents, _moduleName) => event.preventDefault());
	app.on('remote-get-current-window', (event, _webContents) => event.preventDefault());
	app.on('remote-get-current-web-contents', (event, _webContents) => event.preventDefault());
});
