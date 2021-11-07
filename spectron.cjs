#!/usr/bin/env node

// /node_modules/electron-chromedriver/bin/chromedriver --base-url=wd/hub --port=9515
// "electron-chromedriver": "^15.0.0",


const webdriverio = require('webdriverio');

(async function () {
	const client = await webdriverio.remote({
		host: 'localhost',
		port: 9515,
		capabilities: {
			browserName: 'chrome',
			'goog:chromeOptions': {
				binary: require('electron'),
				// binary: '.', // Path to your Electron binary.
				// args: [`app=${__dirname}` ]
				args: [__dirname]
			}
		}
	});

	console.log(client);

	// client
	// 	// .init()
	// 	// .url('http://google.com')
	// 	// .setValue('#q', 'webdriverio')
	// 	// .click('#btnG')
	// 	.getTitle().then((title) => {
	// 		console.log('Title was: ' + title);
	// 	})
	// 	.end();
})();

// // TODO? using nightwatch ? see https://github.com/nightwatchjs/nightwatch/issues/856

// const path = require('path');

// const spectron = require('spectron');
// const electron = require('electron');

// var assert = require('assert').strict;

// var appLauncher = new spectron.Application({
// 	path: electron,
// 	args: [
// 		'.',
// 		'-f', 'tests/kiosk.yml'
// 	],

// 	env: {
// 		SPECTRON: 1
// 	},

// 	chromeDriverArgs: [
// 		'--enable-logging',
// 	],

// 	chromeDriverLogPath: path.join(__dirname, 'tmp/app/spectron.log'),
// 	webdriverLogPath: path.join(__dirname, 'tmp/app/'),
// });

// const startTS = Date.now();
// console.info('***', new Date(), 'Starting');

// /**
//  * @param {...any} args to be logged
//  */
// function log(...args) {
// 	console.info('*** ', (Date.now() - startTS) / 1000, ...args);
// }

// appLauncher.start()
// 	.then(async (app) => {
// 		try {
// 			log('Started', app.isRunning());

// 			// Check if the window is visible
// 			assert.ok(await app.browserWindow.isVisible());

// 			await app.client.waitUntilWindowLoaded();

// 			const menuElement = await app.client.$('#app-menu');
// 			assert.ok((await menuElement.getSize()).height > 0, 'Menu button is visible');
// 			// await menuElement.click();

// 			// assert.ok((await app.client.$('kiosk-menu')));
// 		} catch (error) {
// 			//
// 			// Log any failures
// 			//

// 			log('Test failed', error);

// 			await app.client.getMainProcessLogs().then((logs) => console.info('*** Main: ', logs));
// 			await app.client.getRenderProcessLogs().then((logs) => console.info('*** Render: ', logs));

// 			// Rethrow to detect failure
// 			throw error;

// 		} finally {
// 			//
// 			// Stop the application
// 			//
// 			if (app.isRunning()) {
// 				log('Stopping the application');
// 				await app.stop();
// 			}

// 		}
// 	})
// 	.then(
// 		() => {
// 			//
// 			// Because we have the timeout, it would stay open if we don't exit
// 			//
// 			log('Exit with success');
// 			process.exit(0);
// 		},
// 		e => {
// 			log('Exit with error');
// 			console.error(e);
// 			process.exit(1);
// 		});
