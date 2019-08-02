#!/usr/bin/env node --experimental-modules

import childProcess from 'child_process';

import serverAPIFactory from './server-api.mjs';
const serverAPI = serverAPIFactory('browser');
const logger = serverAPI.logger;

let browserThread = false;

export function start(port) {
	logger.info('Launching browser');
	if (browserThread) {
		stop();
	}
	browserThread = childProcess.spawn('chromium-browser', [ `http://localhost:${port}` ], { stdio: 'pipe' });
	browserThread.on('exit', () => {
		logger.info('end of browser');
		process.exit(0);
	});
}

export function stop() {
	browserThread.kill();
	browserThread = false;
}
