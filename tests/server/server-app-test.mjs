
import serverAppFactory from '../../server/server-app.mjs';
import { fn } from './at-helper.mjs';

describe(fn(import.meta.url), () => {
	it('should build', function () {
		const app = serverAppFactory('test');
		expect(app.name).toBe('test');
		expect(app.streams.log.namespace).toBe('kiosk:test:server*');
		expect(app.streams.debug.namespace).toBe('kiosk:test:server');
	});

	it('should extend', function () {
		const appMain = serverAppFactory('test');
		const app = appMain.extend('child');
		expect(app.name).toBe('test');
		expect(app.streams.log.namespace).toBe('kiosk:test:server:child*');
		expect(app.streams.debug.namespace).toBe('kiosk:test:server:child');

		const app2 = app.extend('grandchildre');
		expect(app2.name).toBe('test');
		expect(app2.streams.log.namespace).toBe('kiosk:test:server:child:grandchildre*');
		expect(app2.streams.debug.namespace).toBe('kiosk:test:server:child:grandchildre');
	});

	it('should handle cron with 6 elements', function () {
		let i = 0;
		const app = serverAppFactory('test');

		jasmine.clock().withMock(function () {
			jasmine.clock().mockDate(new Date(2019, 0, 1, 12, 0, 0));

			// Every seconds
			let cancelCron = app.cron(() => i++, '* * * * * *', 0, 2);

			jasmine.clock().tick(2000 + 1);
			expect(i).toBe(2);
			cancelCron();

			i = 0;
			jasmine.clock().tick(2000 + 1);
			expect(i).toBe(0);

		});

	});

	it('should handle cron with 5 elements', function () {
		let i = 0;
		const app = serverAppFactory('test');

		jasmine.clock().withMock(function () {
			jasmine.clock().mockDate(new Date(2019, 0, 1, 12, 0, 0));

			// Without the first element (seconds), seconds are taken as "0" i.e. every minute
			let cancelCron = app.cron(() => i++, '* * * * *', 0, 2);

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
			let cancelCron = app.cron(() => i++, '0 5 * * *', 2 * 60, 2);

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
			let cancelCron = app.cron(() => i++, '0 11 * * *', 2 * 60, 2);

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
});
