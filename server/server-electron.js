
const { app: electronApp, BrowserWindow } = require('electron');
const electron = require('electron');

const logger = require('./server-logger.js')('server:browser');
const getConfig = require('./server-config.js');
const devMode = getConfig('server.devMode', false);

const credentialsMap = new Map();

if (electronApp) {
	electronApp.on('login', (event, _webContents, details, _authInfo, callback) => {

		// https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-login
		// https://stackoverflow.com/questions/38281113/how-do-i-use-the-login-event-in-electron-framework

		logger.debug(`login request for ${details.url}`);
		for (const url of credentialsMap.keys()) {
			const v = credentialsMap.get(url);
			if (details.url.startsWith(url)) {
				logger.debug(`Auto fill in credentials of ${details.url} for ${url} with ${v.username}`);
				event.preventDefault();
				callback(v.username, v.password);
				break;
			}
		}
	});
}

module.exports.registerCredentials = function (url, data) {
	logger.debug(`Registering credentials for ${data.username}@${url}: #${data.password.length} characters`);
	credentialsMap.set(url, data);
};

module.exports.start = async function () {
	const opts = {
		autoHideMenuBar: true,
		webPreferences: {
			titleBarStyle: 'hiddenInset',
			nodeIntegration: true,
			enableRemoteModule: true,
		},
		frame: false,
		width: 1980,
		height: 1080
		//fullscreen: true,
		//kiosk: true
	};

	if (devMode) {
		opts.width = 1000;
		opts.height = 900;
	} else {
		true;
	}

	const win = new BrowserWindow(opts);
	// win.loadFile('client/index.html');
	const url = `http://localhost:${getConfig('server.webserver.port')}/client/index.html`;
	logger.debug(`Loading url: ${url}`);
	win.loadURL(url);

	if (devMode) {
		win.webContents.openDevTools();
	}
};

/**
 * @param {string} eventName to be sent
 */
function dispatchToBrowser(eventName) {
	logger.debug(`Sending '${eventName}'`);
	BrowserWindow.getAllWindows().forEach(b => b.webContents.send(eventName));
}
module.exports.dispatchToBrowser = dispatchToBrowser;

/**
 * @param eventName
 * @param cb
 */
function registerFunction(eventName, cb) {
	electron.ipcMain.handle(eventName, cb);
}
module.exports.registerFunction = registerFunction;