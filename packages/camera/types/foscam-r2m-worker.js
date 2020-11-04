
import express from 'express';
import fetch from 'node-fetch';
import child_process from 'child_process';

import { getUrl } from './foscam-r2m-common.js';
import { workerGetLogger, workerGetConfig, workerSendMessage } from '../../../server/server-lib-worker.js';
import { LoggerSender } from '../../../server/server-lib-logger.js';

/** @type {LoggerSender} logger - where to send the logs */
const logger = workerGetLogger();
const config = workerGetConfig();

logger.debug('Worker is starting');

const expressApp = express();
let serverListener = null;
let ffmpeg = null;

expressApp.get('/video', (_req, res) => {
	// Thanks to https://stackoverflow.com/q/28946904/1954789

	// Only one at a time ?
	// if (ffmpeg) {
	// 	logger.debug('Killing previous ffmpeg');
	// 	ffmpeg.kill();
	// 	ffmpeg = false;
	// }

	res.header('content-type', 'video/webm');

	const cmd = `ffmpeg -loglevel fatal -i rtsp://${config.username}:${config.password}@${config.host}:${config.port}/videoSub -c:v copy -an -bsf:v h264_mp4toannexb -maxrate 500k -f matroska -`.split(' ');
	logger.debug('ffmpeg command: ', cmd);

	ffmpeg = child_process.spawn(cmd[0], cmd.splice(1), {
		stdio: ['ignore', 'pipe', 'ignore']
		// stdio: ['ignore', 'pipe', process.stderr]
	});

	ffmpeg.stdio[1].pipe(res);

	res.on('close', () => {
		logger.debug('Http flow ended, killing ffmpeg');
		ffmpeg.kill();
		ffmpeg = null;
	});
});

/**
 * @param {number} ms - milliseconds to wait before resolving the promise
 * @returns {function(*): *} - the promise that will resolve
 */
function waitMilliseconds(ms) {
	return (data) => {
		return new Promise(resolve => {
			setTimeout(
				() => resolve(data),
				ms
			);
		});
	};
}

/**
 * @returns {Promise} resolve when configure is done
 */
export async function configure() {
	if (!config.configure) {
		logger.info('Skipping configure by config');
		return;
	}

	/** @type {Promise<*>} */
	let p = Promise.resolve();

	const now = new Date();
	p = p
		.then(() => fetch(getUrl('setting time', logger, config, {
			cmd: 'setSystemTime',
			timeSource: 1,
			year: now.getFullYear(),
			mon: now.getMonth() + 1,
			day: now.getDate(),
			hour: now.getHours(),
			minute: now.getMinutes(),
			sec: now.getSeconds()
		})));

	// fetch(getUrl('init', logger, config, { cmd: 'getPTZPresetPointList' }))
	// 	.then(responseXMLParser)
	// 	.then(data => {
	// 		const vals = [];
	// 		for (const k of Object.keys(data.CGI_Result)) {
	// 			if (k.startsWith('point')) {
	// 				const v = data.CGI_Result[k][0];
	// 				if (v) {
	// 					vals.push(v);
	// 				}
	// 			}
	// 		}
	// 		logger.info('Available positions: ', vals);
	// 	}, err => logger.error('In getting position\'s names: ', err));
	//
	// fetch(getUrl('goto', logger, config, { cmd: 'ptzGotoPresetPoint', name: config.position }))
	// 	.then(responseXMLParser)

	if (config.position) {
		p = p
			.then(() => fetch(getUrl('reset position', logger, config, {
				cmd: 'ptzReset'
			})))
			.then(waitMilliseconds(5000));

		const move = (field, command) => {
			if (config.position[field]) {
				p = p
					.then(() => fetch(getUrl(`moving ${field}`, logger, config, {
						cmd: command
					})))
					.then(waitMilliseconds(config.position[field]))
					.then(() => fetch(getUrl(`stop mouvement ${field}`, logger, config, {
						cmd: 'ptzStopRun'
					})));
			}

		};
		move('left', 'ptzMoveLeft');
		move('right', 'ptzMoveRight');
		move('up', 'ptzMoveUp');
		move('down', 'ptzMoveDown');
	}

	return p;
}

/**
 * Start the webserver
 *
 * @returns {Promise<string>} with the url
 */
async function generateFlow() {
	return new Promise(resolve => {
		serverListener = expressApp.listen(config.videoPort, () => {
			const realPort = serverListener.address().port;
			const url = `http://localhost:${realPort}/video`;
			logger.debug(`Listening at ${url}`);
			workerSendMessage('url', url);
			resolve(url);
		});
	});
}

generateFlow()
	.then(() => configure())
	.catch(e => console.error(e));

