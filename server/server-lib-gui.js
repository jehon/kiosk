
// Must use require for electron (why???)
import { createRequire } from 'module';
import { LOG_CHANNEL_NAME } from '../common/config.js';
const require = createRequire(import.meta.url);
const { BrowserWindow, app: electronApp, ipcMain } = require('electron');

import { loggerAsMessageListener } from './server-client.js';

// const credentialsMap = new Map();

// /**
//  * @param {string} url - start of the url to register credentials
//  * @param {string} username of the credentials
//  * @param {string} password of the credentials
//  */
// export function registerCredentials(url, username, password) {
// 	credentialsMap.set(url, {username, password});
// }

/**
 * @returns {Promise<*>} resolved when app is ready
 */
export function whenReady() {
	return electronApp.whenReady();
}

/**
 * @param {module:server/ServerApp} serverApp for logging purpose
 */
export async function start(serverApp) {
	const logger = serverApp.childLogger('gui');
	const devMode = serverApp.getConfig('server.devMode');

	if (devMode) {
		// https://electronjs.org/docs/api/chrome-command-line-switches
		electronApp.commandLine.appendSwitch('remote-debugging-port', '9223');
		electronApp.commandLine.appendSwitch('inspect', '9222');
		logger.info('** Inspect available on port 9222');
		logger.info('** Remote debugging available on 9223');
	}

	// 	electronApp.on('login', (event, _webContents, details, _authInfo, callback) => {

	// 		// https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-login
	// 		// https://stackoverflow.com/questions/38281113/how-do-i-use-the-login-event-in-electron-framework

	// 		app.debug(`login request for ${details.url}`);
	// 		for (const url of credentialsMap.keys()) {
	// 			const v = credentialsMap.get(url);
	// 			if (details.url.startsWith(url)) {
	// 				app.debug(`Auto fill in credentials of ${details.url} for ${url} with ${v.username}`);
	// 				event.preventDefault();
	// 				callback(v.username, v.password);
	// 				break;
	// 			}
	// 		}
	// 	});

	const opts = {
		autoHideMenuBar: true,
		webPreferences: {
			titleBarStyle: 'hiddenInset',

			nodeIntegration: true,
			// TODO: affine this
			enableRemoteModule: true,
			contextIsolation: false
		},
		frame: false,
		width: 1980,
		height: 1080,
		fullscreen: true,
		kiosk: true
	};

	if (devMode) {
		opts.frame = true;
		opts.width = 1500;
		opts.height = 900;
		delete opts.fullscreen;
		delete opts.kiosk;
	}

	const win = new BrowserWindow(opts);
	const url = 'client/index.html';
	// const url = `http://localhost:${app.getConfig('.webserver.port')}/client/index.html`;

	// Enable logging
	ipcMain.on(LOG_CHANNEL_NAME, (_event, message) => loggerAsMessageListener(message));

	logger.debug(`Loading: ${url}`);
	// win.loadURL(url);
	win.loadFile(url);

	if (devMode) {
		win.webContents.openDevTools();
	}

	ipcMain.on('history', (event, context) => {
		if (!historySent.has(context)) {
			logger.debug(`Requested history for ${context}, but that is not found`);
		}
		win.webContents.send(context, historySent.get(context));
	});

	// win.webContents.on('did-finish-load', function () {
	// 	app.debug('Sending history of event');
	// 	historySent.forEach((data, eventName) => {
	// 		app.debug('Sending history of event: ', eventName, data);
	// 		win.webContents.send(eventName, data);
	// 	});
	// });

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
}

const historySent = new Map();

/**
 * @param {string} eventName to be sent
 * @param {object} data to be sent
 */
export function dispatchToBrowser(eventName, data) {
	historySent.set(eventName, data);
	if (electronApp) {
		BrowserWindow.getAllWindows().forEach(b => b.webContents.send(eventName, data));
	}
}
