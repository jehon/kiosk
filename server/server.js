
const { app: electronApp } = require('electron');
const app = require('./server-api')('server');

const browser = require('./server-electron');
const webServer = require('./server-webserver');

const devMode = app.getConfig('server.devMode');

if (devMode) {
	// https://electronjs.org/docs/api/chrome-command-line-switches
	electronApp.commandLine.appendSwitch('remote-debugging-port', '9223');
	electronApp.commandLine.appendSwitch('inspect', '9222');
	app.info('** Inspect available on port 9222: http://localhost:9222/');
	app.info('** Remote debugging available on port http://localhost:9223/');
}

/**
 * @param {string} name of the package
 */
async function loadPackage(name) {
	try {
		require(`../packages/${name}/${name}-server.js`);
	} catch(err) {
		// TODO: transform into logger !
		console.error(`Error loading ${name}: `, err);
	}
}

electronApp.on('ready', () => {
	webServer.start()
		.then(() => loadPackage('caffeine'))
		.then(() => loadPackage('camera'))
		.then(() => loadPackage('clock'))
		.then(() => loadPackage('menu'))
		.then(() => loadPackage('photo-frame'))
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
