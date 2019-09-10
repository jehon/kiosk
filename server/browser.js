#!/usr/bin/env node --experimental-modules

import childProcess from 'child_process';

import serverAPIFactory from './server-api.mjs';
const app = serverAPIFactory('browser');
const logger = app.logger;

let browserThread = false;

export function start(port, devMode) {

	// TODO:
	//
	// fixCrash() {
	// 	sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' "$1"
	// 	sed -i 's/"exit_type":"Crashed"/"exit_type":"None"/' "$1"
	// }

	// fixCrash "$HOME/.config/chromium/Default/Preferences"
	// fixCrash "$HOME/.config/chromium/Local State"

	logger.info('Launching browser');
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
		logger.info('end of browser', e);
		process.exit(0);
	});
}

export function stop() {
	browserThread.kill();
	browserThread = false;
}
