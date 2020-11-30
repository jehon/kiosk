#!/usr/bin/env node

const path = require('path');

const spectron = require('spectron');
const electron = require('electron');

var assert = require('assert');

var appLauncher = new spectron.Application({
	path: electron,
	args: [
		'.',
		'-f', 'tests/kiosk.yml'
	],

	chromeDriverLogPath: path.join(__dirname, 'tmp/app/spectron.log'),
	webdriverLogPath: path.join(__dirname, 'tmp/app/'),

	connectionRetryTimeout: 30 * 1000,
	startTimeout: 30 * 1000,
	connectionRetryCount: 3,

	env: {
		SPECTRON: 1
	},

	chromeDriverArgs: [
		'--enable-logging',
	],
});

// setTimeout(() => {
// 	//
// 	// We timebox the testing to not consume too much time
// 	//
// 	console.info('***', new Date(), 'Killing');
// 	process.exit(1);
// }, 90 * 1000);

const startTS = Date.now();
console.info('***', new Date(), 'Starting');

/**
 * @param {...any} args to be logged
 */
function log(...args) {
	console.info('*** ', (Date.now() - startTS) / 1000, ...args);
}

let app;

appLauncher.start()
	.then(function (_app) {
		app = _app;
		log('Started', app.isRunning());

		// Check if the window is visible
		return app.browserWindow.isVisible()
			.then(function (isVisible) {
				log('isVisible ?', isVisible);
				// Verify the window is visible
				assert.equal(isVisible, true);
			});
	})
	.catch(async function (error) {
		//
		// Log any failures
		//

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
		//
		// Stop the application
		//

		if (appLauncher && appLauncher.isRunning()) {
			log('Stopping');
			return appLauncher.stop();
		}
	})
	// .then(() => {
	//   //
	//   // Because we have the timeout, it would stay open if we don't exit
	//   //
	//
	// 	console.info('Done, let\'s exit before waiting for timeout');
	// 	process.exit(0);
	// })
	.catch(e => {
		console.error(e);
		process.exit(1);
	});
