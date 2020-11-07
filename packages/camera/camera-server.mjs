
import serverAppFactory from '../../server/server-app.js';
import { TriStates } from './constants.js';

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory('camera');
export default app;

import cameraGeneric from './types/foscam-r2m.js';

/**
 * @typedef Status
 * @property {TriStates} code - see above
 * @property {string} message - user friendly message
 * @property {number} successes - number of TriStates.READY received
 * @property {number} nbCheck - the total number of checks
 * @property {string} url of the video feed
 */

/**
 * @type {Promise<Status>}
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

	/** @type {Status} */
	const newStatus = app.getState();
	newStatus.nbCheck = camera.config.nbCheck;

	checkRunning = camera.check()
		.then(() => {
			/*
			 * During this first phase, we calculate the newCode, but we don't set it
			 * because it need a up/down call that will be done in the second phase
			 */
			newStatus.successes = app.getState().successes + 1;

			if (newStatus.successes < newStatus.nbCheck) {
				// We want enough sucesses before showing it (= 10 seconds) ...
				newStatus.code = TriStates.UP_NOT_READY;
				newStatus.message = `Stabilizing (${newStatus.successes}/${newStatus.nbCheck})`;
				newStatus.url = '';
			} else {
				newStatus.code = TriStates.READY;
				newStatus.message = 'Ready !';
				newStatus.successes = newStatus.nbCheck;
				// url is kept
			}
		}, err => {
			/*
			 * These error case are network related,
			 * handled here to lighten the camera specific handler
			 *
			 */
			newStatus.code = TriStates.DOWN;
			newStatus.message = 'Received network error, disabling camera:' + (err.message ?? '-no message-');
			newStatus.successes = 0;
			newStatus.url = '';

			if (err.code) {
				switch (err.code) {
					case 'ECONNREFUSED':
					case 'ETIMEDOUT':
						newStatus.code = TriStates.UP_NOT_READY;
						newStatus.message = 'Camera is booting...';
						break;
					case 'EHOSTUNREACH':
					default:
						break;
				}
			}
		})
		.then(() => {
			const oldStatus = app.getState();
			if (oldStatus.code != newStatus.code) {
				app.debug(`Going from ${oldStatus.code} to ${newStatus.code} with status`, newStatus);
				if (newStatus.code == TriStates.READY) {
					// From off to on
					app.debug('Turning up the camera');
					return camera.up().then((url) => {
						app.debug('Setting url to ', url);
						newStatus.url = url;
					});
				}
				if (oldStatus.code == TriStates.READY) {
					// From on to off
					app.debug('Turning down the camera');
					return camera.down();
				}
			}
		})
		.then(() => {
			app.setState(newStatus);
			app.debug('CameraApp status is now', app.getState());
		})
		.finally(() => { checkRunning = null; });

	return checkRunning;
}

let cronStop = null;

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export async function init() {
	if (cronStop) {
		cronStop();
		cronStop = null;
	}

	camera = new cameraGeneric(app, app.getConfig('.hardware'));
	app.setState({
		code: TriStates.DOWN,
		message: 'Not tested',
		successes: 0,
		nbCheck: camera.config.nbCheck,
		url: ''
	});

	// Make 2 checks to be sure that we are in the correct state since startup

	cronStop = app.cron(_check, app.getConfig('.cron', ''));
	if (checkRunning) {
		await checkRunning;
	}

	return app;
}

init();
