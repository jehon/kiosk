
const { TriStates } = require('../constants.js');
const fetch = /** @type {function(string, *):Promise} */ /** @type {*} */(require('node-fetch'));
const path = require('path');

/** @typedef {import('../camera-server.js').Logger} Logger */

const { getUrl } = require('./foscam-r2m-worker.js');
const { createWorker } = require('../../../server/server-worker.js');

/**
 * @type {import('../constants.js').CameraAPI}
 */
const cameraAPI = {
	defaultConfig: () => ({
		port: 88
	}),

	init: async (app) => {
		// return createWorker(path.join(__dirname, 'foscam-r2m-worker.js'), app);
	},

	/**
	 * @param {Logger} logger - where to send the logs
	 * @param {object} config - camera config
	 * @returns {Promise<import('../constants.js').CheckResponse>} when check is successfull
	 */
	check: async (logger, config) => {
		return fetch(getUrl((...args) => logger.debug(...args), config, { cmd: 'getDevInfo' }), { method: 'GET' })
			.then(response => {
				if (response.ok) {
					return { state: TriStates.READY };
				}
				return {
					state: TriStates.UP_NOT_READY,
					message: response.status + ': ' + response.statusText
				};
			}, err => {
				throw err;
			});
	},

	/**
	 * @param {Logger} logger - where to send the logs
	 * @param {any} res - the expressjs response object
	 * @param {object} config - the camera config
	 */
	generateFlow: function (logger, res, config) {
		// Thanks to https://stackoverflow.com/q/28946904/1954789
		const child_process = require('child_process');

		res.header('content-type', 'video/webm');

		const cmd = `ffmpeg -i rtsp://${config.username}:${config.password}@${config.host}:${config.port}/videoSub -c:v copy -an -bsf:v h264_mp4toannexb -maxrate 500k -f matroska -`.split(' ');
		logger.debug('ffmpeg command: ', cmd);

		var child = child_process.spawn(cmd[0], cmd.splice(1), {
			stdio: ['ignore', 'pipe', process.stderr]
		});

		child.stdio[1].pipe(res);

		res.on('close', () => {
			logger.debug('Http flow ended, killing ffmpeg');
			child.kill();
		});
	}
};

module.exports = cameraAPI;
