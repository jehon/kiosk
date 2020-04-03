
const Scheduler = require('../../server/server-scheduler.js');

describe(__filename, function () {
	it('should trigger events', function () {
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
