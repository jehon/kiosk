/* eslint-env node */

// import getConfig from './server-api-config.mjs';
import { getExpressApp } from './server-api-webserver.mjs';
import loggerAPI from '../common/logger.js';
const logger = loggerAPI('server-client-logger');

// Register route on URL
const app = getExpressApp();
app.post('/core/client/logs', async (req, res) => {
	const data = req.body;
	// data = { ts, name, category, data[] }

	logger.info('client/logs', data);
	res.json(true);
});
