/* eslint-env node */

import serverAPIFactory from './server-api.mjs';
const app = serverAPIFactory('core:server:client:logger');

import loggerFactory from './server-logger.js';

app.getExpressApp().post('/core/client/logs', async (req, res) => {
	const log = req.body;
	// log = { ts, name, category, "data[]" }

	// Parse the "data" array, wich is still a string now
	const pdata = JSON.parse(log.data);

	if (! [ 'error', 'info', 'debug'].includes(log.category)) {
		throw 'Invalid category';
	}

	// Make the call to the right logger
	loggerFactory(log.name + ':todo:client')[log.category](log.name, ...pdata);

	res.json(true);
});
