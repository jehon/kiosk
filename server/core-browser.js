#!/usr/bin/env node --experimental-modules

const childProcess = require('child_process');

const { serverAPIFactory } = require('./server-api.js');
const app = serverAPIFactory('core.browser');

let browserThread = false;

function start(port) {
	const devMode = app.getConfig('.console', false);
	if (browserThread) {
		throw 'Browser already launched at ' + browserThread;
	}

	// TODO:
	//
	// fixCrash() {
	// 	sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' "$1"
	// 	sed -i 's/"exit_type":"Crashed"/"exit_type":"None"/' "$1"
	// }

	// fixCrash "$HOME/.config/chromium/Default/Preferences"
	// fixCrash "$HOME/.config/chromium/Local State"

	app.debug('Launching browser');
	if (browserThread) {
		stop();
	}
	browserThread = childProcess.spawn('chromium-browser',
		(devMode ? [
			// Developper mode
			'--auto-open-devtools-for-tabs',
		]:[
			// Production mode
			'--kiosk',
		]).concat(
			[
				`http://localhost:${port}`
			]),
		{ stdio: 'pipe' });
	browserThread.on('exit', (e) => {
		app.debug('end of browser', e);
		process.exit(0);
	});
}

function stop() {
	if (!browserThread) {
		app.info('Browser was not started by us');
	} else {
		try {
			browserThread.kill();
		} catch(e) {
			app.error('Error killing browser', e);
		}
	}
	browserThread = false;
}

module.exports.start = start;
module.exports.stop = stop;
