
import serverAppFactory from '../../server/server-app.js';
import { TriStates } from './constants.js';

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory('camera');
export default app;

import cameraGeneric from './types/foscam-r2m.js';

/**
 * @type {Promise<status>}
 */
let checkRunning = null;
export let camera;

/**
 * Check if the camera is up and running
 *
 * @returns {Promise<Status>} resolve when check is done and result dispatched to the browser
 */
export async function _check() {
	if (checkRunning != null) {
		return checkRunning;
	}

	checkRunning = camera.check()
		.then(checkResponse => {
			/*
			 * During this first phase, we calculate the newCode, but we don't set it
			 * because it need a up/down call that will be done in the second phase
			 */
			switch (checkResponse.state) {
				case TriStates.READY:
					if ((++camera.status.successes) < camera.config.nbCheck) {
						// We want enough sucesses before showing it (= 10 seconds) ...
						camera.status.message = `Stabilizing (${camera.status.successes}/${camera.config.nbCheck})`;
						return TriStates.UP_NOT_READY;
					}
					camera.status.message = 'Ready !';
					return TriStates.READY;

				case TriStates.UP_NOT_READY:
				case TriStates.DOWN:
					camera.status.message = 'Received an error from the camera: ' + checkResponse.message;
					return TriStates.DOWN;
			}
			return TriStates.DOWN;
		}, err => {
			/*
			 * These error case are network related,
			 * handled here to lighten the camera specific handler
			 *
			 * Principle is same as above
			 */
			camera.status.message = 'Received network error, disabling camera:' + (err.message ?? '-no message-');

			if (!err.code) {
				return TriStates.DOWN;
			}

			switch (err.code) {
				case 'ECONNREFUSED':
				case 'ETIMEDOUT':
					camera.status.message = 'Starting up...';
					return TriStates.UP_NOT_READY;
				case 'EHOSTUNREACH':
				default:
					return TriStates.DOWN;
			}

		})
		.then(async (newCode) => {
			const oldCode = camera.status.code;
			if (oldCode != newCode) {
				camera.status.code = newCode;
				if (newCode == TriStates.DOWN) {
					camera.status.successes = 0;
				}
				app.debug(`Going from ${oldCode} to ${newCode} with status`, camera.status);
				if (newCode == TriStates.READY) {
					await camera.up();
				}
				if (oldCode == TriStates.READY) {
					await camera.down();
				}
			}
			app.debug('Received camera status', camera.status);
			app.setState({
				...app.getState(),
				...camera.status
			});
			app.debug('CameraApp status is now', app.getState());
			return newCode;
		})
		.finally(() => { checkRunning = null; });

	return checkRunning;
}

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export function init() {
	camera = new cameraGeneric(app, app.getConfig());
	app.setState({
		...camera.status
	});

	// Make 2 checks to be sure that we are in the correct state since startup
	_check()
		.then(() => _check())
		.then(() => _check());

	app.cron(_check, camera.config['cron-recheck']);
	return app;
}

init();
