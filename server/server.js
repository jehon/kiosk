
const { app: electronApp } = require('electron');

const browser = require('./core-browser.js');

const { loadServerFiles } = require('./server-packages');

if (app.getConfig('core.devMode')) {
	// https://electronjs.org/docs/api/chrome-command-line-switches
}

electronApp.on('ready', () => {
	loadServerFiles()
		.then(() => browser.start());
});

// Quit when all windows are closed.
electronApp.on('window-all-closed', () => electronApp.quit());

// https://electronjs.org/docs/tutorial/security
electronApp.on('web-contents-created', (event, contents) => {
	// https://electronjs.org/docs/tutorial/security#12-disable-or-limit-navigation
	contents.on('will-navigate', (event, _navigationUrl) => event.preventDefault());

	// https://electronjs.org/docs/tutorial/security#13-disable-or-limit-creation-of-new-windows
	contents.on('new-window', async (event, _navigationUrl) => event.preventDefault());

	// https://electronjs.org/docs/tutorial/security#16-filter-the-remote-module
	electronApp.on('remote-get-builtin', (event, _webContents, _moduleName) => event.preventDefault());
	electronApp.on('remote-get-global', (event, _webContents, _moduleName) => event.preventDefault());
	electronApp.on('remote-get-current-window', (event, _webContents) => event.preventDefault());
	electronApp.on('remote-get-current-web-contents', (event, _webContents) => event.preventDefault());
});
