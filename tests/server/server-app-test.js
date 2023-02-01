
import serverAppFactory from '../../server/server-app.js';
import { fn } from './helper-main.js';

describe(fn(import.meta.url), () => {
	it('should build', function () {
		const app = serverAppFactory('test');
		expect(app.name).toBe('test');

		app.info('info');
		app.error('error');
		app.debug('debug');
	});

	it('should extend', function () {
		const appMain = serverAppFactory('test');
		const logger = appMain.childLogger('child');
		expect(logger.name).toBe('kiosk:test:server:child');
		logger.info('info');
		logger.error('error');
		logger.debug('debug');

		const logger2 = logger.childLogger('grandchild');
		expect(logger2.name).toBe('kiosk:test:server:child:grandchild');
		logger2.info('info');
		logger2.error('error');
		logger2.debug('debug');
	});

	it('should handle cron with 5 elements', function () {
		let i = 0;
		const app = serverAppFactory('test');

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

	it('should handle cron with past duration', function () {
		let i = 0;
		const app = serverAppFactory('test');

		jasmine.clock().withMock(function () {
			jasmine.clock().mockDate(new Date(2019, 0, 1, 12, 0, 0));

			// At 5:00, for 2 hours
			let cancelCron = app.cron({
				onCron: () => i++,
				cron: '0 5 * * *',
				duration: 2 * 60,
				context: 2
			});

			// It should not have fired

			expect(i).toBe(0);
			cancelCron();
		});

	});

	it('should handle cron with duration', function () {
		let i = 0;
		const app = serverAppFactory('test');

		jasmine.clock().withMock(function () {
			jasmine.clock().mockDate(new Date(2019, 0, 1, 12, 0, 0));

			// At 11:00, for 2 hours
			let cancelCron = app.cron({
				onCron: () => i++,
				cron: '0 11 * * *',
				duration: 2 * 60,
				context: 123
			});

			// It should have fired

			expect(i).toBe(1);
			cancelCron();
		});

	});


	it('should handle config', function () {
		const app = serverAppFactory('server');
		expect(app.getConfig('server.root')).not.toBeNull();
		expect(app.getConfig('.root')).not.toBeNull();
	});

	it('should not throw', function () {
		const app = serverAppFactory('test');

		app.setState({});
		app.setState({ a: 1 });
		app.setState('test');
	});
});
