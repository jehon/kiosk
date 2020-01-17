
const { app: electronApp, BrowserWindow } = require('electron');

const logger = require('./server-logger.js')('core:browser');
const devMode = require('./server-config.js')('core.devMode', false);

let win;

const credentialsMap = new Map();

electronApp.on('login', (event, webContents, details, authInfo, callback) => {

	// https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-login
	// https://stackoverflow.com/questions/38281113/how-do-i-use-the-login-event-in-electron-framework

	logger.debug(`login request for ${details.url}`);
	for(const url of credentialsMap.keys()) {
		const v = credentialsMap.get(url);
		if (details.url.startsWith(url)) {
			logger.debug(`Auto fill in credentials of ${details.url} for ${url} with ${v.username}`);
			event.preventDefault();
			callback(v.username, v.password);
			break;
		}
	}
});

module.exports.registerCredentials = function(url, data) {
	logger.debug(`Registering credentials for ${data.username}@${url}: #${data.password.length} characters`);
	credentialsMap.set(url, data);
};

module.exports.start = async function() {
	const opts = {
		autoHideMenuBar: true,
		webPreferences: {
			nodeIntegration: true,
			titleBarStyle: 'hiddenInset'
		},
		frame: false
	};
	opts.width = 1980;
	opts.height = 1080;

	if (devMode) {
		true;
	} else {
		// opts.fullscreen = true;
		// opts.kiosk = true; // #
	}

	win = new BrowserWindow(opts);
	// win.loadFile('client/index.html');
	win.loadURL('http://localhost:1234/client/index.html');

	if (devMode) {
		win.webContents.openDevTools();
	}

	win.on('closed', () => {
		win = null;
	});
};

function dispatchToBrowser(eventName) {
	logger.debug(`Sending '${eventName}'`);

	if (win) {
		win.webContents.send(eventName);
	}
}
module.exports.dispatchToBrowser = dispatchToBrowser;
