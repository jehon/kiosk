
import serverAPIFactory from '../../server/server-api.js';
const { ServerAPI, testingConfigOverride, testingConfigRestore } = serverAPIFactory;

import { expectBrowserEvent } from './helpers.mjs';

import '../../packages/clock/clock-server.js';

describe(import.meta.url, () => {
	beforeEach(function() {
		spyOn(ServerAPI.prototype, 'dispatchToBrowser').and.callThrough();
		testingConfigOverride({});
	});

	afterEach(function() {
		testingConfigRestore();
	});

	it('should trigger tickers', async function() {
		testingConfigRestore();
		testingConfigOverride({
			'clock': {
				'tickers':  {
					'clock-server-test-label': {
						cron: '*/2 * * * * *',
						duration: 1
					}
				}
			}
		});

		expectBrowserEvent('clock.ticker', () => {
			jasmine.clock().tick(8 * 1000);
		}, () => {
			expect(ServerAPI.prototype.dispatchToBrowser).toHaveBeenCalledTimes(4);
			expect(ServerAPI.prototype.dispatchToBrowser.calls.argsFor(0)[0]).toBe('clock.ticker');
			expect(ServerAPI.prototype.dispatchToBrowser.calls.argsFor(0)[1].label).toBe('clock-server-test-label');
			expect(ServerAPI.prototype.dispatchToBrowser.calls.argsFor(0)[1].duration).toBe(1);
		});
	});
});
