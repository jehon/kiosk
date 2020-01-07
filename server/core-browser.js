
const { BrowserWindow } = require('electron');

const serverAPIFactory = require('./server-api.js');
const serverApp = serverAPIFactory('core.browser');

const devMode = serverApp.getConfig('.console', false);

module.exports.start = async function(port) {
	// Keep a global reference of the window object, if you don't, the window will
	// be closed automatically when the JavaScript object is garbage collected.
	let win;

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

	// Create the browser window.
	win = new BrowserWindow(opts);

	// and load the index.html of the app.
	win.loadFile('client/index.html');
	// win.loadURL(`http://localhost:${port}`);

	// Open the DevTools.
	if (devMode) {
		win.webContents.openDevTools();
	}

	// Emitted when the window is closed.
	win.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		win = null;
	});
};
