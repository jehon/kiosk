
const { TriStates } = require('../constants.js');
const fetch = /** @type {function(string, *):Promise} */ /** @type {*} */(require('node-fetch'));

let initialized = false;

/**
 * @type {import('../constants.js').CameraAPI}
 */
const cameraAPI = {
	init: async (_app, _config) => { },

	check: async (config, logger) => {
		const url = `${config.host}/cgi-bin/CGIProxy.fcgi?usr=${config.username}&pwd=${config.password}&cmd=getDevInfo&random-no-cache=${(new Date).getTime()}`;
		logger.debug('Checking url: ' + url);

		return fetch(url, { method: 'GET' })
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

	generateFlow: function (res, config) {
		// Thanks to https://stackoverflow.com/q/28946904/1954789
		const child_process = require('child_process');

		res.header('content-type', 'video/webm');

		const cmd = `ffmpeg -i rtsp://${config.username}:${config.password}@${config.host.replace('http://', '')}/videoSub -c:v copy -an -bsf:v h264_mp4toannexb -maxrate 500k -f matroska -`.split(' ');
		console.log('cmd: ', cmd);

		var child = child_process.spawn(cmd[0], cmd.splice(1), {
			stdio: ['ignore', 'pipe', process.stderr]
		});

		child.stdio[1].pipe(res);

	}
};

module.exports = cameraAPI;
