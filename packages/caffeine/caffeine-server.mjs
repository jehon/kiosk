
import serverAppFactory from '../../server/server-app.mjs';
import { spawn } from 'child_process';

/**
 * @typedef { import('../../server/server-app.mjs').ServerApp } ServerApp
 */

/**
 * @type {ServerApp}
 */
const app = serverAppFactory('caffeine');

export default app;

/**
 * Wake up the system
 *
 * @returns {Promise<void>} the promise that will resolve on run execution success
 */
export async function wakeUp() {
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
		cp.on('error', err => {
			app.error('Caffeine launch error returned: ', err);
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
			app.error(`Caffeine return code non-zero: ${code}# stderr: `, cp.stderr?.read() ?? '');
			app.setState({
				lastRun: new Date(),
				errorType: 'return code',
				error: code
			});
			return reject(code);
		});
	});
}

/**
 * Initialize the package
 *
 * @returns {ServerApp} the app
 */
export function init() {
	app.setState({
		lastRun: null,
		errorType: false,
		error: false
	});

	const config = {
		cron: '* 6-22 * * *',
		user: 'pi',
		...app.getConfig()
	};

	app.debug('Programming caffeine cron\'s ');
	app.cron(wakeUp, config.cron);
	return app;
}

init();
