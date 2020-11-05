
import { reset, sentList } from './electron-helper.js';

import clientLoggerFactory from '../../client/client-lib-logger.js';
import { LoggerSender } from '../../common/logger-sender.js';

import { fn } from './at-helper.js';

describe(fn(import.meta.url), () => {
	beforeEach(() => {
		reset();
		spyOn(console, 'info');
		spyOn(console, 'error');
		spyOn(console, 'debug');
	});

	it('should instanciate', function () {
		const logger = clientLoggerFactory('test');
		logger.info('my info');
		logger.error('my error');
		logger.debug('my debug');

		expect(sentList[0]).toEqual({ channel: 'log', payload: { namespace: 'kiosk:test:client', level: LoggerSender.LEVEL_INFO, content: ['my info'] } });
		expect(sentList[1]).toEqual({ channel: 'log', payload: { namespace: 'kiosk:test:client', level: LoggerSender.LEVEL_ERROR, content: ['my error'] } });
		expect(sentList[2]).toEqual({ channel: 'log', payload: { namespace: 'kiosk:test:client', level: LoggerSender.LEVEL_DEBUG, content: ['my debug'] } });
		expect(sentList.length).toBe(3);

		expect(console.info).toHaveBeenCalledTimes(1);
		expect(console.error).toHaveBeenCalledTimes(1);
		expect(console.debug).toHaveBeenCalledTimes(1);
	});
});
