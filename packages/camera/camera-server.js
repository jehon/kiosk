
/**
 * @typedef {import('./constants.js').CheckResponse} CheckResponse
 * @typedef {import('./constants.js').CameraAPI} CameraAPI
 * @typedef {import('./constants.js').TriStates} TriStates
 *
 * @typedef {import('../../server/server-logger.js').Logger} Logger
 *
 */

const { TriStates } = require('./constants.js');

const { app } = require('./constants.js');

app.logger.enableDebug();

const camera = (/** @type {CameraAPI} */ require('./types/foscam-r2m.js'));

/**
 * @returns {object} A configuration
 */
function getConfig() {
	return {
		'cron-recheck': '*/10 * * * * *',
		host: 'localhost',
		port: 80,
		username: '',
		password: '',
		nbCheck: 3,
		...camera.defaultConfig(),
		...app.getConfig('.')
	};
}

/**
 * @typedef Status
 * @property {string} message - user friendly message
 * @property {TriStates} code - see above
 * @property {number} successes - number of TriStates.READY received
 * @property {TriStates} initialized - if the camera has been initialized or not
 */

/**
 * @type {Status}
 */
const defaultStatus = {
	message: '',
	code: TriStates.DOWN,
	successes: 0,
	initialized: TriStates.DOWN
};
const status = Object.assign({}, defaultStatus);

/**
 * @type {Promise<status>}
 */
let checkRunning = null;

/**
 * Check if the camera is up and running
 *
 * @returns {Promise<Status>} resolve when check is done and result dispatched to the browser
 */
async function _check() {
	if (checkRunning != null) {
		return checkRunning;
	}

	const fullConfig = getConfig();
	let newCode = TriStates.DOWN;
	checkRunning = camera.check(app.logger, fullConfig)
		.then(checkResponse => {
			switch (checkResponse.state) {
				case TriStates.READY:
					if ((++status.successes) < fullConfig.nbCheck) {
						// We want enough sucesses before showing it (= 10 seconds) ...
						app.debug(`Waiting for ${fullConfig.nbCheck} successes (${status.successes})`);
						newCode = TriStates.UP_NOT_READY;
						status.message = `Stabilizing (${status.successes}/${fullConfig.nbCheck})`;
					} else {
						status.message = 'Ready !';
						newCode = TriStates.READY;
					}
					break;
				case TriStates.UP_NOT_READY:
					// Go to the "catch" phase
					// TODO: should pop up and say: hey, we have a problem ! -> activate applic + special image
					newCode = TriStates.DOWN;
					status.message = checkResponse.message;
					status.successes = 0;
					break;
				case TriStates.DOWN:
					throw 'down';
			}
			return newCode;
		}, err => {
			newCode = TriStates.DOWN;
			status.successes = 0;
			status.message = 'Received network error, disabling camera:' + (err.message ? err.message : '-no message-');

			app.debug(status.message);
			if (err.code) {
				switch (err.code) {
					case 'ECONNREFUSED':
					case 'ETIMEDOUT':
						newCode = TriStates.UP_NOT_READY;
						status.message = 'Starting up...';
						break;
					case 'EHOSTUNREACH':
					default:
						// default message is ok
						status.initialized = TriStates.DOWN;
						break;
				}
			}
			throw newCode;
		})
		.finally(() => {
			if (status.code != newCode) {
				app.debug(`Going from ${status.code} to ${newCode}`);
			}
			status.code = newCode;
			return app.dispatchToBrowser('.status');
		})
		.then((newCode) => {
			// We do this on the shared object
			if (status.code == TriStates.READY && status.initialized == TriStates.DOWN) {
				status.initialized = TriStates.UP_NOT_READY;
				app.debug('initializing the camera');
				return camera.init(app)
					.finally(() => {
						status.initialized = TriStates.READY;
						return newCode;
					});
			}
			return newCode;
		})
		.then(() => status, () => status)
		.finally(() => { checkRunning = null; });
	return checkRunning;
}

module.exports._check = _check;

// Make 2 checks to be sure that we are in the correct state since startup
_check()
	.then(() => _check())
	.then(() => _check());

app.getExpressApp().get('/camera/feed', (_req, res) => camera.generateFlow(app.logger, res, getConfig()));

// app.getExpressApp().get('/camera/frame', (_req, res) => res.send(`
// 	<div class='full full-background-image' style='background-image: url("${config.host + config.videoFeed}?${Date.now()}")'></div>
// `.trim()));

app.subscribe('.recheck', _check);
app.addSchedule('.recheck', getConfig()['cron-recheck']);

module.exports.getStatus = function () {
	return {
		...getConfig(),
		frameURL: `http://localhost:${app.getConfig('server.webserver.port')}/camera/frame`,
		...status
	};
};
