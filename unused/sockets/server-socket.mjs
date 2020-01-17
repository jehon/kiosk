/* eslint-env node */

const fs = require('fs-extra');
const net = require('net');
const serverAPIFactory = require('./server-api.mjs');
const app = serverAPIFactory('core.socket');

let socketPath = false;

app.setConfigDefaultValue('.socket', '/var/kiosk.socket');

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
	logger.debug(`Listening for events on ${socketPath}`);
});
