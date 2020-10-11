
const serverAPIFactory = require('../../server/server-api.js');
const { ServerAPI } = serverAPIFactory;

describe(__filename, () => {
	// xdescribe('should serverAPI without context', () => {
	// 	it('should have a bus', async () => {
	// 		const app = serverAPIFactory('test');

	// 		let i = 0;
	// 		app.subscribe('test.brol', () => i++);
	// 		await app.dispatch('test.brol');
	// 		expect(i).toBeGreaterThan(0);
	// 	});

	// 	it('should be mockable', async () => {
	// 		const app = serverAPIFactory('test');

	// 		const tt = async () => {
	// 			await app.dispatch('test.brol');
	// 		};
	// 		spyOn(ServerAPI.prototype, 'dispatch');
	// 		await tt();
	// 		expect(ServerAPI.prototype.dispatch).toHaveBeenCalled();
	// 	});
	// });

	// xdescribe('should serverAPI with context', () => {
	// 	const app = serverAPIFactory('test');
	// 	it('should have a bus', async () => {
	// 		let i = 0;
	// 		// This could fire a i++ because of a previously store state
	// 		app.subscribe('test.brol', () => i++);
	// 		i = 0;
	// 		await app.dispatch('test.brol');
	// 		await app.dispatch('.brol');
	// 		expect(i).toBe(2);
	// 	});

	// 	it('should be mockable', async () => {
	// 		const app = serverAPIFactory('test');

	// 		spyOn(ServerAPI.prototype, 'dispatch');
	// 		await app.dispatch('test.brol');
	// 		expect(ServerAPI.prototype.dispatch).toHaveBeenCalled();
	// 	});
	// });
});
