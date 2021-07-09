

import { createWorker, masterWaitWorkerToFinish, masterOnMessage, masterSendMessage } from '../../server/server-lib-worker.js';

import path from 'path';

import { fn, __dirname } from './helper-main.mjs';
import { Logger } from '../../common/logger.js';
import { loggerStreamFunctinoBuilderForTest } from './common-logger-test.mjs';
import App from '../../common/app.js';

const logger = new Logger('test', loggerStreamFunctinoBuilderForTest);
const app = new App('test', () => logger);

describe(fn(import.meta.url), () => {
    const workerFile = path.join(__dirname, 'server-lib-worker-test-worker.mjs');

    it('should launch', async function () {
        const worker = createWorker(workerFile, app, {});
        await masterWaitWorkerToFinish(worker);
    });

    it('should get data', async function () {
        const worker = createWorker(workerFile, app, { arg: 1 });
        let i = 0;
        masterOnMessage(worker, 'pong', (payload) => {
            i = i + payload;
        });

        await masterWaitWorkerToFinish(worker);
        expect(i).toBe(1);
    });

    it('should exchange messages', async function () {
        const worker = createWorker(workerFile, app, { arg: 1, wait: 100 });
        let i = 0;
        masterOnMessage(worker, 'pong', (payload) => {
            i = i + payload;
        });

        masterSendMessage(worker, 'ping', 2);

        await masterWaitWorkerToFinish(worker);
        expect(i).toBe(201);
    });

    it('should launch and catch message', async function () {
        const worker = createWorker(workerFile, app, {
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
        const worker = createWorker(workerFile, app, {
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
        const worker = createWorker(workerFile, app, {
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
