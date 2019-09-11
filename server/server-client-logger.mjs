/* eslint-env node */

import serverAPIFactory from './server-api.mjs';
const app = serverAPIFactory('server-client-logger');

import loggerFactory from './server-logger.js';

const clientLogger = loggerFactory('server:client');

app.getExpressApp().post('/core/client/logs', async (req, res) => {
	const log = req.body;
	// log = { ts, name, category, "data[]" }

	// Parse the "data" array, wich is still a string now
	const pdata = JSON.parse(log.data);

	if (! [ 'error', 'info', 'debug'].includes(log.category)) {
		throw 'Invalid category';
	}

	// Set dynamically the module name
	clientLogger.setNamespace(log.name.split('.').join(':') + ':client');

	// Call the logger
	clientLogger[log.category](log.name, ...pdata);

	res.json(true);
});
