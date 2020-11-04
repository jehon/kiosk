
import { Worker, parentPort, workerData } from 'worker_threads';

import { loggerAsMessageListener, LoggerSender } from './server-lib-logger.js';

/**
 * @param {string} file - the file containing the worker
 * @param {ServerApp} app - to get some context (logger, etc...)
 * @param {object} data - to pass to the worker (data)
 * @returns {Worker} - the worker
 */
export function createWorker(file, app, data) {
	const worker = new Worker(file, {
		workerData: {
			loggerNamespace: app.loggerNamespace,
			data
		}
	});

	worker.on('message', loggerAsMessageListener);

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
			callback(data);
		}
	}

	worker.on('message', cb);
	return () => worker.removeListener('message', cb);
}

/**
 * Get a message logger for the worker
 *
 * @returns {LoggerSender} the logger
 */
export function workerGetLogger() {
	return new LoggerSender(
		(data) => workerSendData('log', data),
		workerData?.loggerNamespace ?? 'worker'
	);
}

/**
 * @returns {object} the passed argument
 */
export function workerGetData() {
	return workerData?.data ?? {};
}

/**
 * Send a message to the master
 *
 * @param {string} type of the message
 * @param {*} data to be sent
 */
export function workerSendData(type, data) {
	parentPort?.postMessage({
		type,
		data
	});
}
