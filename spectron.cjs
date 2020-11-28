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

	chromeDriverLogPath: path.join(__dirname, "tmp/spectron.log"),

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

console.log(new Date(), "Starting");

let app;

appLauncher.start()
	.then(function (_app) {
		app = _app;
		console.log("Started", app.isRunning());

		// Check if the window is visible
		return app.browserWindow.isVisible();
	})
	.then(function (isVisible) {
		console.log("*** isVisible", isVisible);
		// Verify the window is visible
		assert.equal(isVisible, true);
	})
	.catch(async function (error) {
		// Log any failures
		console.error(new Date());
		console.error('*** Test failed', error.message);
		if (!app) {
			throw 'No app found';
		}
		return Promise.all([
			app.client.getMainProcessLogs()
				.then(function (logs) {
					// logs.forEach(function (log) {
					console.log("*** Main: ", logs);
					// })
				}),
			app.client.getRenderProcessLogs()
				.then(function (logs) {
					// logs.forEach(function (log) {
					console.log("*** Render: ", logs);
					// })
				}),
		]).then(() => { throw 'In error'; })
	})
	.finally(() => {
		// Stop the application
		if (appLauncher && appLauncher.isRunning()) {
			console.log("*** Stopping");
			return appLauncher.stop();
		}
	})
	.catch(e => {
		console.error(e);
		process.exit(1);
	})
