
const { BrowserWindow } = require('electron');

const logger = require('./server-logger.js')('core:browser');
const devMode = require('./server-config.js')('core.devMode', false);

let win;

module.exports.start = async function() {
	const opts = {
		autoHideMenuBar: true,
		webPreferences: {
			nodeIntegration: true
		},
	};

	if (devMode) {
		opts.width = 1200;
		opts.height = 800;
	} else {
		opts.fullscreen = true;
		opts.kiosk = true;
	}

	win = new BrowserWindow(opts);
	win.loadFile('client/index.html');

	// Open the DevTools.
	if (devMode) {
		win.webContents.openDevTools();
	}

	win.on('closed', () => {
		win = null;
	});
};

function dispatchToBrowser(eventName, data = null) {
	logger.debug(`Sending '${eventName}'`, data);

	if (win) {
		win.webContents.send(eventName, data);
	}
}
module.exports.dispatchToBrowser = dispatchToBrowser;
