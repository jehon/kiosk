
import { mockableAPI as mockableAPI } from '../../server/server-api.mjs';
import { expectBrowserEvent } from './helpers.mjs';

import '../../packages/clock/clock-server.mjs';

describeHere(() => {
	beforeEach(function() {
		spyOn(mockableAPI, 'dispatchToBrowser').and.callThrough();
		mockableAPI.testingConfigOverride({});
	});

	afterEach(function() {
		mockableAPI.testingConfigRestore();
	});

	it('should trigger tickers', async function() {
		mockableAPI.testingConfigRestore();
		mockableAPI.testingConfigOverride({
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
			expect(mockableAPI.dispatchToBrowser).toHaveBeenCalledTimes(4);
			expect(mockableAPI.dispatchToBrowser.calls.argsFor(0)[0]).toBe('clock.ticker');
			expect(mockableAPI.dispatchToBrowser.calls.argsFor(0)[1].label).toBe('clock-server-test-label');
			expect(mockableAPI.dispatchToBrowser.calls.argsFor(0)[1].duration).toBe(1);
		});
	});
});
