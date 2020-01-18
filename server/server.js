
const { app: electronApp } = require('electron');
const app = require('./server-api.js')('server');

const browser = require('./server-launch-browser.js');
const webServer = require('./server-webserver.js');

const { loadServerFiles } = require('./server-packages');

const devMode = app.getConfig('core.devMode');

if (devMode) {
	// https://electronjs.org/docs/api/chrome-command-line-switches
	electronApp.commandLine.appendSwitch('remote-debugging-port', '9223');
	electronApp.commandLine.appendSwitch('inspect', '9222');
	app.info('** Inspect available on port 9222: http://localhost:9222/');
	app.info('** Remote debugging available on port http://localhost:9223/');
}

electronApp.on('ready', () => {
	webServer.start()
		.then(() => loadServerFiles())
		.then(() => browser.start())
	;
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
	electronApp.on('remote-get-global', (event, _webContents, _moduleName) => event.preventDefault());
	electronApp.on('remote-get-current-window', (event, _webContents) => event.preventDefault());
	electronApp.on('remote-get-current-web-contents', (event, _webContents) => event.preventDefault());
	if (!devMode) {
		electronApp.on('remote-get-builtin', (event, _webContents, _moduleName) => event.preventDefault());
	}
});
