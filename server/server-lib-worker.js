
import { Worker, parentPort, workerData } from 'worker_threads';

import { loggerAsMessageListener } from './server-lib-logger.js';
import { LoggerSender } from '../common/logger-sender.js';

import { dirname } from 'path';
import { fileURLToPath } from 'url';
export const __dirname = (url) => dirname(fileURLToPath(url));


/**
 * @param {string} file - the file containing the worker
 * @param {module:server/ServerApp} app - to get some context (logger, etc...)
 * @param {object} data - to pass to the worker (data)
 * @returns {Worker} - the worker
 */
export function createWorker(file, app, data) {
	const wNs = app.loggerNamespace + ':worker';
	app.debug(`Creating worker ${file} on ${wNs} with`, data);
	const worker = new Worker(file, {
		workerData: {
			loggerNamespace: wNs,
			data
		}
	});

	masterOnMessage(worker, LoggerSender.MESSAGE_TYPE, (payload) => loggerAsMessageListener(payload));

	worker.on('error', err => app.error(`Worker: ${file} emitted an error: ${err}`));

	worker.on('exit', code => {
		if (code !== 0) {
			app.error(new Error(`Worker: ${file} stopped with exit code ${code}`));
		} else {
			app.debug(`Worker: ${file} ended`);
		}
	});

	return worker;
}

/**
 * @param {Worker} worker to wait for
 * @returns {Promise<void>} when the worker exit
 */
export async function masterWaitWorkerToFinish(worker) {
	return new Promise((resolve, reject) =>
		worker.on('exit', code => code == 0 ? resolve() : reject(code))
	);
}

/**
 * @param {Worker} worker that will emit the message
 * @param {string} type to be listened to
 * @param {function(*): void} callback to be called on message
 * @returns {function(): void} to stop the listening
 */
export function masterOnMessage(worker, type, callback) {
	/**
	 *  @param {*} data received on the channel
	 */
	function cb(data) {
		if (data.type == type) {
			callback(data.payload);
		}
	}

	worker.on('message', cb);
	return () => worker.removeListener('message', cb);
}

/**
 * Send a message to the worker
 *
 * @param {Worker} worker where to send
 * @param {string} type of the message
 * @param {any} payload to be sent
 */
export function masterSendMessage(worker, type, payload) {
	worker.postMessage({
		type,
		payload
	});
}

/**
 * Get a message logger for the worker
 *
 * @returns {LoggerSender} the logger
 */
export function workerGetLogger() {
	return new LoggerSender(
		(data) => workerSendMessage(LoggerSender.MESSAGE_TYPE, data),
		workerData?.loggerNamespace ?? 'worker'
	);
}

/**
 * @returns {object} the passed argument
 */
export function workerGetConfig() {
	return workerData?.data ?? {};
}

/**
 * Send a message to the master
 *
 * @param {string} type of the message
 * @param {*} payload to be sent
 */
export function workerSendMessage(type, payload) {
	parentPort?.postMessage({
		type,
		payload
	});
}

/**
 * @param {string} type of message
 * @param {function(object): void} callback to be called
 * @returns {function(void):void} to unregister the listener
 */
export function workerOnMessage(type, callback) {
	const cb = function (data) {
		if (data.type == type) {
			callback(data.payload);
		}
	};

	parentPort.on('message', cb);

	return () => parentPort.removeListener('message', cb);
}
