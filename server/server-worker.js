
const { Worker, workerData, isMainThread } = require('worker_threads');
const loggerFactory = require('./server-logger');

/**
 * @param {string} file - the file containing the worker
 * @param {object} app - to get some context (logger, etc...)
 * @param {object} data - to pass to the worker (data)
 * @returns {Promise<void>} - when the worker terminate
 */
module.exports.createWorker = function (file, app, data) {
	return new Promise((resolve, reject) => {
		const worker = new Worker(file, {
			workerData: {
				namespace: app.logger.namespace,
				data
			}
		});
		worker.on('exit', code => {
			if (code !== 0) {
				reject(new Error(`Worker stopped with exit code ${code}`));
			} else {
				resolve();
			}
		});
		worker.on('error', () => reject(new Error('Worker finish in error')));
	});
};

module.exports.initWorker = function (scope) {
	const logger = loggerFactory(workerData.namespace).extend(scope);
	return {
		logger,
		data: workerData.data
	};
};

module.exports.isMainThread = isMainThread;
