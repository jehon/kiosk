
const express = require('express');
const expressApp = express();

const getConfig = require('./server-config');
const app = require('./server-api')('server:webserver');

let serverListener = null;

// TODO: restrict the static to exclude some files!
expressApp.use('/media', express.static('/media'));
expressApp.use(express.static('.'));

/**
 * @param {number} [port] where to listen
 * @returns {Promise<number>} firing when server is ready
 */
async function start(port = getConfig('server.webserver.port', 0)) {
	return new Promise(resolve => {
		if (serverListener) {
			const realPort = getPort();
			app.debug(`It was already started on ${realPort}`);
			resolve(realPort);
		}
		serverListener = expressApp.listen(port, () => {
			const realPort = getPort();
			app.debug(`Listening on port ${realPort}!`);
			getConfig.set('server.webserver.port', realPort);
			resolve(realPort);
		});
	});
}

/**
 * @returns {number} the port where the webserver is listening
 */
function getPort() {
	return serverListener.address().port;
}

/**
 * Stop the server if running
 */
function stop() {
	if (!serverListener) {
		app.debug('Webserver was not started');
		return;
	}
	serverListener.close();
	serverListener = false;
}

module.exports = {
	start,
	stop,
	getPort,
	getExpressApp: () => expressApp
};
