
import proxy from '../../node_modules/express-http-proxy/index.js';
import fetch from 'node-fetch';
import btoa from '../../node_modules/btoa/index.js';
import Datauri from 'datauri';

import serverAPIFactory from '../../server/server-api.mjs';
const serverAPI = serverAPIFactory('camera');

let successes = 0;

const config = {
	'cron-recheck': '*/15 * * * * *',
	host: 'localhost',
	username: '',
	password: '',
	imageFeed: '/image.jpg',
	videoFeed: '/video/mjpg.cgi',
	...serverAPI.getConfig()
};

const authHeader = 'Basic ' + btoa(config.username + ':' + config.password);

const kioskVideoFeed = '/camera/video';

export async function _check(quick = false) {
	const url = `${config.host}${config.imageFeed}?random-no-cache=${(new Date).getTime()}`;
	serverAPI.logger.debug(`checking "${url}"`);
	const headers  = new fetch.Headers({
		'Authorization': authHeader
	});
	return fetch(url, { method: 'GET', headers: headers })
		.then(response => {
			if (!response.ok) {
				// Go to the "catch" phase
				// TODO: should pop up and say: hey, we have a problem ! -> activate applic + special image
				serverAPI.logger.error('Received the response: ', response.status);
				throw new Error('Invalid response');
			}
			if (++successes < 2 && !quick) {
				// We want at least two sucesses before showing it (= 10 seconds) ...
				serverAPI.logger.debug('Waiting for two successes');
				return;
			}
			return response.buffer()
				.then(buffer => {
					const datauri = new Datauri();
					// TODO: calculate the contentType from uri extension?
					const contentType = '.jpg';
					datauri.format(contentType, buffer);
					return datauri.content;
				})
				.then(b64URI => serverAPI.dispatchToBrowser('.status', {
					enabled: true,
					dataURI: b64URI,
					// imageB64: buffer.toString('base64'),
					liveFeedUrl: kioskVideoFeed
				}));
		})
		.catch(_err => {
			serverAPI.logger.debug('Received error, disabling camera', _err.message);
			if (successes > 0) {
				successes = 0;

				// Forcing leaving to camera
				serverAPI.dispatchToBrowser('.status', { enabled: false });
			}
			return ;
		});
}
_check(true);

function addHeader(name, value, opts = {}) {
	// https://www.npmjs.com/package/express-http-proxy
	opts.preserveHostHdr = true;
	opts.proxyReqOptDecorator = function(proxyReqOpts, _srcReq) {
		proxyReqOpts.headers[name] = value;
		return proxyReqOpts;
	};
	return opts;
}

// if (serverAPI.getConfig('core.local', false)) {
const app = serverAPI.getExpressApp();

// Todo: make this dynamic?
app.use(kioskVideoFeed, proxy(() => config.host,
	addHeader('Authorization',  authHeader, {
		proxyReqPathResolver: (_req) => config.videoFeed
	})
));

serverAPI.subscribe('.recheck', _check);
serverAPI.addSchedule('.recheck', config['cron-recheck']);
