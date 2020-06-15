
const { TriStates } = require('../constants.js');
const fetch = /** @type {function(string, *):Promise} */ /** @type {*} */(require('node-fetch'));

/** @typedef {import('../camera-server.js').Logger} Logger */

let initialized = false;

/**
 * @param {Logger} logger - where to send the logs
 * @param {object} config - the configuration of the camera
 * @param {object} data - data to pass
 * @param {string} [cgi] - the cgi script to be called
 * @returns {string} the url to be called
 */
function getUrl(logger, config, data, cgi = '/cgi-bin/CGIProxy.fcgi?') {
	const url = `http://${config.host}:${config.port}${cgi}?usr=${config.username}&pwd=${config.password}&random-no-cache=${(new Date).getTime()}&` + (new URLSearchParams(data).toString());
	logger.debug('Using url: ' + url);
	return url;
}

/**
 * @type {import('../constants.js').CameraAPI}
 */
const cameraAPI = {
	init: async (_logger, _config) => { },

	/**
		* @param {Logger} logger - where to send the logs
		* @param {object} config - camera config
		* @returns {Promise<import('../constants.js').CheckResponse>} when check is successfull
		*/
	check: async (logger, config) => {
		return fetch(getUrl(logger, config, { cmd: 'getDevInfo' }), { method: 'GET' })
			.then(response => {
				if (response.ok) {
					if (!initialized) {
						const urlTime = `${config.host}/cgi-bin/CGIProxy.fcgi?cmd=setSystemTime&timeSource=0&usr=${config.username}&pwd=${config.password}`;
						logger.debug('Setting time: ', urlTime);
						fetch(urlTime);
						initialized = true;
					}
					return { state: TriStates.READY };
				}
				return {
					state: TriStates.UP_NOT_READY,
					message: response.status + ': ' + response.statusText
				};
			}, err => {
				initialized = false;
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

		logger.debug('ffmpeg command: ', cmd);

		var child = child_process.spawn(cmd[0], cmd.splice(1), {
			stdio: ['ignore', 'pipe', process.stderr]
		});

		child.stdio[1].pipe(res);

		// child.on('close', () => console.log('\nclose\n'));
		// child.on('exit', () => console.log('\nexit\n'));
		// child.on('error', () => console.log('\nerror\n'));

		res.on('close', () => {
			console.log('killing ffmpeg');
			child.kill();
		});
		// res.on('exit', () => console.log('\nres exit\n'));
		// res.on('error', () => console.log('\nres error\n'));

	}
};

module.exports = cameraAPI;
