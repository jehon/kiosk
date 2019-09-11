#!/usr/bin/env node --experimental-modules

import childProcess from 'child_process';

import serverAPIFactory from './server-api.mjs';
const app = serverAPIFactory('core.browser');

let browserThread = false;

export function start(port) {
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

export function stop() {
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
