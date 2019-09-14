
import loggerFactory from './server-logger.js';
const logger = loggerFactory('core:client-dispatch:server');

import { getExpressApp } from './server-webserver.mjs';
const expressApp = getExpressApp();

const sseSavedStates = {};
const sseClients = {};
let sseNextClientId = 0;

function sseNotifyThisClient(client, eventName, data) {
	const obj = {
		type: eventName,
		data
	};

	client.write('data: ' + JSON.stringify(obj) + '\n\n');
}

expressApp.use('/core/events', function (req, res, _next) {
	var clientId = sseNextClientId++;
	sseClients[clientId] = res;

	req.socket.setTimeout(0); // '0' means 'no timeout'

	req.on('close', function () {
		delete sseClients[clientId];
	});

	// Not automatically setting header?
	// -> That allow opening the stream as text for debug
	if (req.headers.accept == 'text/event-stream') {
		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		});
	}

	res.write('\n', 'utf-8'); // 'flush' output buffer

	for(const k of Object.keys(sseSavedStates)) {
		sseNotifyThisClient(res, k, sseSavedStates[k]);
	}
});

export default function dispatchToBrowser(eventName, data = null) {
	if (data) {
		sseSavedStates[eventName] = data;
	}
	logger.debug(`Sending '${eventName}'`, data);

	for(const k of Object.keys(sseClients)) {
		sseNotifyThisClient(sseClients[k], eventName, data);
	}
}

expressApp.use('/core/browser-state', function (req, res, _next) {
	return res.json(sseSavedStates);
});
