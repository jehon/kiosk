#!/usr/bin/env node

const path = require('path');

const spectron = require('spectron');
const electron = require('electron');

var assert = require('assert');

var appLauncher = new spectron.Application({
	path: electron,
	args: [
		path.join(__dirname, 'main.cjs'),
		'--spectron-testing'
	],

	chromeDriverLogPath: path.join(__dirname, 'tmp/spectron.log'),

	startTimeout: 30 * 1000,

	env: {
		SPECTRON: 1
	},

	// chromeDriverArgs: [
	// 	'--enable-logging',
	// 	'--no-sandbox',
	// 	'--disable-dev-shm-usage'
	// ],

	connectionRetryCount: 10,
});

// No need to go further...
setTimeout(() => {
	console.info('***', new Date(), 'Killing');
	process.exit(1);
}, 90 * 1000);

const startTS = Date.now();
console.info('***', new Date(), 'Starting');

let app;

appLauncher.start()
	.then(function (_app) {
		app = _app;
		console.info('*** ', (Date.now() - startTS) / 1000, 'Started', app.isRunning());

		// Check if the window is visible
		return app.browserWindow.isVisible();
	})
	.then(function (isVisible) {
		console.info('*** ', (Date.now() - startTS) / 1000, 'isVisible ?', isVisible);
		// Verify the window is visible
		assert.equal(isVisible, true);
	})
	.catch(async function (error) {
		// Log any failures
		console.error('*** ', (Date.now() - startTS) / 1000, 'Test failed', error);
		if (!app) {
			throw 'No app found';
		}
		return Promise.all([
			app.client.getMainProcessLogs()
				.then(function (logs) {
					// logs.forEach(function (log) {
					console.info('*** Main: ', logs);
					// })
				}),
			app.client.getRenderProcessLogs()
				.then(function (logs) {
					// logs.forEach(function (log) {
					console.info('*** Render: ', logs);
					// })
				}),
		]).then(() => { throw 'In error'; });
	})
	.finally(() => {
		// Stop the application
		if (appLauncher && appLauncher.isRunning()) {
			console.info('*** ', (Date.now() - startTS) / 1000, 'Stopping');
			return appLauncher.stop();
		}
	})
	.then(() => {
		console.info('Done done done');
		process.exit(0);
	})
	.catch(e => {
		console.error(e);
		process.exit(1);
	});
