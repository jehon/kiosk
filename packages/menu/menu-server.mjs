
import serverAppFactory from '../../server/server-app.js';

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory('menu');

export default app;

/**
 * Initialize the application
 *
 * @returns {module:server/ServerApp} the app
 */
export function init() {
	const appConfigs = app.getConfig('.', []);
	app.debug('Applications: ', appConfigs);

	app.setState(appConfigs);
	return app;
}

init();
