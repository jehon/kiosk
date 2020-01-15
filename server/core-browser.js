
const { BrowserWindow } = require('electron');

const logger = require('./server-logger.js')('core:browser');
const devMode = require('./server-config.js')('core.devMode', false);

let win;

module.exports.start = async function() {
	const opts = {
		// autoHideMenuBar: true,
		webPreferences: {
			nodeIntegration: true,
			// titleBarStyle: 'hiddenInset' // #
		},
		// frame: false
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
	win.loadFile('client/index.html');

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
