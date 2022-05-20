
// Must use require for electron (why???)
import { createRequire } from 'module';
import { Logger } from '../common/logger.js';
const require = createRequire(import.meta.url);
const { BrowserWindow, BrowserView, app: electronApp, ipcMain } = require('electron');

export let mainWindow;

/**
 * @param {boolean} devMode to enable de
 */
export async function guiPrepare(devMode) {

	await electronApp.whenReady();

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

	mainWindow = new BrowserWindow(opts);

	// in your main process, having Electron's `app` imported
	electronApp.on('certificate-error', (event, webContents, url, error, cert, callback) => {
		// // Do some verification based on the URL to not allow potentially malicious certs:
		// if (url.startsWith('https://yourdomain.tld')) {
		// 	// Hint: For more security, you may actually perform some checks against
		// 	// the passed certificate (parameter "cert") right here

		event.preventDefault(); // Stop Chromium from rejecting the certificate
		callback(true);         // Trust this certificate
		// } else callback(false);     // Let Chromium do its thing
	});

	// Quit when all windows are closed.
	electronApp.on('window-all-closed', () => electronApp.quit());

	// https://electronjs.org/docs/tutorial/security
	electronApp.on('web-contents-created', (event, contents) => {

		// https://electronjs.org/docs/tutorial/security#12-disable-or-limit-navigation
		contents.on('will-navigate', (event, _navigationUrl) => event.preventDefault());

		// // https://electronjs.org/docs/tutorial/security#13-disable-or-limit-creation-of-new-windows
		// contents.on('new-window', async (event, _navigationUrl) => event.preventDefault());

		// https://electronjs.org/docs/tutorial/security#16-filter-the-remote-module
		electronApp.on('remote-get-global', (event, _webContents, _moduleName) => event.preventDefault());
		electronApp.on('remote-get-current-window', (event, _webContents) => event.preventDefault());
		electronApp.on('remote-get-current-web-contents', (event, _webContents) => event.preventDefault());
		if (!devMode) {
			electronApp.on('remote-get-builtin', (event, _webContents, _moduleName) => event.preventDefault());
		}
	});
}

/**
 * @param {Logger} logger to log debug
 * @param {boolean} devMode to enable de
 * @param {string} url to be loaded
 */
export async function guiLaunch(logger, devMode, url) {

	logger.debug(`Loading: ${url}`);
	// win.loadURL(url);
	mainWindow.loadFile(url);

	if (devMode) {
		// See https://github.com/electron/electron/issues/20069
		logger.debug('Opening dev tools');
		const devtools = new BrowserWindow();
		mainWindow.webContents.setDevToolsWebContents(devtools.webContents);
		mainWindow.webContents.openDevTools({ mode: 'detach' });
	}
}

const historySent = new Map();

/**
 * @param {string} eventName to be sent
 * @param {object} data to be sent
 */
export function guiDispatchToBrowser(eventName, data) {
	historySent.set(eventName, data);
	if (electronApp) {
		BrowserWindow.getAllWindows().forEach(b => b.webContents.send(eventName, data));
	}
}

/**
 * @param {string} channel to listen to
 * @param {function(any):void} cb with message
 */
export function guiOnClient(channel, cb) {
	ipcMain.on(channel, (_event, message) => cb(message));
}

/**
 * @param {string} url to be loaded
 * @param {string} script to be executed
 * @returns {import('electron').WebContents} loaded
 * @see https://www.electronjs.org/docs/latest/api/browser-view
 */
export function guiCreateClientView(url, script) {
	const [ww, wh] = mainWindow.getContentSize();

	// return new Promise((resolve) => {
	const view = new BrowserView({
		kiosk: true,
		parent: mainWindow,
	});
	mainWindow.setBrowserView(view);
	view.setBounds({ x: 50, y: 50, width: ww - 60, height: wh - 60 });
	view.webContents.loadURL(url);
	view.webContents.on('did-finish-load', () => {
		if (script) {
			view.webContents.executeJavaScript(script);
		}
	});

	return view.webContents;
}