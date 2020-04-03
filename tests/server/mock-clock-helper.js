beforeAll(() => {
	// Mocking the time
	const mockDate = new Date(2019, 1, 1, 12, 0, 0);
	jasmine.clock().install();
	jasmine.clock().mockDate(mockDate);
	console.info('Mocking date to ', mockDate);
});

afterAll(() => {
	jasmine.clock().uninstall();
});
