
const { initWorker } = require('../../server/server-worker.js');


const { logger, data } = initWorker('server-worker-test');


logger.debug('test log debug');
logger.info('test log info');

/**
 * result with ok or exit
 */
function res() {
	if (data.throw) {
		throw 'error as resquested by data.throw';
	}
	if (data.exit) {
		process.exit(data.test);
	}
}

if (data.test == 1) {
	if (data.async) {
		setTimeout(res, 1000);
	} else {
		res();
	}
	logger.info('test ok');
} else {
	throw 'error - no config.test == 1';
}
