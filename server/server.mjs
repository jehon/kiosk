#!/usr/bin/node --experimental-modules

import { start as startServer } from './server-webserver.mjs';
import './server-client-logger.mjs';
import { getLoggerList }        from './server-logger.js';
import { loadServerFiles }      from './server-packages.mjs';

import serverAPIFactory from './server-api.mjs';
const app = serverAPIFactory('core:server');

export default async (port) => loadServerFiles()
	.then(() => startServer(port))
	.then((port) => {
		// Force the client to reload if it was still alive
		// but we changed the server
		// (mainly in dev, because it is not necessary in electron-like env)
		app.dispatchToBrowser('core.started', {
			startupTime: new Date()
		});
		return port;
	});

// Register some global routes
// could not be done in server-logger, because of cycle dependencies
app.getExpressApp().get('/core/loggers', async (req, res) => {
	res.json(getLoggerList());
});
