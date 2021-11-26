
import express from 'express';
import proxy from 'express-http-proxy';

import serverAppFactory from '../../server/server-app.js';

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory('music');

export default app;

const status = {
	config: app.getConfig(),
	credentials: app.getConfig('credentials.synology')
};

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export function init() {
	app.debug('Programming music backend');

	const expressApp = express();

	expressApp.use('/', proxy('https://192.168.1.9:4001', {
		// https://www.npmjs.com/package/express-http-proxy
		proxyReqOptDecorator: function (proxyReqOpts, _originalReq) {
			proxyReqOpts.rejectUnauthorized = false;
			return proxyReqOpts;
		},
		userResHeaderDecorator(headers, _userReq, _userRes, _proxyReq, _proxyRes) {
			// recieves an Object of headers, returns an Object of headers.
			delete headers['X-FRAME-OPTIONS'];
			headers['CONTENT-SECURITY-POLICY'] = '';
			return headers;
		}
	}));

	app.debug('Starting reverse-proxy for music');
	const serverListener = expressApp.listen(9999, () => {
		status.port = serverListener.address().port;
		app.debug(`Starting reverse-proxy for music done, listening at ${status.port}`);
		app.setState(status);
	});

	app.setState(status);

	return app;
}

init();
