
const express = require('express');
const app = express();

const getConfig = require('./server-config.js');
const logger = require('./server-logger.js')('core:webserver:server');

app.get('**/*.yml', function(req, res, _next) {
	res.end('You are not allowed!');
});

app.use('/', express.static(getConfig('core.root')));

let serverListener = false;

async function start(port = getConfig('core.port')) {
	return new Promise(resolve => {
		if (serverListener) {
			const realPort = getPort();
			logger.debug(`It was already started on ${realPort}`);
			resolve(realPort);
		}
		serverListener = app.listen(port, () => {
			const realPort = getPort();
			logger.info(`Listening on port ${realPort}!`);
			getConfig.set('core.webserver.port', port);
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
	getPort
};
