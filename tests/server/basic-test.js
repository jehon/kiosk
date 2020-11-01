
describe(__filename, () => {
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
				jasmine.clock().tick(2000);
				expect(i).toBeGreaterThan(0);

			});
		});
	});
});
