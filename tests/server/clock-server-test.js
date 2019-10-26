
const { ServerAPI, testingConfigOverride, testingConfigRestore } = require('../../server/server-api.js');
const { expectBrowserEvent } = require('./test-functions.js');

require('../../packages/clock/clock-server.js');

describe(__filename, () => {
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
