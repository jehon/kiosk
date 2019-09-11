
import path from 'path';

import express from 'express';
import morgan from 'morgan';

import getConfig from './server-api-config.mjs';
import loggerFactory from './server-logger.js';
const logger = loggerFactory('core:webserver:server');

//
// SSE
//

let listener = false;
const sseSavedStates = {};
const sseClients = {};
let sseNextClientId = 0;

function sseNotifyThisClient(client, eventName, data) {
	const obj = {
		type: eventName,
		data
	};

	// client.write('id: ' + eventId + '\n');
	// client.write('event: ' + eventName + '\n');
	client.write('data: ' + JSON.stringify(obj) + '\n\n');
}

//
// Server with static's
//

const app = express();

app.on('error', e => logger.error('Error starting server: ', e));

// Handle POST data correctly
// See https://stackoverflow.com/a/54546000/1954789
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (getConfig('core.trace', false)) {
	// http://expressjs.com/en/resources/middleware/morgan.html
	app.use(morgan('dev'));
}

export const priorityMiddleware = express.Router();
app.use('/', priorityMiddleware);

// Index is in client
app.get('/',              (req, res) => res.status(301).redirect('/client/index.html'));

// Statis routes
app.use('/favicon.svg',   express.static(path.join(getConfig('core.root'), 'client', 'favicon.svg')));
app.use('/client/',       express.static(path.join(getConfig('core.root'), 'client')));
app.use('/common/',       express.static(path.join(getConfig('core.root'), 'common')));
app.use('/packages/',     express.static(path.join(getConfig('core.root'), 'packages')));
app.use('/node_modules/', express.static(path.join(getConfig('core.root'), 'node_modules')));
app.use('/tests/',        express.static(path.join(getConfig('core.root'), 'tests')));
app.use('/media/',        express.static(path.join(getConfig('core.root'), 'media')));

app.use('/dynamic/',      express.static(path.join(getConfig('core.root'), 'dynamic')));

// SSE
app.use('/core/events', function (req, res, _next) {
	var clientId = sseNextClientId++;
	sseClients[clientId] = res;

	req.socket.setTimeout(0); // '0' means 'no timeout'

	req.on('close', function () {
		delete sseClients[clientId];
	});

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

export async function start(port = getConfig('core.port')) {
	return new Promise(resolve => {
		listener = app.listen(port, () => {
			const realPort = getPort();
			logger.info(`Listening on port ${realPort}!`);
			dispatchToBrowser('core.started', {
				startupTime: new Date()
			});
			resolve(realPort);
		});
	});
}

export function getPort() {
	return listener.address().port;
}

export function stop() {
	listener.close();
}

export const getExpressApp = function() { return app; };

export function dispatchToBrowser(eventName, data = null) {
	sseSavedStates[eventName] = data;
	logger.debug('Sending', eventName, data);

	for(const k of Object.keys(sseClients)) {
		sseNotifyThisClient(sseClients[k], eventName, data);
	}
}
