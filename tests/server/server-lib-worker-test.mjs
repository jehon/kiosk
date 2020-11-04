

import { createWorker, masterWaitWorkerToFinish, masterOnMessage } from '../../server/server-lib-worker.js';
import { ServerLogger } from '../../server/server-lib-logger.js';

import path from 'path';

import { fn, __dirname } from './at-helper.mjs';

const logger = new ServerLogger('test');

describe(fn(import.meta.url), () => {
	const workerFile = path.join(__dirname, 'server-lib-worker-test-worker.mjs');

	it('should launch', async function () {
		const worker = createWorker(workerFile, logger, {
			test: 1
		});
		await masterWaitWorkerToFinish(worker);
	});

	it('should launch and catch message', async function (done) {
		const worker = createWorker(workerFile, logger, {
			test: 1,
			throw: 'test'
		});
		try {
			await masterWaitWorkerToFinish(worker);
			done.fail('Should throw');
		} catch (e) {
			done();
		}
	});

	it('should launch and catch Error', async function (done) {
		const worker = createWorker(workerFile, logger, {
			test: 1,
			throwError: 'test'
		});
		try {
			await masterWaitWorkerToFinish(worker);
			done.fail('Should throw');
		} catch (e) {
			done();
		}
	});

	it('should launch and get exit code', async function (done) {
		const worker = createWorker(workerFile, logger, {
			test: 1,
			exit: 12
		});
		try {
			await masterWaitWorkerToFinish(worker);
			done.fail('Should throw');
		} catch (e) {
			done();
		}
	});

});
