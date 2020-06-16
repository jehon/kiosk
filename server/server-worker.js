
const { Worker, workerData, isMainThread } = require('worker_threads');
const loggerFactory = require('./server-logger');

module.exports.createWorker = function (file, app, data) {
	return new Promise((resolve, reject) => {
		const worker = new Worker(file, {
			workerData: {
				namespace: app.logger.namespace,
				config: app.getConfig('.'),
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
		config: workerData.config,
		data: workerData.data
	};
};

module.exports.isMainThread = isMainThread;
