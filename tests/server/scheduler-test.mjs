
import Scheduler from '../../server/server-scheduler.mjs';

describe(import.meta.url, function() {
	it('should trigger events', function() {
		let i = 0;
		let scheduler = new Scheduler({
			dispatch: () => i++
		});
		let cancelCron = scheduler.addCron('scheduler.test', '* * * * * *', 0, 2);

		jasmine.clock().tick(2000);
		expect(i).toBeGreaterThan(0);
		cancelCron();

		i = 0;
		jasmine.clock().tick(2000);
		expect(i).toBe(0);
	});
});
