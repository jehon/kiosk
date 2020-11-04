
import {
	workerGetData,
	workerSendData,
	workerGetLogger
} from '../../server/server-lib-worker.js';

const logger = workerGetLogger();
const data = workerGetData();

console.log('data', data);

logger.debug('test log debug');
logger.info('test log info');

if (data.arg) {
	logger.debug('Sending message', 'test', data.arg);
	workerSendData('test', data.arg);
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
