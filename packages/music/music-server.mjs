
import serverAppFactory from '../../server/server-app.js';
import child_process from 'child_process';
import nodeCleanup from 'node-cleanup';

import { expressApp, expressAppListener } from '../../server/server-lib-gui-browser.js';
import { createProxyMiddleware } from '../../node_modules/http-proxy-middleware/dist/index.js';

// Thanks to https://github.com/chimurai/http-proxy-middleware#websocket
const wsProxy = createProxyMiddleware({ pathFilter: '/music/ws', target: 'ws://localhost:8800', changeOrigin: true });
expressApp.use('/music/ws', wsProxy);
expressAppListener.on('upgrade', wsProxy.upgrade);

// Serve the config for the mpd folder
expressApp.get('/externals/mpd/config.js', (req, res) =>
	res.send(`
	var CONFIG = {
		clients: [
			{
				name: 'kiosk',
				hostname: location.protocol + '//' + location.host + '/music/ws'
			}
		]
	};
	`)
);

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory('music');
const mpdLogger = app.childLogger('mpd');

export default app;

const status = {
	config: app.getConfig(),
};

const MPDServerCommand = [
	'externals/websockify/run',
	'localhost:8800',
	'localhost:6600'
];

/** @type {child_process.ChildProcess} */
let socketify = null;

/**
 *
 */
function startMPD() {
	if (!socketify) {
		mpdLogger.debug(`Lauching ${MPDServerCommand.join(' ')}`);

		socketify = child_process.spawn(
			MPDServerCommand[0],
			MPDServerCommand.slice(1),
			{
				killSignal: 'SIGKILL'
			},
			(error, stdout, stderr) => {
				app.error(`Launching ${MPDServerCommand.join(' ')} gives ${error}: ${stdout} ${stderr}`);
			}
		);

		socketify.stdout.setEncoding('utf8');
		socketify.stdout.on('data', (msg) => {
			msg.split('\n').forEach(m => mpdLogger.debug(m));
		});

		socketify.stderr.setEncoding('utf8');
		socketify.stderr.on('data', (msg) => {
			msg.split('\n').forEach(m => mpdLogger.error(m));
		});

		socketify.once('exit', () => {
			mpdLogger.debug('exited');
			socketify = null;
		});
	}
}

/**
 *
 */
function stopMPD() {
	if (socketify) {
		mpdLogger.debug('Stopping');
		mpdLogger.debug('Stopped', socketify.kill('SIGKILL'));
	}
	socketify = null;
}

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export function init() {
	stopMPD();
	startMPD();

	app.setState(status);

	return app;
}

nodeCleanup((_exitCode, _signal) => {
	stopMPD();
	// return true;
});

init();
