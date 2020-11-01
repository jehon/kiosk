
import app, { init } from '../../packages/clock/clock-server.mjs';
import getConfig, { setConfig } from '../../server/server-lib-config.mjs';

import { fn } from './at-helper.mjs';

describe(fn(import.meta.url), () => {
	let cfg;
	beforeAll(() => {
		cfg = getConfig();
	});

	afterAll(() => {
		setConfig('', cfg);
	});

	it('should trigger tickers', async function () {
		setConfig('', {
			'clock': {
				'tickers': {
					'clock-server-test-label': {
						cron: '*/2 * * * *',
						duration: 1
					}
				}
			}
		});

		jasmine.clock().withMock(function () {
			jasmine.clock().mockDate(new Date(2019, 0, 1, 12, 1, 1));

			init();
			expect(app.getState().currentTicker).toBeDefined();
			expect(app.getState().currentTicker).toBeNull();

			// Jump 1 minute
			jasmine.clock().tick(60 * 1000);

			expect(app.getState().currentTicker).toBeDefined();
			expect(app.getState().currentTicker).not.toBeNull();
			expect(app.getState().currentTicker.name).toBe('clock-server-test-label');
		});
	});

	it('should trigger past tickers according to duration', async function () {
		setConfig('', {
			'clock': {
				'tickers': {
					'clock-server-test-duration': {
						// At 11:00
						cron: '0 11 * * *',
						// For 2 hours
						duration: 2 * 60 * 1000
					}
				}
			}
		});

		jasmine.clock().withMock(function () {
			jasmine.clock().mockDate(new Date(2019, 0, 1, 12, 0, 0));

			init();

			expect(app.getState().currentTicker).toBeDefined();
			expect(app.getState().currentTicker).not.toBeNull();
			expect(app.getState().currentTicker.name).toBe('clock-server-test-duration');
		});
	});
});
