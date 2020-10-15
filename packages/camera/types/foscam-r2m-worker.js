
const fetch = /** @type {function(string, *):Promise} */ /** @type {*} */(require('node-fetch'));
// const xml2js = require('xml2js').parseString;

const { initWorker, isMainThread } = require('../../../server/server-worker.js');


/** @typedef {import('../camera-server.js').Logger} Logger */

// /**
//  * From the XML response, get the data
//  *
//  * @param {Response} response - http response
//  * @returns {Promise<object>} The parsed response
//  * @see https://stackoverflow.com/a/41009103/1954789
//  */
// async function responseXMLParser(response) {
// 	return response.text()
// 		.then(str => new Promise(resolve => xml2js(str, (err, data) => {
// 			if (err) throw err;
// 			resolve(data);
// 		})));
// }

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
 * @param {string} subject - shown in debug logs
 * @param {Logger} logger - where to send the logs
 * @param {object} config - the configuration of the camera
 * @param {object} data - data to pass
 * @param {string} [cgi] - the cgi script to be called
 * @returns {string} the url to be called
 */
function getUrl(subject, logger, config, data, cgi = '/cgi-bin/CGIProxy.fcgi?') {
	const url = `http://${config.host}:${config.port}${cgi}?usr=${config.username}&pwd=${config.password}&random-no-cache=${(new Date).getTime()}&` + (new URLSearchParams(data).toString());
	logger.debug(`Using url for ${subject}: ${url}`);
	return url;
}
module.exports.getUrl = getUrl;

/**
 * @param {Logger} logger - where to send the logs
 * @param {object} config - the initial config
 * @returns {Promise} resolve when configure is done
 */
async function configure(logger, config) {
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

	// fetch(getUrl(logger, config, { cmd: 'getPTZPresetPointList' }))
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
	// fetch(getUrl(logger, config, { cmd: 'ptzGotoPresetPoint', name: config.position }))
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

if (!isMainThread) {
	const { logger, data } = initWorker('foscam-r2m-worker');
	configure(logger, data);
}
