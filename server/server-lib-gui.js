
// Must use require for electron (why???)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { BrowserWindow, app: electronApp, ipcMain } = require('electron');

import { LoggerSender } from '../common/logger-sender.js';
import { loggerAsMessageListener } from './server-lib-logger.js';
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
	const app = serverApp.extend('gui');
	const devMode = app.getConfig('server.devMode');

	if (devMode) {
		// https://electronjs.org/docs/api/chrome-command-line-switches
		electronApp.commandLine.appendSwitch('remote-debugging-port', '9223');
		electronApp.commandLine.appendSwitch('inspect', '9222');
		app.info('** Inspect available on port 9222: http://localhost:9222/');
		app.info('** Remote debugging available on port http://localhost:9223/');
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
			// contextIsolation: true
		},
		frame: false,
		width: 1980,
		height: 1080
		//fullscreen: true,
		//kiosk: true
	};

	if (devMode) {
		opts.width = 1500;
		opts.height = 900;
	} else {
		true;
	}

	const win = new BrowserWindow(opts);
	const url = 'client/index.html';
	// const url = `http://localhost:${app.getConfig('.webserver.port')}/client/index.html`;

	// Enable logging
	ipcMain.on(LoggerSender.CHANNEL_NAME, (_event, message) => loggerAsMessageListener(message));

	app.debug(`Loading: ${url}`);
	// win.loadURL(url);
	win.loadFile(url);

	if (devMode) {
		win.webContents.openDevTools();
	}

	win.on('did-finish-load', function () {
		historySent.forEach((data, eventName) => {
			win.webContents.send(eventName, data);
		});
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

// /**
//  * @param eventName
//  * @param cb
//  */
// export function registerFunction(eventName, cb) {
// 	electron.ipcMain.handle(eventName, cb);
// }

// /**
//  * @param name
//  * @param category
//  * @param data
//  */
// function fromRemote(name, category, data) {
// 	if (!['error', 'info', 'debug'].includes(category)) {
// 		throw 'Invalid category';
// 	}

// 	// Make the call to the right logger
// 	loggerFactory(name + ':client')[category](name, ...data);
// }
