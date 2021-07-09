
import { Logger } from '../../common/logger.js';
import { fn } from './helper-main.mjs';

describe(fn(import.meta.url), () => {
    let records = [];
    const loggerStreamFunctinoBuilder = (namespace, level) =>
        (...data) => {
            records.push({ level, data: data });
        };

    beforeEach(() => {
        records.length = 0;
    });

    it('should instanciate', function () {
        const logger = new Logger('test', loggerStreamFunctinoBuilder);
        expect(logger.name).toBe('kiosk:test');

        logger.info('info');
        logger.debug('debug');
    });

    it('should not throw', function () {
        const logger = new Logger('test', loggerStreamFunctinoBuilder);

        logger.error('an error in logs');
        logger.info('an info in logs');
        logger.debug('a debug in logs should not be visible');
    });
});
