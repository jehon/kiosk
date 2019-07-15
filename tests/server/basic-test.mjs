
describe(import.meta.url, () => {
	it('should be true', () => {
		expect(true).toBeTruthy();
	});

	describe('should handle timeout', function() {
		it('inside of test environment', () => {
			let i = 0;
			setTimeout(() => {
				i++;
			}, 1000);
			jasmine.clock().tick(2000);
			expect(i).toBeGreaterThan(0);
		});
	});
});
