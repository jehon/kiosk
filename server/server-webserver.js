
const express = require('express');
const app = express();

const getConfig = require('./server-config.js');
const logger = require('./server-logger.js')('core:webserver');

let serverListener = false;

// TODO: restrict the static to exclude some files!
app.use('/media', express.static('/media'));
app.use(express.static('.'));

async function start(port = getConfig('core.port')) {
	return new Promise(resolve => {
		if (serverListener) {
			const realPort = getPort();
			logger.debug(`It was already started on ${realPort}`);
			resolve(realPort);
		}
		serverListener = app.listen(port, () => {
			const realPort = getPort();
			logger.debug(`Listening on port ${realPort}!`);
			getConfig.set('core.webserver.port', realPort);
			resolve(realPort);
		});
	});
}

function getPort() {
	return serverListener.address().port;
}

function stop() {
	if (!serverListener) {
		logger.debug('Webserver was not started');
		return;
	}
	serverListener.close();
	serverListener = false;
}

module.exports = {
	start,
	stop,
	getPort,
	getExpressApp: () => app
};
