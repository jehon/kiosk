
import { tick } from '../client/helper-main.js';
import { fn } from './helper-main.js';

describe(fn(import.meta.url), () => {
	it('should be true', () => {
		expect(true).toBeTruthy();
	});

	describe('shoudl handle timeout', function () {
		it('inside of test environment', () => {
			const mockDate = new Date(2019, 0, 1, 12, 10, 0);
			jasmine.clock().withMock(function () {
				jasmine.clock().mockDate(mockDate);

				let i = 0;
				setTimeout(() => {
					i++;
				}, 1000);
				tick({ seconds: 2 });

				expect(i).toBeGreaterThan(0);
			});
		});
	});
});
