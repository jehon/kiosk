#!/usr/bin/node --experimental-modules

import start from './server/server.mjs';
import childProcess from 'child_process';

start().then(() => {
	console.log('Launching browser');
	const browserApp = childProcess.exec('chromium-browser http://localhost:3000');
	browserApp.stdout.pipe(process.stdout);
	browserApp.stderr.pipe(process.stderr);
	browserApp.on('exit', () => {
		console.info('end of browser');
		process.exit(0);
	});
});
