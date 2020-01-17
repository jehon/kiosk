
import getConfig  from '../../server/server-config.js';
const { testingConfigOverride, testingConfigRestore } = getConfig;

describe(import.meta.url, () => {
	beforeEach(() => {
		testingConfigOverride({
			test: {
				a: 123
			}
		});
	});

	afterEach(() => {
		testingConfigRestore();
	});

	it('should read values', () => {
		expect(getConfig().test.a).toBe(123);
		expect(getConfig('test.a')).toBe(123);

		expect(getConfig('test.b')).toBeUndefined();
		expect(getConfig('test.b', 456)).toBe(456);
	});
});
