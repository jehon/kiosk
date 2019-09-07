
import Scheduler from '../../server/scheduler.js';

describe(import.meta.url, function() {
	it('should trigger events', function() {
		let i = 0;
		let scheduler = new Scheduler(() => i++);
		let cancelCron = scheduler.addCron('scheduler.test', '* * * * * *', 0, 2);

		jasmine.clock().tick(2000);
		expect(i).toBeGreaterThan(0);
		cancelCron();

		i = 0;
		jasmine.clock().tick(2000);
		expect(i).toBe(0);
	});

	it('should call functions', function() {
		let i = 0;
		let scheduler = new Scheduler(() => {});
		let cancelCron = scheduler.addCron(() => i++, '* * * * * *', 0, 2);

		jasmine.clock().tick(2000);
		expect(i).toBeGreaterThan(0);
		cancelCron();
	});
});
