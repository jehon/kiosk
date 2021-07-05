
import serverAppFactory from '../../server/server-app.js';
import { spawn } from 'child_process';

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory('caffeine');

export default app;

/**
 * Wake up the system
 *
 * @returns {Promise<void>} the promise that will resolve on run execution success
 */
export async function wakeUp() {
	app.debug('Starting wakeup');

	// Handle return code and errors
	return new Promise((resolve, reject) => {
		const cp = spawn('/usr/bin/xdotool',
			['mousemove_relative', '1', '1', 'mousemove_relative', '--', '-1', '-1'],
			{
				stdio: ['ignore', 'inherit', 'inherit'],
				env: {
					'DISPLAY': ':0'
				}
			});

		app.debug('Running wakeup', cp.spawnfile, cp.spawnargs);

		cp.on('error', err => {
			app.error('Launch error returned: ', err);
			app.setState({
				lastRun: new Date(),
				errorType: 'launch error',
				error: -1
			});
			return reject(-1);
		});
		cp.on('exit', (code) => {
			if (code == 0) {
				app.setState({
					lastRun: new Date(),
					errorType: false,
					error: false
				});
				return resolve();
			}
			cp.stderr?.setEncoding('UTF8');
			cp.stdout?.setEncoding('UTF8');
			app.error(`Return code non-zero: ${code}# stderr: `, cp.stderr?.read() ?? '');
			app.setState({
				lastRun: new Date(),
				errorType: 'return code',
				error: code
			});
			return reject(code);
		});
	});
}

app.wakeUpTimeInterval = app.addTimeInterval(wakeUp);

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export function init() {
	app.setState({
		lastRun: null,
		errorType: false,
		error: false,
		config: app.getConfig()
	});

	const config = {
		inactivitySeconds: 120,
		simulateActivityMinutes: 5,
		...app.getConfig()
	};

	app.debug('Programming every minutes: ', config.simulateActivityMinutes);
	app.wakeUpTimeInterval.start();
	app.wakeUpTimeInterval.run();
	app.wakeUpTimeInterval.setISecs(config.simulateActivityMinutes * 60);

	return app;
}

init();
