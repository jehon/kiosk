
const path = require('path');

const express = require('express');

const { getConfig } = require('./server-config.js');
const loggerFactory = require('./server-logger.js');
const logger = loggerFactory('core:webserver:server');

//
// Server with static's
//

const app = express();

app.on('error', e => logger.error('Error starting server: ', e));

// // http://expressjs.com/en/resources/middleware/morgan.html
// const morgan = require('morgan');
// app.use(morgan('dev'));

// Handle POST data correctly
// See https://stackoverflow.com/a/54546000/1954789
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const priorityMiddleware = express.Router();
app.use('/', priorityMiddleware);

// Index is in client
app.get('/',              (req, res) => res.status(301).redirect('/client/index.html'));

// Statis routes
app.use('/favicon.svg',   express.static(path.join(getConfig('core.root'), 'client', 'favicon.svg')));
app.use('/client/',       express.static(path.join(getConfig('core.root'), 'client')));
app.use('/common/',       express.static(path.join(getConfig('core.root'), 'common')));
app.use('/packages/',     express.static(path.join(getConfig('core.root'), 'packages')));
app.use('/node_modules/', express.static(path.join(getConfig('core.root'), 'node_modules')));
app.use('/tests/',        express.static(path.join(getConfig('core.root'), 'tests')));
app.use('/media/',        express.static(path.join(getConfig('core.root'), 'media')));

app.use('/dynamic/',      express.static(path.join(getConfig('core.root'), 'dynamic')));

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

/*
 *
 * Real business here
 *
 */

const getExpressApp = function() { return app; };

module.exports.priorityMiddleware = priorityMiddleware;
module.exports.start = start;
module.exports.getPort = getPort;
module.exports.stop = stop;
module.exports.getExpressApp = getExpressApp;
