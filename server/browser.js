#!/usr/bin/env node --experimental-modules

import childProcess from 'child_process';

import serverAPIFactory from './server-api.mjs';
const serverAPI = serverAPIFactory('browser');
const logger = serverAPI.logger;

let browserThread = false;

export function start(port, kioskMode = true) {
	logger.info('Launching browser');
	if (browserThread) {
		stop();
	}
	browserThread = childProcess.spawn('chromium-browser',
		(kioskMode ? [
			// Production mode
			'--kiosk',
		]: [
			// Developper mode
			'--auto-open-devtools-for-tabs',
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
