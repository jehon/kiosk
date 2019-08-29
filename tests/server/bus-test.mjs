
import Bus from '../../common/bus.js';

describe(import.meta.url, () => {
	it('should notify', async function() {
		const bus = new Bus();
		let i = 0;
		bus.subscribe('test', (data) => {
			i++;
			expect(data).toBeFalsy();
		});
		await bus.dispatch('test');
		expect(i).toBe(1);
	});

	it('should handle errors', async function(done) {
		const bus = new Bus();
		spyOn(console, 'error').and.callFake(() => {});
		bus.subscribe('test', () => {
			throw Error('test error');
		});
		try {
			await bus.dispatch('test');
		} catch(e) {
			done.fail('Should not see the error');
		}
		expect(console.error).toHaveBeenCalled();
		done();
	});

	it('should dispatch with data', async function() {
		const bus = new Bus();
		let i = 0;
		bus.subscribe('test', (data) => {
			i++;
			expect(data).toBe(123);
		});
		await bus.dispatch('test', 123);
		expect(i).toBe(1);
	});

	it('should unregister', async function() {
		const bus = new Bus();
		let i = 0;
		let unregister = bus.subscribe('test', () => {
			i++;
		});
		await bus.dispatch('test');
		expect(i).toBe(1);

		unregister();
		await bus.dispatch('test');
		expect(i).toBe(1);
	});

	it('should not fire events on status quo', async function() {
		spyOn(console, 'debug').and.callFake(() => {});
		// This is linked with console by default
		const bus = new Bus();
		let i = 0;
		let expected = 123;

		console.debug.calls.reset();
		bus.subscribe('test', (data) => {
			i++;
			expect(data).toBe(expected);
		});
		await bus.dispatch('test', expected);
		await bus.dispatch('test', expected);
		expect(console.debug).toHaveBeenCalled();
		expect(i).toBe(1);

		expected = 456;
		await bus.dispatch('test', expected);
		expect(i).toBe(2);

		expected = 123;
		await bus.dispatch('test', expected);
		expect(i).toBe(3);

		// with objects
		console.debug.calls.reset();
		expected = { a: 123 };
		await bus.dispatch('test', expected);
		expect(i).toBe(4);

		expected = { a: 123 };
		await bus.dispatch('test', expected);
		expect(i).toBe(4);
		expect(console.debug).toHaveBeenCalled();
	});

	it('should fire last status on event registration', async function() {
		const bus = new Bus();
		let i = 0;
		await bus.dispatch('test', 123);
		bus.subscribe('test', (data) => {
			i++;
			expect(data).toBe(123);
		});
		expect(i).toBe(1);
	});
});
