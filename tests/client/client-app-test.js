
import './helper-electron.js';

import { ClientApp, waitForConfig } from '../../client/client-app.js';

import { fn } from './helper-main.js';

describe(fn(import.meta.url), () => {
	it('should instanciate', function () {
		new ClientApp('test');
	});

	it('should build', function () {
		const app = new ClientApp('test');

		expect(app.name).toBe('test');

		app.info('info');
		app.error('error');
		app.debug('debug');
	});

	it('should extend', function () {
		const appMain = new ClientApp('test');
		const logger = appMain.childLogger('child');

		expect(logger.name).toBe('kiosk:test:client:child');
		logger.info('info');
		logger.error('error');
		logger.debug('debug');

		const logger2 = logger.childLogger('grandchild');

		expect(logger2.name).toBe('kiosk:test:client:child:grandchild');
		logger2.info('info');
		logger2.error('error');
		logger2.debug('debug');
	});

	it('should handle simple cron', function () {
		let i = 0;
		const app = new ClientApp('test');

		jasmine.clock().withMock(function () {
			jasmine.clock().mockDate(new Date(2019, 0, 1, 12, 0, 0));

			// Without the first element (seconds), seconds are taken as "0" i.e. every minute
			let cancelCron = app.cron({
				onCron: () => i++,
				cron: '* * * * *',
				duration: 0,
				context: 123
			});

			jasmine.clock().tick(2 * 60 * 1000 + 1);

			expect(i).toBe(2);
			cancelCron();

			i = 0;
			jasmine.clock().tick(2000 + 1);

			expect(i).toBe(0);
		});
	});

	it('should handle not trigger if event is too far in the past', function () {
		let i = 0;
		const app = new ClientApp('test');

		jasmine.clock().withMock(function () {
			// 1-1-2019 at 12:00
			jasmine.clock().mockDate(new Date(2019, 0, 1, 12, 0, 0));

			let cancelCron = app.cron({
				onCron: () => i++,
				// At 5:00
				cron: '0 5 * * *',
				// For 2 hours
				duration: 2 * 60,
				context: 123
			});

			// It should not have fired

			expect(i).toBe(0);
			cancelCron();
		});

	});

	it('should handle cron with event currently running', function () {
		let i = 0;
		const app = new ClientApp('test');

		jasmine.clock().withMock(function () {
			// 1-1-2019 at 12:00
			jasmine.clock().mockDate(new Date(2019, 0, 1, 12, 0, 0));

			let cancelCron = app.cron({
				onCron: () => i++,
				// At 11:00
				cron: '0 11 * * *',
				// For 2 hours
				duration: 2 * 60,
				context: 2
			});

			// It should have fired once
			expect(i).toBe(1);

			// It should end
			jasmine.clock().tick(2 * 60 * 60 * 1000);

			expect(i).toBe(1);
			cancelCron();
		});
	});

	it('should handle config', async function () {
		await waitForConfig;

		const app = new ClientApp('test');

		expect(app.getConfig('test.value.something'))
			.withContext('global')
			.toBe('for testing');

		expect(app.getConfig('.value.something'))
			.withContext('relative to context')
			.toBe('for testing');

		expect(app.getConfig('test.myundefined', 'my default value'))
			.withContext('but undefined')
			.toBe('my default value');
	});
});
