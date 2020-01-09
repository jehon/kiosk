
const fetch = require('node-fetch');
const btoa = require('btoa');

const serverAPIFactory = require('../../server/server-api.js');
const app = serverAPIFactory('camera:server');

let successes = 0;
let statusEnabled = false;

const config = {
	'cron-recheck': '*/15 * * * * *',
	host: 'http://localhost',
	username: '',
	password: '',
	imageFeed: '/image.jpg',
	videoFeed: '/video/mjpg.cgi',
	audioFeed: '/audio.cgi',
	...app.getConfig('.')
};
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

const authHeader = 'Basic ' + btoa(config.username + ':' + config.password);

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
			statusEnabled = true;
			return app.dispatchToBrowser('.status', {
				enabled: true,
				config
			});
		})
		.catch(_err => {
			app.debug('Received error, disabling camera', _err.message);
			if (successes > 0) {
				successes = 0;

				// Forcing leaving to camera
				statusEnabled = false;
				app.dispatchToBrowser('.status', { enabled: false });
			}
			return ;
		});
}
_check(true);
module.exports._check = _check;

app.subscribe('.recheck', _check);
app.addSchedule('.recheck', config['cron-recheck']);

module.exports.getStatus = function() {
	if (!statusEnabled) {
		return false;
	}
	return config;
};
