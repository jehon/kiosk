
import './helper-electron.js';

import app, { KioskClockMainElement } from '../../packages/clock/clock-client.js';

import { fn } from './helper-main.js';

describe(fn(import.meta.url), () => {
	it('should react to events', function () {
		expect(app).toBeDefined();
		new KioskClockMainElement();
	});
});
