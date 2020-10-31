
import serverAppFactory from '../../server/server-app.mjs';

const app = serverAppFactory('menu');

/** @typedef { import('../../server/server-app.mjs').ServerApp } ServerApp */

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

export default app;

init();
