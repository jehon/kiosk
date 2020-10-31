

describe(__filename, () => {
	let api;
	let app;
	let backupConfig;

	beforeAll(async () => {
		api = await import('../../server/server-lib-config.mjs');
		const serverApp = await import('../../server/server-app.mjs');
		app = serverApp.default('server');
	});

	beforeEach(() => {
		backupConfig = api.default();
		api.setConfig('', {
			test: {
				a: 123
			}
		});
	});

	afterEach(() => {
		api.setConfig('', backupConfig);
	});

	it('should read values', () => {
		expect(api.default().test.a).toBe(123);
		expect(api.default('test.a')).toBe(123);

		expect(api.default('test.b')).toBeUndefined();
		expect(api.default('test.b', 456)).toBe(456);

		expect(api.default('server.root')).not.toBeNull();
	});

	it('should get/Set', function () {
		expect(api.default('test.getset')).toBeUndefined();
		expect(api.default('test.getset', 456)).toBe(456);
		api.setConfig('test.getset', 123);
		expect(api.default('test.getset')).toBe(123);
	});

	it('should read from file', async () => {
		api.resetConfig();
		await api.loadConfigFromFile(app, ['tests/kiosk.yml']);
		expect(api.default('server.root')).not.toBeNull();
		expect(api.default('server.devMode')).toBeFalse();
	});
});
