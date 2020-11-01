
import serverAppFactory from '../../server/server-app.mjs';

/**
 * @typedef { import('../../server/server-app.mjs').ServerApp } ServerApp
 */

/**
 * @type {ServerApp}
 */
const app = serverAppFactory('menu');

export default app;

/**
 * Initialize the application
 *
 * @returns {ServerApp} the app
 */
export function init() {
	const appConfigs = app.getConfig('.', []);
	app.debug('Applications: ', appConfigs);

	app.setState(appConfigs);
	return app;
}

init();
