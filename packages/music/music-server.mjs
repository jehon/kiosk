
import serverAppFactory from '../../server/server-app.js';
import child_process from 'child_process';

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory('music');

export default app;

const status = {
	config: app.getConfig(),
};

const MPDServerCommand = 'externals/websockify/run 8800 localhost:6600';

/** @type {child_process.ChildProcess} */
let socketify = null;

/**
 *
 */
function startMPD() {
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

// /**
//  *
//  */
// function stopMPD() {
// 	if (socketify) {
// 		app.debug('Stopping mpd');
// 		socketify.kill();
// 	}
// }

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export function init() {
	// New behavior
	// stopMPD();

	// onClient(app.getChannel(), (status => {
	// if (status.active) {
	// 	startMPD();
	// } else {
	// 	stopMPD();
	// }
	// }));

	startMPD();

	app.setState(status);

	return app;
}

init();
