
const path = require('path');

const { createWorker } = require('../../server/server-worker.js');

const { testingConfigOverride, testingConfigRestore } = require('../../server/server-config.js');
const serverAPIFactory = require('../../server/server-api.js');

describe(__filename, () => {
	const workerFile = path.join(__dirname, 'server-worker-test-worker.js');
	const app = serverAPIFactory('server-worker-test');

	describe('with config', function () {
		beforeEach(() => testingConfigOverride({ 'server-worker-test': { test: 1 } }));
		afterEach(() => testingConfigRestore());

		describe('sync', function () {
			it('should create working worker', async function () {
				return createWorker(workerFile, app, {});
			});

			it('should throw if exit with > 0', async function () {
				expectAsync(createWorker(workerFile, app, { exit: 1 })).toBeRejectedWithError();
			});

			it('should throw if thrown', async function () {
				expectAsync(createWorker(workerFile, app, { throw: true })).toBeRejectedWithError();
			});
		});

		describe('async', function () {
			it('should create working worker', async function () {
				return createWorker(workerFile, app, { async: true });
			});

			it('should throw if exit with > 0', async function () {
				expectAsync(createWorker(workerFile, app, { async: true, exit: 1 })).toBeRejectedWithError();
			});

			it('should throw if thrown', async function () {
				expectAsync(createWorker(workerFile, app, { async: true, throw: true })).toBeRejectedWithError();
			});
		});
	});
});
