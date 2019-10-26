
const loggerFactory = require('../../server/server-logger.js');
const logger = loggerFactory('jasmine');

// Auto mock clock

jasmine.clock().install();
jasmine.clock().mockDate(new Date(2019, 1, 1, 12, 0, 0));
logger.info('Mocking date to ', new Date());

afterAll(() => {
	jasmine.clock().uninstall();
});
