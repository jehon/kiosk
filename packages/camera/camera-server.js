
const fetch = require('node-fetch');
const btoa = require('btoa');

const serverAPIFactory = require('../../server/server-api.js');
const app = serverAPIFactory('camera:server');

let successes = 0;
let status = {
	enabled: false
};

const config = {
	'cron-recheck': '*/15 * * * * *',
	host: 'http://localhost',
	username: '',
	password: '',
	imageFeed: '/image.jpg',
	videoFeed: '/video/mjpg.cgi',
	audioFeed: '/audio.cgi',
	errMessage: 'No error received',
	...app.getConfig('.'),
};

app.registerCredentials(config.host, config.username, config.password);

/**
 * From: http://forums.dlink.com/index.php?topic=58565.0
 * view functions:
  1   mvideo.htm      stream   admin or user
  2   lphone.htm      stream   admin or user
  3   mjpeg.cgi      stream   admin or user
  4   mobile.htm      still   admin or user
  5   iphone.htm      still   admin or user
  6   image/jpeg.cgi   still   admin or user
  V   video.cgi      stream   admin only?
  A   audio.cgi      audio   admin only?

 */

app.getExpressApp().get('/camera/frame', (req, res) => res.send(`
	<div class='full full-background-image' style='background-image: url("${config.host + config.videoFeed}?${Date.now()}")'></div>
`.trim()));

const authHeader = 'Basic ' + btoa(config.username + ':' + config.password);

async function _check() {
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
				status = {
					enabled: false,
					errMessage: response.status + ': ' + response.statusText,
				};
				return app.dispatchToBrowser('.status');
			}
			if (++successes < 2) {
				// We want at least two sucesses before showing it (= 10 seconds) ...
				app.debug('Waiting for two successes');
				status.errMessage = 'Waiting for two sucesses before enabling it';
				return;
			}
			app.debug('Activating camera');
			status = {
				enabled: true
			};
			return app.dispatchToBrowser('.status');
		}, _err => {
			app.debug('Received network error, disabling camera', _err.message);
			if (successes > 0) {
				successes = 0;

				// Forcing leaving to camera
				status = {
					enabled: false,
					errMessage: 'Received network error, disabling camera:' + (_err.message ? _err.message : '-no message-'),
				};
				return app.dispatchToBrowser('.status');
			}
		});
}
module.exports._check = _check;

// Make 2 checks to be sure that we are in the correct state since startup
_check()
	.then(() => _check())
	.then(() => _check())
;

app.subscribe('.recheck', _check);
app.addSchedule('.recheck', config['cron-recheck']);

module.exports.getStatus = function() {
	return { ...status, ...config,
		frameURL: `http://localhost:${app.getConfig('core.webserver.port')}/camera/frame`
	};
};
