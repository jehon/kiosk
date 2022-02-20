
import serverAppFactory from '../../server/server-app.js';
import child_process from 'child_process';
import { onClient } from '../../server/server-lib-gui.js';

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory('music');

export default app;

const status = {
	config: app.getConfig(),
};

const MPDServerCommand = 'externals/websockify/run 8800 localhost:6600 --web externals/mpd/';

/** @type {child_process.ChildProcess} */
let socketify = null;

/**
 *
 */
function startProxy() {
	if (!socketify) {
		app.debug('Lauching mpd');

		socketify = child_process.exec(
			MPDServerCommand,
			{},
			(error, stdout, stderr) => {
				app.error(`Launching ${MPDServerCommand} gives ${error}: ${stdout} ${stderr}`);
			}
		);
		socketify.on('exit', () => {
			app.debug('MPD exited');
			socketify = null;
		});
	}
}

/**
 *
 */
function stopProxy() {
	if (socketify) {
		app.debug('Stopping mpd');
		socketify.kill();
	}
}

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export function init() {
	// New behavior
	stopProxy();

	onClient(app.getChannel(), (status => {
		if (status.active) {
			startProxy();
		} else {
			stopProxy();
		}
	}));

	app.setState(status);

	return app;
}

init();
