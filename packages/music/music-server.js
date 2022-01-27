
import serverAppFactory from '../../server/server-app.js';

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory('music');
export default app;

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export async function init() {
    app.setState({
    });

    return app;
}

init();
