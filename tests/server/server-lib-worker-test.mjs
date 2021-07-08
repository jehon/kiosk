

import { createWorker, masterWaitWorkerToFinish, masterOnMessage, masterSendMessage } from '../../server/server-lib-worker.js';
import { ServerLogger } from '../../server/server-lib-logger.js';

import path from 'path';

import { fn, __dirname } from './helper-main.mjs';

const logger = new ServerLogger('test');

describe(fn(import.meta.url), () => {
	const workerFile = path.join(__dirname, 'server-lib-worker-test-worker.mjs');

	it('should launch', async function () {
		const worker = createWorker(workerFile, logger, {});
		await masterWaitWorkerToFinish(worker);
	});

	it('should get data', async function () {
		const worker = createWorker(workerFile, logger, { arg: 1 });
		let i = 0;
		masterOnMessage(worker, 'pong', (payload) => {
			i = i + payload;
		});

		await masterWaitWorkerToFinish(worker);
		expect(i).toBe(1);
	});

	it('should exchange messages', async function () {
		const worker = createWorker(workerFile, logger, { arg: 1, wait: 100 });
		let i = 0;
		masterOnMessage(worker, 'pong', (payload) => {
			i = i + payload;
		});

		masterSendMessage(worker, 'ping', 2);

		await masterWaitWorkerToFinish(worker);
		expect(i).toBe(201);
	});

	it('should launch and catch message', async function () {
		const worker = createWorker(workerFile, logger, {
			throw: 'test'
		});
		try {
			await masterWaitWorkerToFinish(worker);
			expect(false).toBeTrue();
		} catch (e) {
			// Expected
		}
	});

	it('should launch and catch Error', async function () {
		const worker = createWorker(workerFile, logger, {
			throwError: 'test'
		});
		try {
			await masterWaitWorkerToFinish(worker);
			expect(false).toBeTrue();
		} catch (e) {
			// Expected
		}
	});

	it('should launch and get exit code', async function () {
		const worker = createWorker(workerFile, logger, {
			exit: 12
		});
		try {
			await masterWaitWorkerToFinish(worker);
			expect(false).toBeTrue();
		} catch (e) {
			// Expected
		}
	});

});
