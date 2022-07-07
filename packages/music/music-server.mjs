
import serverAppFactory from '../../server/server-app.js';
import { expressApp, expressAppListener } from '../../server/server-lib-gui-browser.js';
import { createProxyMiddleware } from '../../node_modules/http-proxy-middleware/dist/index.js';

const MusicWebSocket = '/music/ws';
// Thanks to https://github.com/chimurai/http-proxy-middleware#websocket
const wsProxy = createProxyMiddleware({
	pathFilter: MusicWebSocket,
	target: 'ws://localhost:8800',
	changeOrigin: true
});
expressApp.use(MusicWebSocket, wsProxy);
expressAppListener.on('upgrade', wsProxy.upgrade);

// Serve the config for the mpd folder
expressApp.get('/externals/mpd/config.js', (req, res) =>
	res.send(`
	var CONFIG = {
		clients: [
			{
				name: 'kiosk',
				hostname: location.protocol + '//' + location.hostname + '${MusicWebSocket}'
			}
		]
	};
	`)
);

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory('music');
export default app;

const status = {
	config: app.getConfig(),
};

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export function init() {
	app.setState(status);

	return app;
}

init();
