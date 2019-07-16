/* eslint-env node */

const proxy = require('express-http-proxy');
const { testServer } = require('../../server-lib/express-utils.js');

const host = '192.168.1.9';

// TODO: Will be obsolete soon ?
module.exports = function(app, cmdLineOptions) {
	if (!cmdLineOptions.local) {
		// For Frame to DS Audio

		// TODO: affine test url...
		app.use('/synology-audio/is-available', testServer(`http://${host}/image.jpg`));

		app.use('/synology-audio/', proxy('192.168.1.9', {
			preserveHostHdr: true,
			proxyReqPathResolver: (req) => '/synology-audio/' + req.url
		}));
	}
};
