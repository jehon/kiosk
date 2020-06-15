
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

const config = {
	'cron-recheck': '*/10 * * * * *',
	host: 'localhost',
	port: 80,
	username: '',
	password: '',
	...app.getConfig('.')
};

const camera = (/** @type {CameraAPI} */ require('./types/foscam-r2m.js'));

/**
 * @typedef Status
 * @property {string} message - user friendly message
 * @property {TriStates} code - see above
 * @property {number} successes - number of TriStates.READY received
 * @property {boolean} initialized - if the camera has been initialized or not
 */

/**
 * @type {Status}
 */
const defaultStatus = {
	message: '',
	code: TriStates.DOWN,
	successes: 0,
	initialized: false
};
const status = Object.assign({}, defaultStatus);

/**
 * Check if the camera is up and running
 *
 * @returns {Promise<Status>} resolve when check is done and result dispatched to the browser
 */
async function _check() {
	/** @type {Status} */
	let newStatus = Object.assign({}, {
		message: '',
		code: TriStates.DOWN,
		successes: status.successes,
		initialized: status.initialized
	});
	return camera.check(app.logger, config)
		.then(checkResponse => {
			switch (checkResponse.state) {
				case TriStates.READY:
					if ((++newStatus.successes) < config.nbCheck) {
						// We want enough sucesses before showing it (= 10 seconds) ...
						app.debug('Waiting for ${nbCheck} successes');
						newStatus.code = TriStates.UP_NOT_READY;
						newStatus.message = `Stabilizing (${newStatus.successes}/${config.nbCheck})`;
						newStatus.code = TriStates.UP_NOT_READY;
					} else {
						newStatus.message = 'Ready !';
						newStatus.code = TriStates.READY;
					}
					break;
				case TriStates.UP_NOT_READY:
					// Go to the "catch" phase
					// TODO: should pop up and say: hey, we have a problem ! -> activate applic + special image
					newStatus.code = TriStates.DOWN;
					newStatus.message = checkResponse.message;
					newStatus.successes = 0;
					break;
				case TriStates.DOWN:
					throw 'down';
			}
			return newStatus;
		}, err => {
			newStatus.code = TriStates.DOWN;
			newStatus.successes = 0;
			newStatus.message = 'Received network error, disabling camera:' + (err.message ? err.message : '-no message-');

			app.debug(newStatus.message);
			if (err.code) {
				switch (err.code) {
					case 'ECONNREFUSED':
					case 'ETIMEDOUT':
						newStatus.code = TriStates.UP_NOT_READY;
						newStatus.message = 'Starting up...';
						break;
					case 'EHOSTUNREACH':
					default:
						// default message is ok
						newStatus.initialized = false;
						break;
				}
			}
			throw newStatus;
		})
		.then(newStatus => {
			if (newStatus.code == TriStates.READY && !newStatus.initialized) {
				app.debug('initializing the camera');
				return camera.init(app.logger, config)
					.then(() => {
						newStatus.initialized = true;
						return newStatus;
					});
			}
			return newStatus;
		})
		.finally(() => {
			if (status.code != newStatus.code) {
				app.debug(`Going from ${status.code} to ${newStatus.code}`);
			}
			Object.assign(status, newStatus);
			return app.dispatchToBrowser('.status');
		})
		.then(() => newStatus, () => newStatus);
}

module.exports._check = _check;

// Make 2 checks to be sure that we are in the correct state since startup
_check()
	.then(() => _check())
	.then(() => _check());

app.getExpressApp().get('/camera/feed', (_req, res) => camera.generateFlow(app.logger, res, config));

// app.getExpressApp().get('/camera/frame', (_req, res) => res.send(`
// 	<div class='full full-background-image' style='background-image: url("${config.host + config.videoFeed}?${Date.now()}")'></div>
// `.trim()));

app.subscribe('.recheck', _check);
app.addSchedule('.recheck', config['cron-recheck']);

module.exports.getStatus = function () {
	return {
		...config,
		frameURL: `http://localhost:${app.getConfig('server.webserver.port')}/camera/frame`,
		...status
	};
};
