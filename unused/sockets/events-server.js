/* eslint-env node */

const fs = require('fs-extra');
const net = require('net');
const pushEvents = require('sse-pusher')();
var deepEqual = require('deep-equal');
const { getConfig } = require('../config/config-server-utils.js');

// Configs
require('./events-server-config.js');
const socketForEventsPath = getConfig('server.events.socket');

// Pipe to receive notifications from the OS
try {
	// Clean up previous pipe
	fs.unlinkSync(socketForEventsPath);
} catch(_e) {
	//
}

// Listen for events
var socketForEvents = net.createServer((stream) => {
	let buffer = Buffer.alloc(0);
	stream.on('data', function(c) {
		buffer = Buffer.concat([ buffer, c ]);
	});
	stream.on('end', function() {
		logger.debug('sending event [external]: ', buffer.toString());
		pushEvents(buffer.toString());
		buffer = Buffer.alloc(0);
	});
});

function sendEvent(origin, type, value = {}, info = {}) {
	logger.debug('sending event [internal]: ', origin, type);
	pushEvents(JSON.stringify({
		timestamp: new Date(),
		origin: origin,
		type: type,
		value: value,
		info: info
	}));
}

socketForEvents.listen(socketForEventsPath, () => {
	logger.debug(`Listening for events on ${socketForEventsPath}`);
});

module.exports = function(app) {
	app.use('/events', pushEvents.handler());
};

module.exports.sendEventToBrowser = sendEvent;

const stateDict = {};
module.exports.setState = function(name, data) {
	if (!(name in stateDict) || !deepEqual(stateDict[name], data)) {
		stateDict[name] = data;
		sendEvent(name, data);
	}
};
