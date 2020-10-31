
import '../../packages/clock/clock-server.mjs';
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
						cron: '*/2 * * * * *',
						duration: 1
					}
				}
			}
		});

		const i = new Date();
		jasmine.clock().tick(((i.getMinutes() - i.getMinutes() % 2 + 2) * 60) * 1000);

		// 	}, () => {
		// 		expect(ServerAPI.prototype.dispatchToBrowser).toHaveBeenCalledTimes(4);
		// 		expect(ServerAPI.prototype.dispatchToBrowser.calls.argsFor(0)[0]).toBe('clock.ticker');
		// 		expect(ServerAPI.prototype.dispatchToBrowser.calls.argsFor(0)[1].label).toBe('clock-server-test-label');
		// 		expect(ServerAPI.prototype.dispatchToBrowser.calls.argsFor(0)[1].duration).toBe(1);
		// 	});
	});
});
