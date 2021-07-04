
import app, { init, wakeUp } from '../../packages/caffeine/caffeine-server.mjs';
import getConfig, { setConfig } from '../../server/server-lib-config.js';

import { fn } from './helper-main.mjs';

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
			'caffeine': {
				simulateActivityMinutes: 0.5
			}
		});

		jasmine.clock().install();
		jasmine.clock().mockDate(new Date(2019, 0, 1, 12, 0, 1));

		try {

			init();
			expect(app.getState().lastRun).toBeNull();

			try {
				await wakeUp();
			} catch (_e) {
				// Error is not important
				true;
			}

			// Jump
			jasmine.clock().tick(2 * 60 * 1000);
			expect(app.getState().lastRun).not.toBeNull();
		} finally {
			jasmine.clock().uninstall();
		}
	});
});
