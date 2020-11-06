
import {
	ServerLogger,
	loggerAsMessageListener
} from '../../server/server-lib-logger.js';
import { EventEmitter } from 'events';
import { LoggerSender } from '../../common/logger-sender.js';

import { fn } from './helper-main.mjs';


describe(fn(import.meta.url), () => {
	it('should instanciate', function () {
		const app = new ServerLogger('test');
		expect(app.loggerNamespace).toBe('kiosk:test');
		expect(app.streams.log.namespace).toBe('kiosk:test*');
		expect(app.streams.debug.namespace).toBe('kiosk:test');

		app.info('info');
		app.debug('debug');
	});

	it('should not throw', function () {
		const app = new ServerLogger('test');

		app.error('an error in logs');
		app.info('an info in logs');
		app.debug('a debug in logs should not be visible');

		app.enableDebug(true);
		expect(app.isDebugEnabled()).toBeTrue();
		app.debug('a debug in logs should be visible');

		app.enableDebug(false);
		expect(app.isDebugEnabled()).toBeFalse();
		app.debug('a debug in logs should not be visible');
	});

	it('should transmit events', function () {
		const ee = new EventEmitter();
		ee.on('log', loggerAsMessageListener);

		const ls = new LoggerSender((args) => ee.emit('log', args));
		ls.info(1, 2, 3);

		ee.removeListener('log', loggerAsMessageListener);
	});
});
