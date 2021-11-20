
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
	app.setState(status);
	return app;
}

init();
