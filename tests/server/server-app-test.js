
describe(__filename, () => {
	let api;
	beforeAll(async function () {
		api = await import('../../server/server-app.mjs');
	});

	it('should build', function () {
		const app = api.default('test');
		expect(app.name).toBe('test');
		expect(app.streams.log.namespace).toBe('kiosk:test:server*');
		expect(app.streams.debug.namespace).toBe('kiosk:test:server');
	});

	it('should extend', function () {
		const appMain = api.default('test');
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
		const app = api.default('test');

		let cancelCron = app.cron(() => i++, '* * * * * *', 0, 2);

		jasmine.clock().tick(2000);
		expect(i).toBeGreaterThan(0);
		cancelCron();

		i = 0;
		jasmine.clock().tick(2000);
		expect(i).toBe(0);
	});

	it('should handle cron with 5 elements', function () {
		let i = 0;
		const app = api.default('test');

		let cancelCron = app.cron(() => i++, '* * * * * *', 0, 2);

		jasmine.clock().tick(2 * 60 * 1000);
		expect(i).toBeGreaterThan(0);
		cancelCron();

		i = 0;
		jasmine.clock().tick(2000);
		expect(i).toBe(0);
	});

	it('should handle config', function () {
		const app = api.default('server');
		expect(app.getConfig('server.root')).not.toBeNull();
		expect(app.getConfig('.root')).not.toBeNull();
	});

	it('should not throw', function () {
		const app = api.default('test');

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
