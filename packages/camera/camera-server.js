
const proxy = require('../../node_modules/express-http-proxy/index.js');
const fetch = require('node-fetch');
const btoa = require('../../node_modules/btoa/index.js');
const Datauri = require('datauri');

const serverAPIFactory = require('../../server/server-api.js');
const app = serverAPIFactory('camera:server');

let successes = 0;

const config = {
	'cron-recheck': '*/15 * * * * *',
	host: 'http://localhost',
	username: '',
	password: '',
	imageFeed: '/image.jpg',
	videoFeed: '/video/mjpg.cgi',
	...app.getConfig('.')
};
const authHeader = 'Basic ' + btoa(config.username + ':' + config.password);
const kioskVideoFeed = '/camera/video';

async function _check(quick = false) {
	const url = `${config.host}${config.imageFeed}?random-no-cache=${(new Date).getTime()}`;
	app.debug(`checking "${url}"`);
	const headers  = new fetch.Headers({
		'Authorization': authHeader
	});
	return fetch(url, { method: 'GET', headers: headers })
		.then(response => {
			if (!response.ok) {
				// Go to the "catch" phase
				// TODO: should pop up and say: hey, we have a problem ! -> activate applic + special image
				app.error('Received the response: ', response.status);
				throw new Error('Invalid response');
			}
			if (++successes < 2 && !quick) {
				// We want at least two sucesses before showing it (= 10 seconds) ...
				app.debug('Waiting for two successes');
				return;
			}
			// TODO: not need the image anymore
			return response.buffer()
				.then(buffer => {
					const datauri = new Datauri();
					// TODO: calculate the contentType from uri extension?
					const contentType = '.jpg';
					datauri.format(contentType, buffer);
					return datauri.content;
				})
				.then(b64URI => app.dispatchToBrowser('.status', {
					enabled: true,
					dataURI: b64URI,
					// imageB64: buffer.toString('base64'),
					liveFeedUrl: kioskVideoFeed
				}));
		})
		.catch(_err => {
			app.debug('Received error, disabling camera', _err.message);
			if (successes > 0) {
				successes = 0;

				// Forcing leaving to camera
				app.dispatchToBrowser('.status', { enabled: false });
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

// Todo: make this dynamic?
app.getExpressApp().use(kioskVideoFeed, proxy(() => config.host,
	addHeader('Authorization',  authHeader, {
		proxyReqPathResolver: (_req) => config.videoFeed
	})
));

app.subscribe('.recheck', _check);
app.addSchedule('.recheck', config['cron-recheck']);

module.exports._check = _check;