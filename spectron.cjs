
const path = require('path');

var Application = require('spectron').Application;
var assert = require('assert');

var app = new Application({
	path: path.join(__dirname, 'node_modules/electron/dist/electron'),
	args: [path.join(__dirname, 'main.cjs')],

	chromeDriverArgs: [
		'--no-sandbox',
		'--whitelisted-ips=',
		'--disable-dev-shm-usage'
	]
});

app.start().then(function () {
	// Check if the window is visible
	return app.browserWindow.isVisible();
}).then(function (isVisible) {
	// Verify the window is visible
	assert.equal(isVisible, true);
}).then(function () {
	// Get the window's title
	return app.client.getTitle();
}).then(function (title) {
	// Verify the window's title
	assert.equal(title, 'My App');
}).then(function () {
	// Stop the application
	return app.stop();
}).catch(function (error) {
	// Log any failures
	console.error('Test failed', error.message);
});
