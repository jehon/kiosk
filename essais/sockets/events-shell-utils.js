/* eslint-env node */

const net = require('net');
require('./events-server-config.js');
const socketForEventsPath = require('../config/config-server-utils.js').getConfig('server.events.socket');

module.exports.sendMessageToBrowser = function (origin, type, value = null, info = null) {
	var stream = net.connect(socketForEventsPath, () => {
		stream.write(JSON.stringify({
			timestamp: new Date(),
			origin,
			type,
			value,
			info
		}), () => {
			stream.end();
			stream.destroy();
		});
	});
};
