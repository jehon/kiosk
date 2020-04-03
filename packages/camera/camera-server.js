
// https://www.npmjs.com/package/ping

const fetch = require('node-fetch');
const btoa = require('btoa');

const serverAPIFactory = require('../../server/server-api.js');
const app = serverAPIFactory('camera');

const C_ERROR = 99;
const C_READY = 100;
module.exports.C_READY = C_READY;
module.exports.C_ERROR = C_ERROR;

const config = {
	'cron-recheck': '*/10 * * * * *',
	host: 'http://localhost',
	username: '',
	password: '',
	imageFeed: '/image.jpg',
	videoFeed: '/video/mjpg.cgi',
	audioFeed: '/audio.cgi',
	nbCheck: 3,
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

const defaultStatus = {
	message: '',
	code: 0
};
const status = Object.assign({}, defaultStatus);

async function _check() {
	const url = `${config.host}${config.imageFeed}?random-no-cache=${(new Date).getTime()}`;
	app.debug(`checking "${url}"`);
	const headers = new fetch.Headers({
		'Authorization': authHeader
	});
	return fetch(url, { method: 'GET', headers: headers })
		.then(response => {
			let newStatus = Object.assign({}, status);
			if (response.ok) {
				if ((++newStatus.successes) < config.nbCheck) {
					// We want enough sucesses before showing it (= 10 seconds) ...
					app.debug('Waiting for ${config.nbCheck} successes');
					newStatus.message = `Stabilizing (${newStatus.successes}/${config.nbCheck})`;
					newStatus.code = 10 + newStatus.successes;
				} else {
					app.debug('Activating camera');
					newStatus.code = C_READY;
					newStatus.message = 'Ready';
				}
			} else {
				// Go to the "catch" phase
				// TODO: should pop up and say: hey, we have a problem ! -> activate applic + special image
				app.error('Received the response: ', response.status);
				newStatus.message = response.status + ': ' + response.statusText;
				newStatus.code = C_ERROR;
			}
			return newStatus;
		}, _err => {
			let newStatus = Object.assign({}, status);
			newStatus.code = 0;

			newStatus.successes = 0;
			app.debug('Received network error, disabling camera', _err.message, '[' + _err.code + ']');

			// TODO: affine here -> code = 2 if
			newStatus.code = 0;
			switch (_err.code) {
			case 'ECONNREFUSED':
			case 'ETIMEDOUT':
				newStatus.code = 2;
				newStatus.message = 'Starting up...';
				break;

			case 'EHOSTUNREACH':
			default:
				newStatus.message = 'Received network error, disabling camera:' + (_err.message ? _err.message : '-no message-');
			}

			// Forcing leaving to camera
			return newStatus;
		})
		.then((newStatus) => {
			Object.assign(status, newStatus);
			return app.dispatchToBrowser('.status');
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

module.exports.getStatus = function () {
	return {
		...config,
		frameURL: `http://localhost:${app.getConfig('server.webserver.port')}/camera/frame`,
		...status
	};
};
