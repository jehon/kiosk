/* eslint-env node */

const fs = require('fs-extra');
const net = require('net');
const serverAPIFn = require('./server-api.mjs');
const serverAPI = serverAPIFn('core.socket');

let socketPath = false;

serverAPI.setConfigDefaultValue('.socket', '/var/kiosk.socket');

// Pipe to receive notifications from the OS
try {
	// Clean up previous pipe
	fs.unlinkSync(socketPath);
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
		buffer = Buffer.alloc(0);
	});
});

socketForEvents.listen(socketPath, () => {
	console.info(`Listening for events on ${socketPath}`);
});
