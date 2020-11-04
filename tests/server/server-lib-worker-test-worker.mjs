
import {
	workerGetConfig,
	workerSendMessage,
	workerGetLogger,
	workerOnMessage
} from '../../server/server-lib-worker.js';

const logger = workerGetLogger();
const data = workerGetConfig();

console.log('data', data);

logger.debug('test log debug');
logger.info('test log info');

const stop = workerOnMessage('ping', (data) => {
	workerSendMessage('pong', data * 100);
});

if (data.arg) {
	logger.debug('Sending message', 'pong', data.arg);
	workerSendMessage('pong', data.arg);
}

if (data.throw) {
	logger.debug('throwing an string with ', data.throw);
	throw 'requested to throw: ' + data.throw;
}

if (data.throwError) {
	logger.debug('throwing an string with ', data.throwError);
	throw new Error('requested to throw: ' + data.throwError);
}

if (data.exit) {
	logger.debug('Exiting with ', data.exit);
	process.exit(data.exit);
}

if (data.wait) {
	logger.info('Waiting', data.wait);
	setTimeout(() => {
		stop();
	}, data.wait);
} else {
	stop();
}
