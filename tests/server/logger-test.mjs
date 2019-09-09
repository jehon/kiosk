
import commonLoggerFactory from '../../common/logger.js';

const msgList = [];
const loggerTest = commonLoggerFactory('common-logger-test-test');
const loggerTest2 = commonLoggerFactory('common-logger-test-test2');

describe(import.meta.url, () => {
	beforeEach(() => {
		msgList.length = 0;
		spyOn(process.stdout, 'write').and.callFake((msg) => msgList.push(msg));
	});

	it('should call logs', () => {
		process.stdout.write.calls.reset();
		loggerTest.info('test');
		expect(process.stdout.write).toHaveBeenCalledTimes(1);

		process.stdout.write.calls.reset();
		loggerTest.info('warn');
		expect(process.stdout.write).toHaveBeenCalledTimes(1);

		process.stdout.write.calls.reset();
		loggerTest.debug('test');
		expect(process.stdout.write).toHaveBeenCalledTimes(0);
	});

	it('should define level by logger', () => {
		loggerTest.disableDebug();
		loggerTest2.enableDebug();

		process.stdout.write.calls.reset();
		loggerTest.info('test');
		expect(process.stdout.write).toHaveBeenCalledTimes(1);
	});
});
