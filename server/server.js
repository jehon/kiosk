#!/usr/bin/env node

const { start: startServer }                    = require('./server-webserver.js');
const { getLoggerList, getEnabledDebugRegexp }  = require('./server-logger.js');
const { loadServerFiles }                       = require('./server-packages.js');
const { serverAPIFactory }                      = require('./server-api.js');
const app = serverAPIFactory('core:server');

const startFullStack = async (port) => loadServerFiles()
	.then(() => startServer(port))
	.then((port) => {
		// Force the client to reload if it was still alive
		// but we changed the server
		// (mainly in dev, because it is not necessary in electron-like env)
		app.dispatchToBrowser('core.started', {
			startupTime: new Date()
		});
		app.dispatchToBrowser('core.loggersRegexp', getEnabledDebugRegexp());

		return port;
	});

// Register some global routes
// could not be done in server-logger, because of cycle dependencies
app.getExpressApp().get('/core/loggers', async (req, res) => {
	res.json(getLoggerList());
});

app.getExpressApp().get('/core/state', async (req, res) => {
	res.json(serverAPIFactory.getSavedState());
});

module.exports = startFullStack;
