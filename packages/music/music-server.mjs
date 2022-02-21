
import serverAppFactory from '../../server/server-app.js';
import child_process from 'child_process';
import nodeCleanup from 'node-cleanup';

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
	// New behavior
	stopMPD();

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

nodeCleanup((_exitCode, _signal) => {
	stopMPD();
	// return true;
});

init();
