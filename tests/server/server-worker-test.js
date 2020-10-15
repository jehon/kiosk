
const path = require('path');

const { createWorker } = require('../../server/server-worker.js');

const serverAPIFactory = require('../../server/server-api.js');

describe(__filename, () => {
	const workerFile = path.join(__dirname, 'server-worker-test-worker.js');
	const app = serverAPIFactory('server-worker-test');

	describe('with config', function () {
		describe('sync', function () {
			it('should create working worker', async function () {
				return createWorker(workerFile, app, { test: 1 });
			});

			// it('should throw if exit with > 0', async function () {
			// 	expectAsync(createWorker(workerFile, app, { test: 1, exit: 1 })).toBeRejectedWithError();
			// });

			// it('should throw if thrown', async function () {
			// 	expectAsync(createWorker(workerFile, app, { test: 1, throw: true })).toBeRejectedWithError();
			// });
		});

		describe('async', function () {
			it('should create working worker', async function () {
				return createWorker(workerFile, app, { test: 1, async: true });
			});

			it('should throw if exit with > 0', async function () {
				expectAsync(createWorker(workerFile, app, { test: 1, async: true, exit: 1 })).toBeRejectedWithError();
			});

			it('should throw if thrown', async function () {
				expectAsync(createWorker(workerFile, app, { test: 1, async: true, throw: true })).toBeRejectedWithError();
			});
		});
	});
});
