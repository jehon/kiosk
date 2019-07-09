
import serverAPIFactory, { mockableAPI as mockableAPI } from '../../server/server-api.mjs';

describeHere(() => {
	describe('should serverAPI without context', () => {
		it('should have a bus', async () => {
			let i = 0;
			mockableAPI.subscribe('test.brol', () => i++);
			await mockableAPI.dispatch('test.brol');
			expect(i).toBeGreaterThan(0);
		});

		it('should be mockable', async () => {
			const tt = async() => {
				await mockableAPI.dispatch('test.brol');
			};
			spyOn(mockableAPI, 'dispatch');
			await tt();
			expect(mockableAPI.dispatch).toHaveBeenCalled();
		});
	});

	describe('should serverAPI with context', () => {
		const ctxServerAPI = serverAPIFactory('test');
		it('should have a bus', async () => {
			let i = 0;
			ctxServerAPI.subscribe('test.brol', () => i++);
			await ctxServerAPI.dispatch('test.brol');
			await ctxServerAPI.dispatch('.brol');
			expect(i).toBeGreaterThan(1);
		});

		it('should be mockable', async () => {
			spyOn(mockableAPI, 'dispatch');
			await ctxServerAPI.dispatch('test.brol');
			expect(mockableAPI.dispatch).toHaveBeenCalled();
		});
	});
});
